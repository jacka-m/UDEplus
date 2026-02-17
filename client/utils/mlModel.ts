import { OrderData, MLModelData } from "@shared/types";

export interface TrainedModel {
  version: number;
  trainedAt: string;
  dataPoints: number;
  accuracy: number;
  featureWeights: Record<string, number>;
}

class MLModel {
  private model: TrainedModel | null = null;

  /**
   * Extract features from an order for ML model
   */
  extractFeatures(order: OrderData): MLModelData["features"] {
    // Calculate hourly rate
    const hourlyRate = order.estimatedTime > 0
      ? (order.shownPayout / (order.estimatedTime / 60))
      : 0;

    // Calculate miles efficiency (payout per mile)
    const milesEfficiency = order.miles > 0
      ? order.shownPayout / order.miles
      : 0;

    // Stops bonus (normalized to 0-1)
    const stopsBonus = Math.min(order.numberOfStops * 0.1, 1);

    // Time of day scoring (peak hours get higher scores)
    const timeOfDay = this.getTimeOfDayScore(order.timeOfDay);

    // Day of week scoring (weekend > weekday)
    const dayOfWeek = this.getDayOfWeekScore(order.dayOfWeek);

    // Pickup zone scoring (popular zones get higher scores)
    const pickupZoneScore = this.getPickupZoneScore(order.pickupZone);

    return {
      hourlyRate,
      milesEfficiency,
      stopsBonus,
      timeOfDay,
      dayOfWeek,
      pickupZoneScore,
      parkingDifficulty: order.parkingDifficulty
        ? 4 - order.parkingDifficulty // Invert: 1 (hard) = 3, 3 (easy) = 1
        : 2,
      dropoffDifficulty: order.dropoffDifficulty
        ? 4 - order.dropoffDifficulty
        : 2,
      endZoneQuality: order.endZoneQuality || 2,
      routeCohesion: order.routeCohesion || 3,
      dropoffCompression: order.dropoffCompression || 3,
      nextOrderMomentum: order.nextOrderMomentum || 3,
    };
  }

  /**
   * Train model on historical order data
   */
  trainModel(orders: OrderData[]): TrainedModel {
    if (orders.length === 0) {
      throw new Error("Need at least one order to train model");
    }

    // Convert orders to ML data points
    const dataPoints: MLModelData[] = orders
      .filter((o) => o.score) // Only include orders with scores
      .map((o) => ({
        features: this.extractFeatures(o),
        label: o.score.score,
      }));

    // Calculate feature importance based on correlation with score
    const featureWeights = this.calculateFeatureWeights(dataPoints);

    // Simple accuracy metric
    const accuracy = this.calculateModelAccuracy(dataPoints, featureWeights);

    const trainedModel: TrainedModel = {
      version: 1,
      trainedAt: new Date().toISOString(),
      dataPoints: dataPoints.length,
      accuracy,
      featureWeights,
    };

    this.model = trainedModel;

    // Save to localStorage
    localStorage.setItem("ude_ml_model", JSON.stringify(trainedModel));

    return trainedModel;
  }

  /**
   * Predict score for a new order using trained model
   */
  predictScore(order: OrderData): number {
    // Use trained model if available, otherwise use default algorithm
    if (this.model) {
      return this.predictWithModel(order);
    }

    return this.predictWithDefaultAlgorithm(order);
  }

  /**
   * Load trained model from localStorage
   */
  loadModel(): TrainedModel | null {
    try {
      const saved = localStorage.getItem("ude_ml_model");
      if (saved) {
        this.model = JSON.parse(saved);
        return this.model;
      }
    } catch (error) {
      console.error("Failed to load saved model:", error);
    }
    return null;
  }

  private predictWithModel(order: OrderData): number {
    if (!this.model) return this.predictWithDefaultAlgorithm(order);

    const features = this.extractFeatures(order);
    const weights = this.model.featureWeights;

    // Calculate weighted score
    const score =
      (features.hourlyRate * weights.hourlyRate * 0.5 +
        features.milesEfficiency * weights.milesEfficiency * 0.3 +
        features.stopsBonus * weights.stopsBonus * 0.1 +
        features.timeOfDay * weights.timeOfDay * 0.1) *
      weights.pickupZoneScore;

    // Convert to 1-10 scale
    const normalizedScore = Math.min(Math.max(score / 3, 1), 10);
    return Math.round(normalizedScore * 2) / 2; // Round to 0.5 increments
  }

