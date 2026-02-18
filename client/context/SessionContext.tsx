import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { DrivingSession, OrderData } from "@shared/types";
import { ordersManager } from "@/utils/ordersManager";
import { toast } from "@/hooks/use-toast";

interface SessionContextType {
  session: DrivingSession | null;
  isSessionActive: boolean;
  startSession: (userId: string) => Promise<void>;
  endSession: () => Promise<void>;
  addOrderToSession: (order: OrderData) => void;
  getSessionOrders: () => OrderData[];
  updateSessionStats: () => void;
  setTripPhase: (phase: "collecting" | "delivering") => void;
  updateOrderInSession: (order: OrderData) => void;
  getNextUnpickedOrder: () => OrderData | null;
  getNextUndeliveredOrder: () => OrderData | null;
  addPendingImmediateSurvey: (order: OrderData) => void;
  getNextPendingImmediateSurvey: () => OrderData | null;
  removePendingImmediateSurvey: (id: string) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(
  undefined
);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<DrivingSession | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [pendingSurveyIds, setPendingSurveyIds] = useState<string[]>([]);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

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
    const savedPending = localStorage.getItem("ude_session_pending_surveys");
    if (savedPending) {
      try {
        setPendingSurveyIds(JSON.parse(savedPending));
      } catch {
        localStorage.removeItem("ude_session_pending_surveys");
      }
    }
  }, []);

  // Save session to localStorage whenever it changes (debounced with error handling)
  useEffect(() => {
    if (session) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for debounced save
      saveTimeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem("ude_session", JSON.stringify(session));
          localStorage.setItem("ude_session_orders", JSON.stringify(orders));
          localStorage.setItem("ude_session_pending_surveys", JSON.stringify(pendingSurveyIds));
        } catch (error) {
          console.error("Failed to save session to localStorage:", error);
          toast({
            title: "Storage Error",
            description: "Failed to save your session data. Some data may be lost.",
            variant: "destructive",
          });
        }
      }, 500);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [session, orders]);

  useEffect(() => {
    try {
      localStorage.setItem("ude_session_pending_surveys", JSON.stringify(pendingSurveyIds));
    } catch {}
  }, [pendingSurveyIds]);

  const startSession = useCallback(async (userId: string) => {
    if (!userId) {
      const error = "User ID is required to start a session";
      toast({ title: "Error", description: error, variant: "destructive" });
      throw new Error(error);
    }

    const now = new Date();
    const newSession: DrivingSession = {
      id: `session_${Date.now()}`,
      userId: userId,
      startTime: now.toISOString(),
      status: "active",
      tripPhase: "collecting",
      orderIds: [],
      totalOrders: 0,
      totalEarnings: 0,
      totalHours: 0,
      averageScore: 0,
      delayedDataCollected: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSession),
      });

      if (!response.ok) {
        throw new Error("Failed to create session on server");
      }

      setSession(newSession);
      setOrders([]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error creating session:", error);
      toast({
        title: "Session Error",
        description: "Failed to start session. Check your connection and try again.",
        variant: "destructive",
      });
      throw error;
    }
  }, []);

  const endSession = useCallback(async () => {
    if (!session) return;

    const now = new Date();
    const updatedSession: DrivingSession = {
      ...session,
      endTime: now.toISOString(),
      status: "ended",
      tripPhase: undefined,
      delayedDataDueAt: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: now.toISOString(),
    };

    try {
      setSession(updatedSession);
      ordersManager.saveSessionOrders(updatedSession, orders);

      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSession),
      });

      if (!response.ok) {
        throw new Error("Failed to save session on server");
      }
    } catch (error) {
      console.error("Failed to end session:", error);
      toast({
        title: "Save Error",
        description: "Failed to save session. Your local data is preserved.",
        variant: "destructive",
      });
    }
  }, [session, orders]);

  const addOrderToSession = useCallback((order: OrderData) => {
    if (!session) return;

    const updatedOrders = [...orders, order];
    setOrders(updatedOrders);

    const totalEarnings = updatedOrders.reduce(
      (sum, o) => sum + (o.actualPay || o.shownPayout),
      0
    );
    const totalMinutes = updatedOrders.reduce(
      (sum, o) => sum + (o.actualTotalTime || o.estimatedTime || 0),
      0
    );
    const totalHours = totalMinutes / 60;

    const updatedSession: DrivingSession = {
      ...session,
      orderIds: [...session.orderIds, order.id],
      totalOrders: session.totalOrders + 1,
      totalEarnings,
      totalHours,
    };

    setSession(updatedSession);
  }, [session, orders]);

  const addPendingImmediateSurvey = useCallback((order: OrderData) => {
    setPendingSurveyIds((prev) => {
      if (prev.includes(order.id)) return prev;
      return [...prev, order.id];
    });
  }, []);

  const getNextPendingImmediateSurvey = useCallback(() => {
    if (pendingSurveyIds.length === 0) return null;
    const id = pendingSurveyIds[0];
    return orders.find((o) => o.id === id) || null;
  }, [pendingSurveyIds, orders]);

  const removePendingImmediateSurvey = useCallback((id: string) => {
    setPendingSurveyIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const setTripPhase = useCallback((phase: "collecting" | "delivering") => {
    if (!session) return;
    const updatedSession: DrivingSession = {
      ...session,
      tripPhase: phase,
      updatedAt: new Date().toISOString(),
    };
    setSession(updatedSession);
  }, [session]);

  const updateOrderInSession = useCallback((order: OrderData) => {
    const idx = orders.findIndex((o) => o.id === order.id);
    if (idx === -1) return;
    const updated = [...orders];
    updated[idx] = order;
    setOrders(updated);
  }, [orders]);

  const getNextUnpickedOrder = useCallback(() => {
    // Unpicked = acceptedAt exists but actualStartTime not set
    return orders.find((o) => o.acceptedAt && !o.actualStartTime) || null;
  }, [orders]);

  const getNextUndeliveredOrder = useCallback(() => {
    // Undelivered = actualEndTime not set but picked up (actualStartTime set)
    return orders.find((o) => o.actualStartTime && !o.actualEndTime) || null;
  }, [orders]);

  const getSessionOrders = useCallback(() => {
    return orders;
  }, [orders]);

  const updateSessionStats = useCallback(() => {
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
  }, [session, orders]);

  const contextValue = useMemo(
    () => ({
      session,
      isSessionActive: session?.status === "active",
      startSession,
      endSession,
      addOrderToSession,
      getSessionOrders,
      updateSessionStats,
      setTripPhase,
      updateOrderInSession,
      getNextUnpickedOrder,
      getNextUndeliveredOrder,
      addPendingImmediateSurvey,
      getNextPendingImmediateSurvey,
      removePendingImmediateSurvey,
    }),
    [session, startSession, endSession, addOrderToSession, getSessionOrders, updateSessionStats]
  );

  return (
    <SessionContext.Provider value={contextValue}>
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
