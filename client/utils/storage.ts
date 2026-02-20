import { toast } from "@/hooks/use-toast";
import { OrderData } from "@shared/types";

// Keys for active order workflow persistence (survives app reload/swipe-away)
const ACTIVE_ORDER_KEY = "ude_active_order";
const ACTIVE_STEP_KEY = "ude_active_step";

export type ActiveOrderStep = "pickup" | "wait" | "dropoff" | "survey-immediate";

/**
 * Save the current in-flight order and workflow step to survive app reloads.
 * Call this whenever navigating to a new workflow page.
 */
export function saveActiveOrderState(step: ActiveOrderStep, orderData: OrderData): void {
  try {
    localStorage.setItem(ACTIVE_STEP_KEY, step);
    localStorage.setItem(ACTIVE_ORDER_KEY, JSON.stringify(orderData));
  } catch {
    // Non-critical – in-memory path will be taken
  }
}

/**
 * Load the persisted in-flight order state. Returns null if nothing is saved.
 */
export function loadActiveOrderState(): { step: ActiveOrderStep; orderData: OrderData } | null {
  try {
    const step = localStorage.getItem(ACTIVE_STEP_KEY) as ActiveOrderStep | null;
    const raw = localStorage.getItem(ACTIVE_ORDER_KEY);
    if (step && raw) {
      return { step, orderData: JSON.parse(raw) as OrderData };
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

/**
 * Clear the active order state once an order workflow is fully complete.
 */
export function clearActiveOrderState(): void {
  try {
    localStorage.removeItem(ACTIVE_STEP_KEY);
    localStorage.removeItem(ACTIVE_ORDER_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Safe localStorage wrapper that handles write failures gracefully
 * Falls back to in-memory storage if localStorage fails (iOS Safari private mode, etc)
 */
class SafeStorage {
  private memoryStorage: Map<string, string> = new Map();
  private isLocalStorageAvailable: boolean;

  constructor() {
    this.isLocalStorageAvailable = this.checkLocalStorageAvailability();
  }

  /**
   * Check if localStorage is available and writable
   */
  private checkLocalStorageAvailability(): boolean {
    try {
      const testKey = "__storage_test__";
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);
      return true;
    } catch {
      console.warn(
        "localStorage is not available. Using in-memory storage fallback."
      );
      return false;
    }
  }

  /**
   * Get value from storage (localStorage or memory)
   */
  getItem(key: string): string | null {
    try {
      if (this.isLocalStorageAvailable) {
        return localStorage.getItem(key);
      }
      return this.memoryStorage.get(key) ?? null;
    } catch (error) {
      console.error(`Failed to get item from storage: ${key}`, error);
      return this.memoryStorage.get(key) ?? null;
    }
  }

  /**
   * Set value in storage (localStorage or memory)
   * Shows toast on failure for critical data
   */
  setItem(key: string, value: string, isCritical: boolean = false): void {
    try {
      if (this.isLocalStorageAvailable) {
        localStorage.setItem(key, value);
        // Also keep in memory as backup
        this.memoryStorage.set(key, value);
      } else {
        this.memoryStorage.set(key, value);
      }
    } catch (error) {
      console.error(`Failed to set item in storage: ${key}`, error);

      // Try in-memory fallback
      try {
        this.memoryStorage.set(key, value);
        if (isCritical) {
          toast({
            title: "Storage Warning",
            description:
              "Your device storage is full. Data will be stored temporarily.",
            variant: "destructive",
          });
        }
      } catch (memoryError) {
        console.error(
          "Failed to set item in both localStorage and memory",
          memoryError
        );
        if (isCritical) {
          toast({
            title: "Storage Error",
            description: "Unable to save data. Please free up device storage.",
            variant: "destructive",
          });
        }
      }
    }
  }

  /**
   * Remove item from storage
   */
  removeItem(key: string): void {
    try {
      if (this.isLocalStorageAvailable) {
        localStorage.removeItem(key);
      }
      this.memoryStorage.delete(key);
    } catch (error) {
      console.error(`Failed to remove item from storage: ${key}`, error);
      this.memoryStorage.delete(key);
    }
  }

  /**
   * Clear all storage
   */
  clear(): void {
    try {
      if (this.isLocalStorageAvailable) {
        localStorage.clear();
      }
      this.memoryStorage.clear();
    } catch (error) {
      console.error("Failed to clear storage", error);
      this.memoryStorage.clear();
    }
  }

  /**
   * Get all keys in storage
   */
  keys(): string[] {
    if (this.isLocalStorageAvailable) {
      return Object.keys(localStorage);
    }
    return Array.from(this.memoryStorage.keys());
  }
}

// Export singleton instance
export const safeStorage = new SafeStorage();

/**
 * Hook-compatible storage getter
 */
export function useSafeStorage() {
  return safeStorage;
}

/**
 * Initialize application storage with safe defaults on first load or after cleared storage.
 * This ensures the app doesn't assume presence of keys and avoids requiring users to manually clear storage.
 */
export function initAppStorageDefaults() {
  try {
    // feature opt-ins: default to false
    if (safeStorage.getItem("ude_opt_in_server_ocr") === null) {
      safeStorage.setItem("ude_opt_in_server_ocr", "false");
    }
    if (safeStorage.getItem("ude_opt_in_telemetry") === null) {
      safeStorage.setItem("ude_opt_in_telemetry", "false");
    }

    // versioning key to detect migrations
    if (safeStorage.getItem("ude_data_version") === null) {
      safeStorage.setItem("ude_data_version", "1");
    }

    // ensure active order keys exist (no-op if absent) — do not populate with real data
    if (safeStorage.getItem(ACTIVE_ORDER_KEY) === null) {
      // keep absent: callers expect null when nothing saved; just ensure API stability
    }
  } catch (e) {
    // ignore — SafeStorage handles fallbacks and reports as needed
    console.warn("initAppStorageDefaults failed", e);
  }
}