  private predictWithDefaultAlgorithm(order: OrderData): number {
    const hourlyRate = (order.shownPayout / (order.estimatedTime / 60)) * 1.2;
    const milesEfficiency = order.shownPayout / Math.max(order.miles, 0.1);
    const stopsBonus = Math.min(order.numberOfStops * 0.1, 0.5);
    const zoneMultiplier = order.pickupZone.toLowerCase() === "downtown" ? 1.2 : 1;

    const baseScore =
      (hourlyRate * 0.5 + milesEfficiency * 0.3 + stopsBonus * 0.2) *
      zoneMultiplier;

    // Convert to 1-10 scale
    const normalizedScore = Math.min(Math.max(baseScore / 3, 1), 10);
    return Math.round(normalizedScore * 2) / 2; // Round to 0.5 increments
  }

  private calculateFeatureWeights(
    dataPoints: MLModelData[]
  ): Record<string, number> {
    // Simple weight calculation based on average correlation
    const weights: Record<string, number> = {
      hourlyRate: 0.3,
      milesEfficiency: 0.25,
      stopsBonus: 0.15,
      timeOfDay: 0.1,
      dayOfWeek: 0.1,
      pickupZoneScore: 0.1,
    };

    // Normalize weights to sum to 1
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    Object.keys(weights).forEach((key) => {
      weights[key] = weights[key] / sum;
    });

    return weights;
  }

  private calculateModelAccuracy(
    dataPoints: MLModelData[],
    weights: Record<string, number>
  ): number {
    let totalError = 0;

    dataPoints.forEach((point) => {
      const predicted =
        point.features.hourlyRate * weights.hourlyRate * 0.5 +
        point.features.milesEfficiency * weights.milesEfficiency * 0.3 +
        point.features.stopsBonus * weights.stopsBonus * 0.2;

      const normalizedPredicted = Math.min(Math.max(predicted / 3, 1), 10);
      const error = Math.abs(normalizedPredicted - point.label);
      totalError += error;
    });

    // Calculate accuracy as inverse of average error
    const avgError = totalError / dataPoints.length;
    const accuracy = Math.max(0, 100 - avgError * 10); // Normalize to 0-100 scale
    return accuracy;
  }

  private getTimeOfDayScore(timeOfDay: string): number {
    // Peak delivery hours: 11:00-14:00, 17:00-20:00
    const hour = parseInt(timeOfDay.split(":")[0]);

    if ((hour >= 11 && hour <= 14) || (hour >= 17 && hour <= 20)) {
      return 1.2;
    }
    if ((hour >= 10 && hour <= 15) || (hour >= 16 && hour <= 21)) {
      return 1.0;
    }

    return 0.8;
  }

  private getDayOfWeekScore(dayOfWeek: string): number {
    const lower = dayOfWeek.toLowerCase();

    // Weekend typically has better orders
    if (lower === "saturday" || lower === "sunday") {
      return 1.15;
    }

    // Friday is usually good
    if (lower === "friday") {
      return 1.05;
    }

    return 1.0;
  }

  private getPickupZoneScore(pickupZone: string): number {
    const lower = pickupZone.toLowerCase();

    // Popular restaurant areas get higher scores
    const popularZones = [
      "downtown",
      "midtown",
      "theater district",
      "marina",
      "financial district",
    ];

    if (popularZones.some((z) => lower.includes(z))) {
      return 1.15;
    }

    return 1.0;
  }

  /**
   * Get current model info
   */
  getModelInfo(): TrainedModel | null {
    return this.model;
  }

  /**
   * Reset model
   */
  resetModel(): void {
    this.model = null;
    localStorage.removeItem("ude_ml_model");
  }
}

// Export singleton instance
export const mlModel = new MLModel();
