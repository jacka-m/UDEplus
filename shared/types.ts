export interface OrderScore {
  score: number; // 1-10 scale: 1-2.5=poor, 2.5-5=not good, 5-7.5=acceptable, 7.5-10=great
  recommendation: "take" | "decline";
  timestamp: string;
}

export interface OrderData {
  id: string;
  userId: string;
  sessionId: string;

  // Initial Analysis
  numberOfStops: number;
  shownPayout: number;
  miles: number;
  estimatedTime: number;
  pickupZone: string;
  dropoffZone?: string;

  // Score
  score: OrderScore;

  // Timestamps
  offeredAt: string;
  acceptedAt?: string;
  actualStartTime?: string; // When order was picked up
  waitStartTime?: string; // When user started waiting
  waitEndTime?: string; // When order was picked up after waiting
  actualEndTime?: string; // When order was dropped off

  // Wait Times
  waitTimeAtRestaurant?: number; // in minutes
  actualTotalTime?: number; // in minutes from acceptance to dropoff

  // Pickup Site Info (Immediate collection)
  pickupSiteName?: string;
  pickupSiteAddress?: string;

  // Restaurant Info (collected during post-order survey)
  restaurantName?: string;
  restaurantAddress?: string;

  // Immediate Post-Order Survey (collected right after dropoff)
  parkingDifficulty?: 1 | 2 | 3;
  dropoffDifficulty?: 1 | 2 | 3;
  endZoneQuality?: 1 | 2 | 3;
  routeCohesion?: 1 | 2 | 3 | 4 | 5; // Only for multi-stop
  dropoffCompression?: 1 | 2 | 3 | 4 | 5; // Only for multi-stop
  nextOrderMomentum?: 1 | 2 | 3 | 4 | 5;
  immediateDataCollectedAt?: string;

  // Delayed Post-Order Survey (collected 2+ hours after dropoff)
  actualPay?: number;
  delayedDataCollectedAt?: string;

  // Metadata
  dayOfWeek: string;
  date: string;
  timeOfDay: string;
  createdAt: string;
  updatedAt: string;
  // Optional username (augmented by server export for admin views)
  username?: string;

  // ML preprocessing — computed at order completion, stored for pipeline
  processedMetrics?: {
    hourlyRateNormalized: number;   // hourlyRate / 50 (clamped 0–1, $50/hr = 1.0)
    milesEfficiencyNormalized: number; // $/mile / 5 (clamped 0–1)
    payoutPerStop: number;          // shownPayout / numberOfStops
    timePerStop: number;            // estimatedTime / numberOfStops (minutes)
    payoutPerMinute: number;        // shownPayout / estimatedTime
    waitRatio?: number;             // waitTimeAtRestaurant / estimatedTime (if wait occurred)
    actualVsEstimatedRatio?: number; // actualTotalTime / estimatedTime (filled post-dropoff)
  };

  weatherCondition?: "sunny" | "cloudy" | "rainy" | "snowy";
  state?: string; // 2-letter state code for earnings law
}

export interface DrivingSession {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  status: "active" | "ended";

  // Orders within this session
  orderIds: string[];

  // Session Summary
  totalOrders: number;
  totalEarnings: number;
  totalHours: number;
  averageScore: number;

  // Delayed data collection
  delayedDataDueAt?: string; // 2 hours after session ends
  delayedDataCollected: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface MLModelData {
  features: {
    hourlyRate: number;
    milesEfficiency: number;
    stopsBonus: number;
    timeOfDay: number;
    dayOfWeek: number;
    pickupZoneScore: number;
    parkingDifficulty?: number;
    dropoffDifficulty?: number;
    endZoneQuality?: number;
    routeCohesion?: number;
    dropoffCompression?: number;
    nextOrderMomentum?: number;
    weatherScore?: number; // 1.0=sunny, 0.9=cloudy, 0.75=rainy, 0.6=snowy
  };
  label: 1 | 2 | 3 | 4; // Actual score/outcome
}
