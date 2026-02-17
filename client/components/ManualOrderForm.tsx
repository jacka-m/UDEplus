import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSession } from "@/context/SessionContext";
import { Plus, AlertCircle } from "lucide-react";
import { OrderData } from "@shared/types";
import { mlModel } from "@/utils/mlModel";

interface ManualOrderFormProps {
  onAddOrder: (order: OrderData) => void;
  sessionDate: string; // Date from SessionDetailsForm in format YYYY-MM-DD
}

export default function ManualOrderForm({ onAddOrder, sessionDate }: ManualOrderFormProps) {
  const { user } = useAuth();
  const { session } = useSession();
  const [formData, setFormData] = useState({
    // Basic operation info
    timeOfOrder: "09:00",
    numberOfStops: 1,
    
    // Payout and distance
    shownPayout: "",
    actualPay: "",
    miles: "",
    estimatedTime: "",
    actualTime: "",
    
    // Location info
    pickupZone: "",
    dropoffZone: "",
    restaurantName: "",
    restaurantAddress: "",
    
    // Wait time
    waitTime: "",
    
    // Difficulty ratings (1-3 scale: 1=bad/hard, 3=good/easy)
    parkingDifficulty: "2" as "1" | "2" | "3",
    dropoffDifficulty: "2" as "1" | "2" | "3",
    endZoneQuality: "2" as "1" | "2" | "3",
    
    // Multi-stop metrics (1-5 scale, only for stops > 1)
    routeCohesion: "3" as "1" | "2" | "3" | "4" | "5",
    dropoffCompression: "3" as "1" | "2" | "3" | "4" | "5",
    nextOrderMomentum: "3" as "1" | "2" | "3" | "4" | "5",
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
    if (!formData.shownPayout || parseFloat(formData.shownPayout) <= 0) {
      setError("Shown payout must be greater than 0");
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
    if (formData.numberOfStops <= 0) {
      setError("Number of stops must be at least 1");
      return false;
    }
    if (!formData.timeOfOrder) {
      setError("Time of order is required");
      return false;
    }
    if (!formData.restaurantName.trim()) {
      setError("Restaurant name is required");
      return false;
    }
    return true;
  };

  const handleAddOrder = () => {
    setError("");

    if (!validateForm()) {
      return;
    }

    // Combine session date with order time
    const orderDateTime = new Date(`${sessionDate}T${formData.timeOfOrder}`);
    
    const order: OrderData = {
      id: `order_${Date.now()}`,
      userId: user?.id || "",
      sessionId: session?.id || `manual_${Date.now()}`,
      numberOfStops: formData.numberOfStops,
      shownPayout: parseFloat(formData.shownPayout),
      miles: parseFloat(formData.miles),
      estimatedTime: parseInt(formData.estimatedTime),
      pickupZone: formData.pickupZone,
      dropoffZone: formData.dropoffZone || undefined,
      restaurantName: formData.restaurantName,
      restaurantAddress: formData.restaurantAddress || undefined,
      parkingDifficulty: parseInt(formData.parkingDifficulty) as 1 | 2 | 3,
      dropoffDifficulty: parseInt(formData.dropoffDifficulty) as 1 | 2 | 3,
      endZoneQuality: parseInt(formData.endZoneQuality) as 1 | 2 | 3,
      // Only include multi-stop metrics if stops > 1
      ...(formData.numberOfStops > 1 && {
        routeCohesion: parseInt(formData.routeCohesion) as 1 | 2 | 3 | 4 | 5,
        dropoffCompression: parseInt(formData.dropoffCompression) as 1 | 2 | 3 | 4 | 5,
        nextOrderMomentum: parseInt(formData.nextOrderMomentum) as 1 | 2 | 3 | 4 | 5,
      }),
      waitTimeAtRestaurant: formData.waitTime ? parseInt(formData.waitTime) : undefined,
      actualPay: formData.actualPay ? parseFloat(formData.actualPay) : undefined,
      actualTotalTime: formData.actualTime ? parseInt(formData.actualTime) : undefined,
      offeredAt: orderDateTime.toISOString(),
      acceptedAt: orderDateTime.toISOString(),
      dayOfWeek: orderDateTime.toLocaleDateString("en-US", { weekday: "long" }),
      date: orderDateTime.toLocaleDateString("en-US"),
      timeOfDay: orderDateTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      // AI score will be calculated and added later in ManualSessionCreator
      score: {
        score: 0, // Placeholder, may be replaced below
        recommendation: "decline" as const,
        timestamp: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Load any saved model and score the order immediately so it shows in UI during creation
    try {
      mlModel.loadModel();
      const computed = mlModel.scoreOrder(order);
      order.score = {
        score: computed,
        recommendation: computed >= 7.5 ? "take" : "decline",
        timestamp: new Date().toISOString(),
      };
    } catch (e) {
      // If scoring fails, leave placeholder and log
      console.error("Order scoring failed:", e);
    }

    onAddOrder(order);

    // Reset form
    setFormData({
      timeOfOrder: "09:00",
      numberOfStops: 1,
      shownPayout: "",
      actualPay: "",
      miles: "",
      estimatedTime: "",
      actualTime: "",
      pickupZone: "",
      dropoffZone: "",
      restaurantName: "",
      restaurantAddress: "",
      waitTime: "",
      parkingDifficulty: "2",
      dropoffDifficulty: "2",
      endZoneQuality: "2",
      routeCohesion: "3",
      dropoffCompression: "3",
      nextOrderMomentum: "3",
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

      {/* Section: Order Timing */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Timing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Time of Order *
            </label>
            <input
              type="time"
              value={formData.timeOfOrder}
              onChange={(e) => handleInputChange("timeOfOrder", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white transition"
            />
            <p className="text-xs text-gray-500 mt-1">Session date: {sessionDate}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Number of Stops *
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={formData.numberOfStops}
              onChange={(e) => handleInputChange("numberOfStops", parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white transition"
            />
          </div>
        </div>
      </div>

      {/* Section: Location Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Restaurant Name *
            </label>
            <input
              type="text"
              value={formData.restaurantName}
              onChange={(e) => handleInputChange("restaurantName", e.target.value)}
              placeholder="e.g., Joe's Pizza, McDonald's"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white transition"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Restaurant Address
            </label>
            <input
              type="text"
              value={formData.restaurantAddress}
              onChange={(e) => handleInputChange("restaurantAddress", e.target.value)}
              placeholder="e.g., 123 Main St, City, State 12345"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white transition"
            />
          </div>
        </div>
      </div>

      {/* Section: Financial Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Shown Payout ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.shownPayout}
              onChange={(e) => handleInputChange("shownPayout", e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white transition"
            />
          </div>

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
        </div>
      </div>

      {/* Section: Distance & Time */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Distance & Time</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Wait Time at Restaurant (minutes)
            </label>
            <input
              type="number"
              min="0"
              max="300"
              value={formData.waitTime}
              onChange={(e) => handleInputChange("waitTime", e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white transition"
            />
          </div>
        </div>
      </div>

      {/* Section: Quality Ratings (1-3 scale) */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Experience Ratings</h3>
        <p className="text-xs text-gray-600 mb-4">Rate each aspect from 1 (bad/difficult) to 3 (good/easy)</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Parking Difficulty
            </label>
            <select
              value={formData.parkingDifficulty}
              onChange={(e) => handleInputChange("parkingDifficulty", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white transition"
            >
              <option value="1">1 - Bad/Difficult</option>
              <option value="2">2 - Moderate</option>
              <option value="3">3 - Good/Easy</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Dropoff Difficulty
            </label>
            <select
              value={formData.dropoffDifficulty}
              onChange={(e) => handleInputChange("dropoffDifficulty", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white transition"
            >
              <option value="1">1 - Bad/Difficult</option>
              <option value="2">2 - Moderate</option>
              <option value="3">3 - Good/Easy</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              End Zone Quality
            </label>
            <select
              value={formData.endZoneQuality}
              onChange={(e) => handleInputChange("endZoneQuality", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white transition"
            >
              <option value="1">1 - Bad</option>
              <option value="2">2 - Moderate</option>
              <option value="3">3 - Good</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section: Multi-Stop Metrics (only if stops > 1) */}
      {formData.numberOfStops > 1 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Multi-Stop Metrics</h3>
          <p className="text-xs text-gray-600 mb-4">Rate each aspect from 1 (poor) to 5 (excellent)</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Route Cohesion
              </label>
              <select
                value={formData.routeCohesion}
                onChange={(e) => handleInputChange("routeCohesion", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white transition"
              >
                <option value="1">1 - Chaos (disconnected)</option>
                <option value="2">2 - Poor</option>
                <option value="3">3 - Moderate</option>
                <option value="4">4 - Good</option>
                <option value="5">5 - Excellent (same direction)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Does this feel like one clean trip?</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Dropoff Compression
              </label>
              <select
                value={formData.dropoffCompression}
                onChange={(e) => handleInputChange("dropoffCompression", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white transition"
              >
                <option value="1">1 - Far apart</option>
                <option value="2">2 - Spread out</option>
                <option value="3">3 - Moderate</option>
                <option value="4">4 - Close</option>
                <option value="5">5 - Same block/complex</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">How tightly clustered?</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Next Order Momentum
              </label>
              <select
                value={formData.nextOrderMomentum}
                onChange={(e) => handleInputChange("nextOrderMomentum", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white transition"
              >
                <option value="1">1 - Dead zone</option>
                <option value="2">2 - Slow area</option>
                <option value="3">3 - Moderate</option>
                <option value="4">4 - Good area</option>
                <option value="5">5 - Dense zone (quick good offers)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Likelihood of next good offer?</p>
            </div>
          </div>
        </div>
      )}

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
