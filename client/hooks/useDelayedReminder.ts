import { useEffect, useCallback } from "react";
import { OrderData } from "@shared/types";
import { delayedDataReminder } from "@/utils/delayedDataReminder";

interface DelayedReminderOptions {
  onReminder: (order: OrderData) => void;
}

export function useDelayedReminder({ onReminder }: DelayedReminderOptions) {
  const handleReminderEvent = useCallback(
    (event: Event) => {
      const customEvent = event as CustomEvent<{ order: OrderData }>;
      onReminder(customEvent.detail.order);
    },
    [onReminder]
  );

  useEffect(() => {
    // Reschedule any pending orders on mount
    delayedDataReminder.rescheduleAll();

    // Listen for reminder events
    window.addEventListener("ude:delayed-reminder-due", handleReminderEvent);

    return () => {
      window.removeEventListener("ude:delayed-reminder-due", handleReminderEvent);
    };
  }, [handleReminderEvent]);

  // Return utility functions
  return {
    getPendingOrders: () => delayedDataReminder.getPendingOrders(),
    checkForDueOrders: (callback: (order: OrderData) => void) =>
      delayedDataReminder.checkForDueOrders(callback),
    completeOrder: (orderId: string) =>
      delayedDataReminder.completeOrder(orderId),
    requestNotificationPermission: () =>
      delayedDataReminder.requestNotificationPermission(),
  };
}
