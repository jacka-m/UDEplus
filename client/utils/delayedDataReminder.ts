import { OrderData } from "@shared/types";

interface PendingDelayedOrder {
  order: OrderData;
  dueTime: number; // timestamp
}

/**
 * Manages reminders for orders that need delayed data collection
 */
class DelayedDataReminderManager {
  private key = "ude_pending_delayed_orders";
  private checkInterval = 60000; // Check every minute
  private timeoutIds: NodeJS.Timeout[] = [];

  /**
   * Add an order that needs 2-hour delayed data collection
   */
  addOrder(order: OrderData): void {
    const now = Date.now();
    const dueTime = now + 2 * 60 * 60 * 1000; // 2 hours from now

    const pending: PendingDelayedOrder = {
      order,
      dueTime,
    };

    // Load existing pending orders
    const existing = this.getPendingOrders();
    existing.push(pending);

    // Save to localStorage
    localStorage.setItem(this.key, JSON.stringify(existing));

    // Schedule reminder
    this.scheduleReminder(pending);

    console.log(
      `Scheduled delayed data reminder for order ${order.id} at ${new Date(dueTime).toLocaleString()}`
    );
  }

  /**
   * Get all pending orders that need delayed data collection
   */
  getPendingOrders(): PendingDelayedOrder[] {
    try {
      const saved = localStorage.getItem(this.key);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error("Failed to parse pending orders:", error);
    }
    return [];
  }

  /**
   * Check for due orders and trigger reminders
   */
  checkForDueOrders(callback: (order: OrderData) => void): PendingDelayedOrder[] {
    const pending = this.getPendingOrders();
    const now = Date.now();
    const due: PendingDelayedOrder[] = [];
    const remaining: PendingDelayedOrder[] = [];

    pending.forEach((item) => {
      if (now >= item.dueTime) {
        due.push(item);
        callback(item.order);
      } else {
        remaining.push(item);
      }
    });

    // Update stored list to remove due items
    if (due.length > 0) {
      localStorage.setItem(this.key, JSON.stringify(remaining));
    }

    return due;
  }

  /**
   * Mark an order as having delayed data collected
   */
  completeOrder(orderId: string): void {
    const pending = this.getPendingOrders();
    const remaining = pending.filter((item) => item.order.id !== orderId);
    localStorage.setItem(this.key, JSON.stringify(remaining));
  }

  /**
   * Schedule a reminder for a specific order
   */
  private scheduleReminder(pending: PendingDelayedOrder): void {
    const now = Date.now();
    const delay = Math.max(0, pending.dueTime - now);

    const timeoutId = setTimeout(() => {
      // Trigger browser notification if available
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("UDE+ - Time for final order details", {
          body: `Order ${pending.order.id}: Please add pickup location and actual payout info.`,
          tag: `delayed-order-${pending.order.id}`,
        });
      }

      // Store event for app to handle
      window.dispatchEvent(
        new CustomEvent("ude:delayed-reminder-due", {
          detail: { order: pending.order },
        })
      );
    }, delay);

    this.timeoutIds.push(timeoutId);
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.log("Browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  }

  /**
   * Clean up all scheduled timeouts
   */
  cleanup(): void {
    this.timeoutIds.forEach((id) => clearTimeout(id));
    this.timeoutIds = [];
  }

  /**
   * Check and reschedule all pending orders (useful on app startup)
   */
  rescheduleAll(): void {
    const pending = this.getPendingOrders();
    pending.forEach((item) => {
      this.scheduleReminder(item);
    });
  }
}

export const delayedDataReminder = new DelayedDataReminderManager();
