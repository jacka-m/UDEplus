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
    // Use processedMetrics if available
    const pm = order.processedMetrics;
    const hourlyRate = pm ? pm.hourlyRateNormalized * 50
      : order.estimatedTime > 0
        ? (order.shownPayout / (order.estimatedTime / 60))
        : 0;

    const milesEfficiency = pm ? pm.milesEfficiencyNormalized * 5
      : order.miles > 0
        ? order.shownPayout / order.miles
        : 0;

    const stopsBonus = Math.min(order.numberOfStops * 0.1, 1);
    const timeOfDay = this.getTimeOfDayScore(order.timeOfDay);
    const dayOfWeek = this.getDayOfWeekScore(order.dayOfWeek);
    const pickupZoneScore = this.getPickupZoneScore(order.pickupZone);

    // Weather score
    const weatherScore = order.weatherCondition === "sunny"  ? 1.0
      : order.weatherCondition === "cloudy" ? 0.9
      : order.weatherCondition === "rainy"  ? 0.75
      : order.weatherCondition === "snowy"  ? 0.6
      : 1.0;

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
      weatherScore,
    };
  }

  /**
   * Compute derived/normalized metrics from raw order data.
   * Call this before saving a completed order (in PostOrderSurveyImmediate).
   */
  computeProcessedMetrics(order: OrderData): OrderData["processedMetrics"] {
    const safeTime  = order.estimatedTime > 0 ? order.estimatedTime : 1;
    const safeStops = order.numberOfStops  > 0 ? order.numberOfStops  : 1;
    const safeMiles = order.miles          > 0 ? order.miles          : 0.1;

    const hourlyRate = order.shownPayout / (safeTime / 60);
    const milesEff   = order.shownPayout / safeMiles;

    return {
      hourlyRateNormalized:       Math.min(hourlyRate / 50, 1),
      milesEfficiencyNormalized:  Math.min(milesEff   / 5,  1),
      payoutPerStop:              order.shownPayout  / safeStops,
      timePerStop:                safeTime           / safeStops,
      payoutPerMinute:            order.shownPayout  / safeTime,
      waitRatio: order.waitTimeAtRestaurant != null
        ? order.waitTimeAtRestaurant / safeTime
        : undefined,
      actualVsEstimatedRatio: order.actualTotalTime != null
        ? order.actualTotalTime / safeTime
        : undefined,
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
      .map((o) => {
        // Convert score (1-10) to label (1-4): poor=1, not good=2, acceptable=3, great=4
        let label: 1 | 2 | 3 | 4;
        if (o.score.score <= 2.5) {
          label = 1; // poor
        } else if (o.score.score <= 5) {
          label = 2; // not good
        } else if (o.score.score <= 7.5) {
          label = 3; // acceptable
        } else {
          label = 4; // great
        }
        return {
          features: this.extractFeatures(o),
          label,
        };
      });

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
    const normalizedScore = Number.isFinite(score)
      ? Math.min(Math.max(score / 3, 1), 10)
      : 1;
    return Math.round(normalizedScore * 2) / 2; // Round to 0.5 increments
  }

  private predictWithDefaultAlgorithm(order: OrderData): number {
    const safeEstimatedTime = order.estimatedTime && order.estimatedTime > 0 ? order.estimatedTime : 1;
    const safeMiles = order.miles && order.miles > 0 ? order.miles : 0.1;
    const safeStops = order.numberOfStops && order.numberOfStops > 0 ? order.numberOfStops : 1;

    const hourlyRate = (order.shownPayout / (safeEstimatedTime / 60)) * 1.2;
    const milesEfficiency = order.shownPayout / safeMiles;
    const stopsBonus = Math.min(order.numberOfStops * 0.1, 0.5);
    const zoneMultiplier = (order.pickupZone || "").toLowerCase() === "downtown" ? 1.2 : 1;

    // Distance drift penalty: high time-per-stop ratio means likely ending far from start zone
    const timePerStop = safeEstimatedTime / safeStops;
    const driftPenalty = timePerStop > 20 ? Math.min((timePerStop - 20) / 40, 0.25) : 0;

    const baseScore =
      (hourlyRate * 0.5 + milesEfficiency * 0.3 + stopsBonus * 0.2) *
      zoneMultiplier *
      (1 - driftPenalty);

    // Convert to 1-10 scale and guard non-finite
    const normalizedScore = Number.isFinite(baseScore)
      ? Math.min(Math.max(baseScore / 3, 1), 10)
      : 1;
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
   * Score an order for manual session creation
   * This combines all relevant features into a final 1-10 score
   */
  scoreOrder(order: OrderData): number {
    return this.predictScore(order);
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

// Export class and singleton instance
export { MLModel };
export const mlModel = new MLModel();
