import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";
import { OrderData } from "@shared/types";

// Supabase orders table schema (run this SQL in Supabase SQL editor):
//
// CREATE TABLE IF NOT EXISTS orders (
//   id        TEXT PRIMARY KEY,
//   user_id   TEXT NOT NULL,
//   data      JSONB NOT NULL,
//   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
// );
// CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
//
// RLS: disable or add service-role policy (the Worker uses the service role
// key, so RLS policies don't apply — but enabling RLS with no policies would
// block the anon key if you ever use it client-side).

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const handleCreateOrder: RequestHandler = async (req, res) => {
  try {
    const orderData: OrderData = req.body;

    if (!orderData.userId || !orderData.id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!orderData.createdAt) {
      orderData.createdAt = new Date().toISOString();
    }
    if (!orderData.updatedAt) {
      orderData.updatedAt = new Date().toISOString();
    }

    const supabase = getSupabase();

    const { error } = await supabase.from("orders").upsert({
      id: orderData.id,
      user_id: orderData.userId,
      data: orderData,
    });

    if (error) throw error;

    console.log(`Order saved: ${orderData.id}`, {
      user: orderData.userId,
      payout: orderData.actualPay ?? orderData.shownPayout,
      time: orderData.actualTotalTime,
      score: orderData.score.score,
    });

    res.json({
      message: "Order saved successfully",
      order: orderData,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: "Failed to save order" });
  }
};

export const handleGetUserOrders: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }

    const supabase = getSupabase();

    const { data: rows, error } = await supabase
      .from("orders")
      .select("data")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const userOrders: OrderData[] = (rows ?? []).map((r) => r.data as OrderData);

    res.json({
      message: "Orders retrieved",
      orders: userOrders,
      count: userOrders.length,
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ message: "Failed to retrieve orders" });
  }
};

export const handleGetOrderStats: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }

    const supabase = getSupabase();

    const { data: rows, error } = await supabase
      .from("orders")
      .select("data")
      .eq("user_id", userId);

    if (error) throw error;

    const userOrders: OrderData[] = (rows ?? []).map((r) => r.data as OrderData);

    if (userOrders.length === 0) {
      return res.json({
        message: "No orders found",
        stats: {
          totalOrders: 0,
          totalEarnings: 0,
          averageHourlyRate: 0,
          totalHours: 0,
        },
      });
    }

    const totalEarnings = userOrders.reduce(
      (sum, o) => sum + (o.actualPay ?? o.shownPayout),
      0
    );
    const totalMinutes = userOrders.reduce(
      (sum, o) => sum + (o.actualTotalTime ?? 0),
      0
    );
    const totalHours = totalMinutes / 60;
    const averageHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0;
    const averageScore =
      userOrders.reduce((sum, o) => sum + o.score.score, 0) / userOrders.length;

    res.json({
      message: "Order statistics retrieved",
      stats: {
        totalOrders: userOrders.length,
        totalEarnings: parseFloat(totalEarnings.toFixed(2)),
        averageHourlyRate: parseFloat(averageHourlyRate.toFixed(2)),
        totalHours: parseFloat(totalHours.toFixed(2)),
        averageScore: parseFloat(averageScore.toFixed(2)),
        bestScore: Math.max(...userOrders.map((o) => o.score.score)),
        acceptanceRate: (
          (userOrders.filter((o) => o.score.recommendation === "take").length /
            userOrders.length) *
          100
        ).toFixed(1),
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ message: "Failed to retrieve stats" });
  }
};

// Export all orders (for ML model training / admin use)
export const handleExportAllData: RequestHandler = async (req, res) => {
  try {
    const supabase = getSupabase();

    const { data: rows, error } = await supabase
      .from("orders")
      .select("data")
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Map rows to OrderData and include username when available
    const allOrdersRaw: { id: string; user_id: string; data: any }[] = (rows ?? []).map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      data: r.data,
    }));

    // Collect unique user IDs
    const userIds = Array.from(new Set(allOrdersRaw.map((r) => r.user_id))).filter(Boolean);

    // Fetch usernames for these user IDs
    let userMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, username")
        .in("id", userIds);
      if (!usersError && users) {
        users.forEach((u: any) => {
          userMap[u.id] = u.username;
        });
      }
    }

    const allOrders: OrderData[] = allOrdersRaw.map((r) => {
      const order = r.data as OrderData;
      // Attach username if known (non-breaking addition)
      return {
        ...order,
        username: userMap[r.user_id] || undefined,
      } as OrderData & { username?: string };
    });

    res.json({
      message: "All orders data",
      data: allOrders,
      count: allOrders.length,
    });
  } catch (error) {
    console.error("Export data error:", error);
    res.status(500).json({ message: "Failed to export data" });
  }
};
