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
    handleDeleteOrder,
} from "./routes/orders";
import telemetryRouter from "./routes/telemetry";

export function createServer(opts?: { skipBodyParsing?: boolean }) {
  const app = express();

  // Middleware
  app.use(cors());
  // Body parsing is skipped in the Cloudflare Worker because the body is
  // pre-parsed in worker.ts before Express is called. The Node.js server
  // still needs it.
  if (!opts?.skipBodyParsing) {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
  }

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
  app.delete("/api/orders/:orderId", handleDeleteOrder);

  // Sessions routes
  app.post("/api/sessions", (req, res) => {
    try {
      const session = req.body;

      // Validate required fields
      if (!session.userId) {
  // telemetry endpoint for opt-in anonymized records
  app.use("/api", telemetryRouter);
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

  // Admin ML Settings Route
  app.post("/api/admin/ml-settings", (req, res) => {
    try {
      const { username, settings, timestamp } = req.body;

      // Verify this is the admin user
      if (username !== "jack_am") {
        return res.status(403).json({
          message: "Unauthorized access to ML settings",
          success: false,
        });
      }

      // Log the settings update
      console.log(
        `ML Settings updated by ${username} at ${timestamp}`,
        settings
      );

      // In a production system, save to a database
      // For now, we log it and return success
      res.json({
        message: "ML settings saved successfully",
        success: true,
        settings,
      });
    } catch (error) {
      console.error("ML settings error:", error);
      res.status(500).json({
        message: "Failed to save ML settings",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // OCR parse route (server-side fallback)
  try {
    // Use dynamic import so this still runs in environments without multer/tesseract
    // Register route if modules are available
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ocrRouteWrapper, handleOcrParse } = require("./routes/ocr");
    app.post("/api/ocr/parse", handleOcrParse, ocrRouteWrapper as any);
  } catch (e) {
    console.warn("OCR route not registered (dependencies missing):", e?.message || e);
  }

  // telemetry is registered above via telemetryRouter

  return app;
}
