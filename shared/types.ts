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
  };
  label: 1 | 2 | 3 | 4; // Actual score/outcome
}
