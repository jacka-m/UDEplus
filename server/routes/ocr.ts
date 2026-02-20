import { RequestHandler } from "express";
import multer from "multer";
import { createWorker } from "tesseract.js";

const upload = multer({ storage: multer.memoryStorage() });

// POST /api/ocr/parse
export const handleOcrParse: RequestHandler = upload.single("image") as any;

export const ocrRouteWrapper: RequestHandler = async (req, res) => {
  try {
    const file = (req as any).file;
    if (!file) return res.status(400).json({ message: "Missing image" });

    let worker: any = createWorker({ logger: () => {} });
    if (worker && typeof worker.then === "function") {
      worker = await worker;
    }
    await worker.load();
    await worker.loadLanguage("eng");
    await worker.initialize("eng");

    const ocrResult = await worker.recognize(file.buffer);
    const data = ocrResult.data;
    await worker.terminate();

    const raw = data.text || "";
    // Basic heuristics matching similar to client
    const payoutMatch = raw.match(/\$\s*([0-9]+(?:\.[0-9]{1,2})?)/);
    const payout = payoutMatch ? parseFloat(payoutMatch[1]) : undefined;
    const timeMatch = raw.match(/([0-9]{1,3})\s*(?:min|m|mins)/i);
    const estimatedTime = timeMatch ? parseInt(timeMatch[1], 10) : undefined;
    const milesMatch = raw.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:mi|miles)/i);
    const miles = milesMatch ? parseFloat(milesMatch[1]) : undefined;
    const stopsMatch = raw.match(/([0-9]{1,2})\s*\b(?:stops?|st)\b/i);
    const stops = stopsMatch ? parseInt(stopsMatch[1], 10) : undefined;

    const words = raw.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    let pickupZone: string | undefined = undefined;
    if (words.length > 0) {
      const atIdx = words.findIndex((w) => /@| at /i.test(w));
      if (atIdx !== -1 && words[atIdx + 1]) pickupZone = words[atIdx + 1];
      else pickupZone = words[1] || words[0];
    }

    res.json({ payout, estimatedTime, miles, pickupZone, stops, rawText: raw, confidence: data.confidence });
  } catch (error) {
    console.error("OCR parse error:", error);
    res.status(500).json({ message: "OCR failed" });
  }
};
