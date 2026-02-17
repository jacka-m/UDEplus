import { toast } from "@/hooks/use-toast";

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
