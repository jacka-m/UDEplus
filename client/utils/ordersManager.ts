import { OrderData, DrivingSession } from "@shared/types";

// Key for storing all historical orders
const HISTORICAL_ORDERS_KEY = "ude_all_orders";
const HISTORICAL_SESSIONS_KEY = "ude_all_sessions";

export const ordersManager = {
  // Add orders from a completed session to the historical record
  saveSessionOrders: (session: DrivingSession, orders: OrderData[]) => {
    try {
      // Save all orders
      const existingOrders = localStorage.getItem(HISTORICAL_ORDERS_KEY);
      const allOrders: OrderData[] = existingOrders ? JSON.parse(existingOrders) : [];
      const updatedOrders = [...allOrders, ...orders];
      localStorage.setItem(HISTORICAL_ORDERS_KEY, JSON.stringify(updatedOrders));

      // Save session
      const existingSessions = localStorage.getItem(HISTORICAL_SESSIONS_KEY);
      const allSessions: DrivingSession[] = existingSessions
        ? JSON.parse(existingSessions)
        : [];
      const updatedSessions = [...allSessions, session];
      localStorage.setItem(HISTORICAL_SESSIONS_KEY, JSON.stringify(updatedSessions));
    } catch (error) {
      console.error("Failed to save session orders:", error);
    }
  },

  // Get all historical orders
  getAllOrders: (): OrderData[] => {
    try {
      const orders = localStorage.getItem(HISTORICAL_ORDERS_KEY);
      return orders ? JSON.parse(orders) : [];
    } catch (error) {
      console.error("Failed to load historical orders:", error);
      return [];
    }
  },

  // Get all historical sessions
  getAllSessions: (): DrivingSession[] => {
    try {
      const sessions = localStorage.getItem(HISTORICAL_SESSIONS_KEY);
      return sessions ? JSON.parse(sessions) : [];
    } catch (error) {
      console.error("Failed to load historical sessions:", error);
      return [];
    }
  },

  // Get orders for a specific session
  getOrdersBySession: (sessionId: string): OrderData[] => {
    const allOrders = ordersManager.getAllOrders();
    return allOrders.filter((order) => order.sessionId === sessionId);
  },

  // Clear all historical data (use with caution)
  clearAllData: () => {
    localStorage.removeItem(HISTORICAL_ORDERS_KEY);
    localStorage.removeItem(HISTORICAL_SESSIONS_KEY);
  },
};
