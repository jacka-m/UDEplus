import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { loadActiveOrderState, saveActiveOrderState } from "@/utils/storage";
import { useSession } from "@/context/SessionContext";

export default function SessionEditModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  const { updateOrderInSession } = useSession();
  const [local, setLocal] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      const saved = loadActiveOrderState();
      setLocal(saved?.orderData ? { ...saved.orderData } : null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (key: string, value: any) => {
    setLocal((l: any) => ({ ...l, [key]: value }));
  };

  const handleSave = () => {
    if (!local) return;
    saveActiveOrderState((local.actualStartTime ? "dropoff" : "pickup") as any, local);
    try {
      updateOrderInSession && updateOrderInSession(local);
    } catch (e) {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md bg-white rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Edit Order Details</h3>
          <button onClick={onClose} className="text-gray-500"><X className="w-5 h-5" /></button>
        </div>

        {!local ? (
          <p className="text-sm text-gray-500">No active order to edit.</p>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-600">Payout</label>
              <input type="number" value={local.shownPayout ?? 0} onChange={(e) => handleChange('shownPayout', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="text-xs text-gray-600">Estimated Time (min)</label>
              <input type="number" value={local.estimatedTime ?? 0} onChange={(e) => handleChange('estimatedTime', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="text-xs text-gray-600">Miles</label>
              <input type="number" value={local.miles ?? 0} onChange={(e) => handleChange('miles', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="text-xs text-gray-600">Stops</label>
              <input type="number" value={local.numberOfStops ?? 1} onChange={(e) => handleChange('numberOfStops', parseInt(e.target.value) || 1)} className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="text-xs text-gray-600">Pickup Zone</label>
              <input type="text" value={local.pickupZone ?? ''} onChange={(e) => handleChange('pickupZone', e.target.value)} className="w-full px-3 py-2 border rounded" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="px-3 py-2 bg-gray-100 rounded">Cancel</button>
              <button onClick={handleSave} className="px-3 py-2 bg-purple-600 text-white rounded">Save</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
