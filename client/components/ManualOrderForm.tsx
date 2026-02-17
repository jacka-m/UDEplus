import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSession } from "@/context/SessionContext";
import { Plus, AlertCircle } from "lucide-react";
import { OrderData } from "@shared/types";

interface ManualOrderFormProps {
  onAddOrder: (order: OrderData) => void;
}

export default function ManualOrderForm({ onAddOrder }: ManualOrderFormProps) {
  const { user } = useAuth();
  const { session } = useSession();
  const [formData, setFormData] = useState({
    stops: 1,
    payout: "",
    miles: "",
    estimatedTime: "",
    pickupZone: "",
    dropoffZone: "",
    score: 5,
    recommendation: "decline" as "take" | "decline",
    actualPay: "",
    actualTime: "",
  });
  const [error, setError] = useState("");

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.pickupZone.trim()) {
      setError("Pickup zone is required");
      return false;
    }
    if (!formData.payout || parseFloat(formData.payout) <= 0) {
      setError("Payout must be greater than 0");
      return false;
    }
    if (!formData.miles || parseFloat(formData.miles) <= 0) {
      setError("Miles must be greater than 0");
      return false;
    }
    if (!formData.estimatedTime || parseInt(formData.estimatedTime) <= 0) {
      setError("Estimated time must be greater than 0");
      return false;
    }
    if (formData.stops <= 0) {
      setError("Stops must be at least 1");
      return false;
    }
    return true;
  };

  const handleAddOrder = () => {
    setError("");

    if (!validateForm()) {
      return;
    }

    const now = new Date();
    const order: OrderData = {
      id: `order_${Date.now()}`,
      userId: user?.id || "",
      sessionId: session?.id || `manual_${Date.now()}`,
      numberOfStops: formData.stops,
      shownPayout: parseFloat(formData.payout),
      miles: parseFloat(formData.miles),
      estimatedTime: parseInt(formData.estimatedTime),
      pickupZone: formData.pickupZone,
      dropoffZone: formData.dropoffZone || undefined,
      score: {
        score: formData.score,
        recommendation: formData.recommendation,
        timestamp: now.toISOString(),
      },
      actualPay: formData.actualPay ? parseFloat(formData.actualPay) : undefined,
      actualTotalTime: formData.actualTime ? parseInt(formData.actualTime) : undefined,
      offeredAt: now.toISOString(),
      acceptedAt: now.toISOString(),
      dayOfWeek: now.toLocaleDateString("en-US", { weekday: "long" }),
      date: now.toLocaleDateString("en-US"),
      timeOfDay: now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    onAddOrder(order);

    // Reset form
    setFormData({
      stops: 1,
      payout: "",
      miles: "",
      estimatedTime: "",
      pickupZone: "",
      dropoffZone: "",
      score: 5,
      recommendation: "decline",
      actualPay: "",
      actualTime: "",
    });
  };

  return (
    <div className="space-y-6 bg-gray-50 rounded-lg p-6 border border-gray-200">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pickup Zone */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Pickup Zone (City) *
          </label>
          <input
            type="text"
            value={formData.pickupZone}
            onChange={(e) => handleInputChange("pickupZone", e.target.value)}
            placeholder="e.g., Downtown, West LA"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white transition"
          />
        </div>

        {/* Dropoff Zone */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Dropoff Zone (City)
          </label>
          <input
            type="text"
            value={formData.dropoffZone}
            onChange={(e) => handleInputChange("dropoffZone", e.target.value)}
            placeholder="e.g., Beverly Hills"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white transition"
          />
        </div>

        {/* Payout */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Shown Payout ($) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.payout}
            onChange={(e) => handleInputChange("payout", e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white transition"
          />
        </div>

        {/* Actual Pay */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Actual Payout ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.actualPay}
            onChange={(e) => handleInputChange("actualPay", e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white transition"
          />
        </div>

        {/* Miles */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Miles (Distance) *
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="999"
            value={formData.miles}
            onChange={(e) => handleInputChange("miles", e.target.value)}
            placeholder="0.0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white transition"
          />
        </div>

        {/* Estimated Time */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Estimated Time (minutes) *
          </label>
          <input
            type="number"
            min="0"
            max="480"
            value={formData.estimatedTime}
            onChange={(e) => handleInputChange("estimatedTime", e.target.value)}
            placeholder="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white transition"
          />
        </div>

        {/* Actual Time */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Actual Time (minutes)
          </label>
          <input
            type="number"
            min="0"
            value={formData.actualTime}
            onChange={(e) => handleInputChange("actualTime", e.target.value)}
            placeholder="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white transition"
          />
        </div>

        {/* Number of Stops */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Number of Stops *
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={formData.stops}
            onChange={(e) => handleInputChange("stops", parseInt(e.target.value) || 1)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white transition"
          />
        </div>

        {/* AI Score */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            AI Score (1-10) *
          </label>
          <select
            value={formData.score}
            onChange={(e) => handleInputChange("score", parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white transition"
          >
            <option value="1">1.0 - Poor</option>
            <option value="2">2.0 - Poor</option>
            <option value="3">3.0 - Not Good</option>
            <option value="4">4.0 - Not Good</option>
            <option value="5">5.0 - Acceptable</option>
            <option value="6">6.0 - Acceptable</option>
            <option value="7">7.0 - Acceptable</option>
            <option value="8">8.0 - Great</option>
            <option value="9">9.0 - Great</option>
            <option value="10">10.0 - Great</option>
          </select>
        </div>

        {/* Recommendation */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Recommendation *
          </label>
          <select
            value={formData.recommendation}
            onChange={(e) =>
              handleInputChange("recommendation", e.target.value as "take" | "decline")
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white transition"
          >
            <option value="decline">Don't Take</option>
            <option value="take">Take</option>
          </select>
        </div>
      </div>

      {/* Add Button */}
      <button
        onClick={handleAddOrder}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition"
      >
        <Plus className="w-4 h-4" />
        Add Order to Session
      </button>
    </div>
  );
}
