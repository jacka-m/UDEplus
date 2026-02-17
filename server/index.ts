import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  handleSignup,
  handleVerifyPhone,
  handleResendCode,
  handleLogin,
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

  // Orders routes
  app.post("/api/orders", handleCreateOrder);
  app.get("/api/users/:userId/orders", handleGetUserOrders);
  app.get("/api/users/:userId/stats", handleGetOrderStats);
  app.get("/api/orders/export", handleExportAllData);

  return app;
}
