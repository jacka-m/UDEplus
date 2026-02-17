export interface OrderScore {
  score: 1 | 2 | 3 | 4;
  recommendation: "take" | "decline";
  timestamp: string;
}

export interface OrderData {
  id: string;
  userId: string;
  
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
  
  // Restaurant Info
  restaurantName?: string;
  restaurantAddress?: string;
  
  // Post-Order Survey
  parkingDifficulty?: 1 | 2 | 3;
  dropoffDifficulty?: 1 | 2 | 3;
  endZoneQuality?: 1 | 2 | 3;
  routeCohesion?: 1 | 2 | 3 | 4 | 5; // Only for multi-stop
  dropoffCompression?: 1 | 2 | 3 | 4 | 5; // Only for multi-stop
  nextOrderMomentum?: 1 | 2 | 3 | 4 | 5;
  
  // Financial
  actualPay?: number;
  
  // Metadata
  dayOfWeek: string;
  date: string;
  timeOfDay: string;
  createdAt: string;
  updatedAt: string;
}
