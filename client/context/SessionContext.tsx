import React, { createContext, useContext, useState, useEffect } from "react";
import { DrivingSession, OrderData } from "@shared/types";
import { ordersManager } from "@/utils/ordersManager";

interface SessionContextType {
  session: DrivingSession | null;
  isSessionActive: boolean;
  startSession: (userId: string) => Promise<void>;
  endSession: () => Promise<void>;
  addOrderToSession: (order: OrderData) => void;
  getSessionOrders: () => OrderData[];
  updateSessionStats: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(
  undefined
);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<DrivingSession | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem("ude_session");
    const savedOrders = localStorage.getItem("ude_session_orders");

    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        setSession(parsedSession);
      } catch (error) {
        console.error("Failed to parse saved session:", error);
        localStorage.removeItem("ude_session");
      }
    }

    if (savedOrders) {
      try {
        const parsedOrders = JSON.parse(savedOrders);
        setOrders(parsedOrders);
      } catch (error) {
        console.error("Failed to parse saved orders:", error);
        localStorage.removeItem("ude_session_orders");
      }
    }
  }, []);

  // Save session to localStorage whenever it changes
  useEffect(() => {
    if (session) {
      localStorage.setItem("ude_session", JSON.stringify(session));
      localStorage.setItem("ude_session_orders", JSON.stringify(orders));
    }
  }, [session, orders]);

  const startSession = async (userId: string) => {
    if (!userId) {
      throw new Error("User ID is required to start a session");
    }

    const now = new Date();
    const newSession: DrivingSession = {
      id: `session_${Date.now()}`,
      userId: userId,
      startTime: now.toISOString(),
      status: "active",
      orderIds: [],
      totalOrders: 0,
      totalEarnings: 0,
      totalHours: 0,
      averageScore: 0,
      delayedDataCollected: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // POST to server to create session
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSession),
      });

      if (!response.ok) {
        throw new Error("Failed to create session on server");
      }

      console.log("Session created successfully on server");
    } catch (error) {
      console.error("Error creating session on server:", error);
      throw error;
    }

    setSession(newSession);
    setOrders([]);
  };

  const endSession = async () => {
    if (!session) return;

    const now = new Date();
    const updatedSession: DrivingSession = {
      ...session,
      endTime: now.toISOString(),
      status: "ended",
      delayedDataDueAt: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      updatedAt: now.toISOString(),
    };

    setSession(updatedSession);

    // Save session and orders to persistent storage
    ordersManager.saveSessionOrders(updatedSession, orders);

    // Save session to backend
    try {
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSession),
      });
    } catch (error) {
      console.error("Failed to save session:", error);
    }
  };

  const addOrderToSession = (order: OrderData) => {
    if (!session) return;

    setOrders((prev) => [...prev, order]);

    const updatedSession: DrivingSession = {
      ...session,
      orderIds: [...session.orderIds, order.id],
      totalOrders: session.totalOrders + 1,
    };

    setSession(updatedSession);
  };

  const getSessionOrders = () => {
    return orders;
  };

  const updateSessionStats = () => {
    if (!session) return;

    const totalEarnings = orders.reduce(
      (sum, o) => sum + (o.actualPay || o.shownPayout),
      0
    );
    const totalMinutes = orders.reduce(
      (sum, o) => sum + (o.actualTotalTime || 0),
      0
    );
    const totalHours = totalMinutes / 60;
    const averageScore =
      orders.length > 0
        ? orders.reduce((sum, o) => sum + o.score.score, 0) / orders.length
        : 0;

    const updatedSession: DrivingSession = {
      ...session,
      totalEarnings,
      totalHours,
      averageScore,
      updatedAt: new Date().toISOString(),
    };

    setSession(updatedSession);
  };

  return (
    <SessionContext.Provider
      value={{
        session,
        isSessionActive: session?.status === "active",
        startSession,
        endSession,
        addOrderToSession,
        getSessionOrders,
        updateSessionStats,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
