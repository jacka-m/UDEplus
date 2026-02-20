import React, { useRef, useState, useEffect } from "react";
import { createWorker } from "tesseract.js";

type ParsedFields = {
  payout?: number;
  estimatedTime?: number; // minutes
  miles?: number;
  pickupZone?: string;
  stops?: number;
  rawText?: string;
  confidence?: number;
};

export default function OfferScanner({
  onParse,
}: {
  onParse: (fields: ParsedFields) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const workerRef = useRef<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // initialize worker lazily for reuse (faster on repeated scans)
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        if (!workerRef.current) {
          let w: any = createWorker({ logger: () => {} });
          if (w && typeof (w as any).then === "function") {
            w = await w;
          }
          await w.load();
          await w.loadLanguage("eng");
          await w.initialize("eng");
          if (mounted) workerRef.current = w;
          else await w.terminate();
        }
      } catch (e) {
        console.warn("Tesseract init failed:", e);
      }
    };
    init();
    return () => {
      mounted = false;
      // do not terminate to allow reuse across component lifecycle; terminate only on page unload
      // optional: keep worker alive
    };
  }, []);

  const handleFile = async (file?: File) => {
    setError(null);
    const f = file;
    if (!f) return;
    setLoading(true);
    try {
      let data: any | undefined;
      if (workerRef.current) {
        const res = await workerRef.current.recognize(f);
        data = res.data;
      } else {
        // fallback to full import if worker not ready
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Tesseract = require("tesseract.js");
        const res = await Tesseract.recognize(f, "eng", { logger: () => {} });
        data = res.data;
      }
      const text = data.text || "";
      const words = text.split(/\n+/).map((s) => s.trim()).filter(Boolean);

      // Heuristics parsing
      const raw = text;
      // payout: $nn or nn$
      const payoutMatch = raw.match(/\$\s*([0-9]+(?:\.[0-9]{1,2})?)/);
      const payout = payoutMatch ? parseFloat(payoutMatch[1]) : undefined;

      // estimated time: e.g., "27 min" or "27 min (2.7 mi)" or "27m"
      const timeMatch = raw.match(/([0-9]{1,3})\s*(?:min|m|mins)/i);
      const estimatedTime = timeMatch ? parseInt(timeMatch[1], 10) : undefined;

      // miles: e.g., "2.7 mi" or "2.7mi"
      const milesMatch = raw.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:mi|miles)/i);
      const miles = milesMatch ? parseFloat(milesMatch[1]) : undefined;

      // stops: look for "2 stops" or just "2 stop"
      const stopsMatch = raw.match(/([0-9]{1,2})\s*\b(?:stops?|st)\b/i);
      const stops = stopsMatch ? parseInt(stopsMatch[1], 10) : undefined;

      // pickup zone heuristics: try first non-numeric line after a restaurant name line (assume top lines)
      let pickupZone: string | undefined = undefined;
      if (words.length > 0) {
        // find line that contains '@' or 'at' indicating address line
        const atIdx = words.findIndex((w) => /@| at /i.test(w));
        if (atIdx !== -1 && words[atIdx + 1]) {
          pickupZone = words[atIdx + 1];
        } else {
          // fallback: use second line if first looks like restaurant name
          pickupZone = words[1] || words[0];
        }
      }

      // confidence: average of symbols confidence if available
      const confidence = data?.confidence ?? undefined;

      let parsed = { payout, estimatedTime, miles, pickupZone, stops, rawText: raw, confidence };

      // Hybrid fallback: if low confidence and user opted-in, send to server for better parsing
      try {
        const optIn = localStorage.getItem("ude_opt_in_server_ocr") === "true";
        if (optIn && (confidence === undefined || confidence < 60)) {
          const form = new FormData();
          form.append("image", f);
          const resp = await fetch("/api/ocr/parse", { method: "POST", body: form });
          if (resp.ok) {
            const json = await resp.json();
            // Prefer server results when available
            parsed = {
              payout: json.payout ?? payout,
              estimatedTime: json.estimatedTime ?? estimatedTime,
              miles: json.miles ?? miles,
              pickupZone: json.pickupZone ?? pickupZone,
              stops: json.stops ?? stops,
              rawText: raw,
              confidence: json.confidence ?? confidence,
            };
          }
        }
      } catch (e) {
        // ignore server fallback errors
      }

      onParse(parsed);
      // Send anonymized telemetry if user opted in
      try {
        const telemetryOptIn = localStorage.getItem("ude_opt_in_telemetry") === "true";
        if (telemetryOptIn) {
          // send minimal anonymized record
          fetch("/api/telemetry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              payout: parsed.payout ?? null,
              estimatedTime: parsed.estimatedTime ?? null,
              miles: parsed.miles ?? null,
              pickupZone: parsed.pickupZone ? String(parsed.pickupZone).slice(0, 100) : null,
              stops: parsed.stops ?? null,
              confidence: parsed.confidence ?? null,
            }),
          }).catch(() => {});
        }
      } catch {}
    } catch (err) {
      console.error(err);
      setError("Failed to parse image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFile(e.target.files ? e.target.files[0] : undefined)}
        className="hidden"
      />
      <div className="flex gap-2">
        <button
          onClick={() => inputRef.current?.click()}
          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
        >
          {loading ? "Scanning..." : "Scan Offer (screenshot)"}
        </button>
        {error && <div className="text-xs text-red-600">{error}</div>}
      </div>
    </div>
  );
}
