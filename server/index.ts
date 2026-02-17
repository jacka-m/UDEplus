import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  handleSignup,
  handleVerifyPhone,
  handleResendCode,
  handleLogin,
  handleCompleteOnboarding,
} from "./routes/auth";
import {
  handleCreateOrder,
  handleGetUserOrders,
  handleGetOrderStats,
  handleExportAllData,
} from "./routes/orders";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Auth routes
  app.post("/api/auth/signup", handleSignup);
  app.post("/api/auth/verify-phone", handleVerifyPhone);
  app.post("/api/auth/resend-code", handleResendCode);
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/complete-onboarding", handleCompleteOnboarding);

  // Orders routes
  app.post("/api/orders", handleCreateOrder);
  app.post("/api/orders/immediate", handleCreateOrder); // Same handler for immediate partial orders
  app.post("/api/orders/delayed", handleCreateOrder); // Same handler for delayed complete orders
  app.get("/api/users/:userId/orders", handleGetUserOrders);
  app.get("/api/users/:userId/stats", handleGetOrderStats);
  app.get("/api/orders/export", handleExportAllData);

  // Sessions routes
  app.post("/api/sessions", (req, res) => {
    try {
      const session = req.body;

      // Validate required fields
      if (!session.userId) {
        return res.status(400).json({
          message: "userId is required",
          success: false,
        });
      }

      if (!session.id) {
        return res.status(400).json({
          message: "Session ID is required",
          success: false,
        });
      }

      // Log session creation
      console.log(
        `Session created: ${session.id} for user ${session.userId} at ${session.startTime}`
      );

      // Return success response with session data
      res.json({
        message: "Session created successfully",
        success: true,
        session: {
          id: session.id,
          userId: session.userId,
          startTime: session.startTime,
          status: session.status,
        },
      });
    } catch (error) {
      console.error("Session creation error:", error);
      res.status(500).json({
        message: "Failed to create session",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return app;
}
