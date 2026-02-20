import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

const TELEMETRY_DIR = path.join(process.cwd(), "telemetry_data");
if (!fs.existsSync(TELEMETRY_DIR)) {
  try {
    fs.mkdirSync(TELEMETRY_DIR, { recursive: true });
  } catch {}
}

router.post(
  "/telemetry",
  express.json(),
  async (req: express.Request, res: express.Response) => {
    try {
      const body = req.body || {};
      const record: any = {
        timestamp: new Date().toISOString(),
        payout: body.payout ?? null,
        estimatedTime: body.estimatedTime ?? null,
        miles: body.miles ?? null,
        pickupZone: body.pickupZone ? String(body.pickupZone).slice(0, 200) : null,
        stops: body.stops ?? null,
        confidence: body.confidence ?? null,
      };

      const line = JSON.stringify(record) + "\n";
      const file = path.join(
        TELEMETRY_DIR,
        `telemetry_${new Date().toISOString().slice(0, 10)}.ndjson`
      );
      fs.appendFileSync(file, line);

      res.json({ message: "Telemetry accepted" });
    } catch (error) {
      console.error("Telemetry error:", error);
      res.status(500).json({ message: "Failed to accept telemetry" });
    }
  }
);

export default router;
