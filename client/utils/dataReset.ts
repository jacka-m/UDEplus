/**
 * Reset all app data for a fresh start
 * Clears sessions, orders, and cached data while preserving user preferences
 */

export function resetAllData() {
  const itemsToClear = [
    "ude_session",
    "ude_session_orders",
    "ude_all_sessions",
    "ude_all_orders",
    "ude_ml_model",
    "ml_model_settings",
    "ude_pending_delayed_orders",
  ];

  itemsToClear.forEach((item) => {
    try {
      localStorage.removeItem(item);
    } catch (error) {
      console.error(`Failed to clear ${item}:`, error);
    }
  });

  console.log("All order and session data has been reset");
  return true;
}

/**
 * Get a summary of data that will be reset
 */
export function getDataResetSummary() {
  const sessionStr = localStorage.getItem("ude_session");
  const ordersStr = localStorage.getItem("ude_session_orders");
  const allSessionsStr = localStorage.getItem("ude_all_sessions");
  const allOrdersStr = localStorage.getItem("ude_all_orders");

  let sessionCount = 0;
  let orderCount = 0;

  try {
    if (allSessionsStr) {
      sessionCount = JSON.parse(allSessionsStr).length;
    }
    if (allOrdersStr) {
      orderCount = JSON.parse(allOrdersStr).length;
    }
  } catch (error) {
    console.error("Failed to parse data for summary", error);
  }

  return {
    hasActiveSession: !!sessionStr,
    totalSessions: sessionCount,
    totalOrders: orderCount,
    dataSize: new Blob([
      sessionStr || "",
      ordersStr || "",
      allSessionsStr || "",
      allOrdersStr || "",
    ]).size,
  };
}
