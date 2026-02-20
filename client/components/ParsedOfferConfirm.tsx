import React, { useState } from "react";

export default function ParsedOfferConfirm({
  open,
  fields,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  fields: any;
  onConfirm: (updated: any) => void;
  onCancel: () => void;
}) {
  const [local, setLocal] = useState<any>({});

  React.useEffect(() => {
    setLocal({
      payout: fields?.payout ?? "",
      estimatedTime: fields?.estimatedTime ?? "",
      miles: fields?.miles ?? "",
      pickupZone: fields?.pickupZone ?? "",
      stops: fields?.stops ?? "",
      rawText: fields?.rawText ?? "",
      confidence: fields?.confidence ?? null,
    });
  }, [fields]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-semibold mb-3">Confirm Parsed Offer</h3>

        <div className="mb-3 text-sm text-gray-600">Confidence: {local.confidence ?? "N/A"}%</div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <label className="block text-xs text-gray-600">Payout</label>
            <input className="w-full px-3 py-2 border rounded" type="number" value={local.payout ?? ""} onChange={(e) => setLocal({ ...local, payout: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="block text-xs text-gray-600">Estimated Time (min)</label>
            <input className="w-full px-3 py-2 border rounded" type="number" value={local.estimatedTime ?? ""} onChange={(e) => setLocal({ ...local, estimatedTime: parseInt(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="block text-xs text-gray-600">Miles</label>
            <input className="w-full px-3 py-2 border rounded" type="number" step="0.1" value={local.miles ?? ""} onChange={(e) => setLocal({ ...local, miles: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="block text-xs text-gray-600">Stops</label>
            <input className="w-full px-3 py-2 border rounded" type="number" value={local.stops ?? ""} onChange={(e) => setLocal({ ...local, stops: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-600">Pickup Zone</label>
            <input className="w-full px-3 py-2 border rounded" value={local.pickupZone ?? ""} onChange={(e) => setLocal({ ...local, pickupZone: e.target.value })} />
          </div>
          <div className="col-span-2">
            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer">View raw OCR text</summary>
              <pre className="whitespace-pre-wrap text-xs mt-2 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded">{local.rawText}</pre>
            </details>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={() => onConfirm(local)} className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg">Confirm</button>
          <button onClick={onCancel} className="flex-1 bg-gray-200 py-2 rounded-lg">Cancel</button>
        </div>
      </div>
    </div>
  );
}
