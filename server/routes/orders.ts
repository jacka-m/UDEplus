import { RequestHandler } from "express";
import { OrderData } from "@shared/types";

// In-memory storage (in production, use a database)
const orders: OrderData[] = [];

export const handleCreateOrder: RequestHandler = async (req, res) => {
  try {
    const orderData: OrderData = req.body;

    // Validation
    if (!orderData.userId || !orderData.id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Ensure timestamps are properly formatted
    if (!orderData.createdAt) {
      orderData.createdAt = new Date().toISOString();
    }

    if (!orderData.updatedAt) {
      orderData.updatedAt = new Date().toISOString();
    }

    // Store order
    orders.push(orderData);

    // Log for debugging
    console.log(`Order saved: ${orderData.id}`, {
      user: orderData.userId,
      payout: orderData.actualPay || orderData.shownPayout,
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

    const userOrders = orders.filter((o) => o.userId === userId);

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

    const userOrders = orders.filter((o) => o.userId === userId);

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

    // Calculate statistics
    const totalEarnings = userOrders.reduce(
      (sum, o) => sum + (o.actualPay || o.shownPayout),
      0
    );
    const totalMinutes = userOrders.reduce((sum, o) => sum + (o.actualTotalTime || 0), 0);
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

// Export all orders data (for ML model training)
export const handleExportAllData: RequestHandler = async (req, res) => {
  try {
    res.json({
      message: "All orders data",
      data: orders,
      count: orders.length,
    });
  } catch (error) {
    console.error("Export data error:", error);
    res.status(500).json({ message: "Failed to export data" });
  }
};
