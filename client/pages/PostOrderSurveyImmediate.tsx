import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, ChevronRight, AlertCircle } from "lucide-react";
import { OrderData } from "@shared/types";
import { delayedDataReminder } from "@/utils/delayedDataReminder";
import { ordersManager } from "@/utils/ordersManager";
import { useLanguage } from "@/context/LanguageContext";

export default function PostOrderSurveyImmediate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    dropoffZone: "",
    parkingDifficulty: 2,
    dropoffDifficulty: 2,
    endZoneQuality: 2,
    routeCohesion: 3,
    dropoffCompression: 3,
    nextOrderMomentum: 3,
  });

  useEffect(() => {
    const state = location.state as { orderData?: OrderData };
    if (!state?.orderData) {
      navigate("/");
      return;
    }
    setOrderData(state.orderData);
  }, [location, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!orderData) throw new Error("Missing order data");

      // Add immediate survey data to order
      const completedOrder: OrderData = {
        ...orderData,
        dropoffZone: formData.dropoffZone,
        parkingDifficulty: formData.parkingDifficulty as 1 | 2 | 3,
        dropoffDifficulty: formData.dropoffDifficulty as 1 | 2 | 3,
        endZoneQuality: formData.endZoneQuality as 1 | 2 | 3,
        routeCohesion:
          orderData.numberOfStops > 1
            ? (formData.routeCohesion as 1 | 2 | 3 | 4 | 5)
            : undefined,
        dropoffCompression:
          orderData.numberOfStops > 1
            ? (formData.dropoffCompression as 1 | 2 | 3 | 4 | 5)
            : undefined,
        nextOrderMomentum: formData.nextOrderMomentum as 1 | 2 | 3 | 4 | 5,
        immediateDataCollectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save partial order to backend (without final payout)
      const response = await fetch("/api/orders/immediate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(completedOrder),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to save survey");
      }

      // Save completed order to user's historical data (localStorage)
      // This ensures data persists even if backend storage fails
      const existingOrders = localStorage.getItem("ude_all_orders");
      const allOrders: OrderData[] = existingOrders ? JSON.parse(existingOrders) : [];
      const updatedOrders = [...allOrders, completedOrder];
      localStorage.setItem("ude_all_orders", JSON.stringify(updatedOrders));

      // Queue for 2-hour delayed data collection
      delayedDataReminder.addOrder(completedOrder);

      // Go back to main session
      navigate("/", { state: { orderComplete: true } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {t('survey.quickFeedback')}
          </h1>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {t('survey.quickFeedback')}
              </h2>
              <p className="text-gray-600 text-sm">
                Help us improve by sharing your experience with this delivery (takes 30 seconds)
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dropoff Zone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('survey.dropoffZone')}
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  {t('survey.dropoffZoneHelp')}
                </p>
                <input
                  type="text"
                  value={formData.dropoffZone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dropoffZone: e.target.value,
                    })
                  }
                  placeholder="e.g., Downtown, West Hollywood"
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 transition disabled:opacity-50"
                />
              </div>

              {/* Rating Fields */}
              <div className="space-y-6">
                <RatingField
                  label="Parking Difficulty at Restaurant"
                  description="How easy was it to find parking at the pickup location? (Easy vs. difficult spots, time spent searching)"
                  value={formData.parkingDifficulty}
                  onChange={(val) =>
                    setFormData({ ...formData, parkingDifficulty: val })
                  }
                  disabled={loading}
                  scale={3}
                  labels={["Easy", "Moderate", "Difficult"]}
                />

                <RatingField
                  label="Dropoff Difficulty"
                  description="How difficult was it to locate and deliver to the customer? (Finding the address, accessibility, security)"
                  value={formData.dropoffDifficulty}
                  onChange={(val) =>
                    setFormData({ ...formData, dropoffDifficulty: val })
                  }
                  disabled={loading}
                  scale={3}
                  labels={["Easy", "Moderate", "Difficult"]}
                />

                <RatingField
                  label="End Zone Quality"
                  description="How is the area where you dropped off the order? Is it a good neighborhood to receive future orders from?"
                  value={formData.endZoneQuality}
                  onChange={(val) =>
                    setFormData({ ...formData, endZoneQuality: val })
                  }
                  disabled={loading}
                  scale={3}
                  labels={["Bad Area", "Neutral", "Great Area"]}
                />

                {/* Multi-Stop Ratings */}
                {orderData.numberOfStops > 1 && (
                  <>
                    <RatingField
                      label="Route Cohesion"
                      description="Did this route feel efficient or chaotic? (Same direction stops, minimal backtracking vs. scattered stops)"
                      value={formData.routeCohesion}
                      onChange={(val) =>
                        setFormData({ ...formData, routeCohesion: val })
                      }
                      disabled={loading}
                      scale={5}
                      labels={[
                        "Chaotic",
                        "Scattered",
                        "Decent",
                        "Good",
                        "Perfect",
                      ]}
                    />

                    <RatingField
                      label="Dropoff Compression"
                      description="How close were the dropoff locations? (All same building, same block, spread throughout area)"
                      value={formData.dropoffCompression}
                      onChange={(val) =>
                        setFormData({
                          ...formData,
                          dropoffCompression: val,
                        })
                      }
                      disabled={loading}
                      scale={5}
                      labels={[
                        "Far Apart",
                        "Spread Out",
                        "Mixed",
                        "Close",
                        "Clustered",
                      ]}
                    />
                  </>
                )}

                <RatingField
                  label="Next Order Momentum"
                  description="After dropping off, what's the likelihood of getting good orders? (Dead zone, busy restaurant area, etc.)"
                  value={formData.nextOrderMomentum}
                  onChange={(val) =>
                    setFormData({ ...formData, nextOrderMomentum: val })
                  }
                  disabled={loading}
                  scale={5}
                  labels={["Dead Zone", "Slow", "Normal", "Busy", "Very Busy"]}
                />
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-700">
                <p className="font-semibold mb-1">📝 {t('survey.finalDetailsReminder')}</p>
                <p>
                  {t('survey.finalDetailsMessage')}
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('survey.saving') : t('survey.completeButton')}{" "}
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RatingFieldProps {
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  disabled: boolean;
  scale: 3 | 5;
  labels: string[];
}

function RatingField({
  label,
  description,
  value,
  onChange,
  disabled,
  scale,
  labels,
}: RatingFieldProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
      </label>
      {description && (
        <p className="text-xs text-gray-500 mb-3">{description}</p>
      )}
      <div className="flex gap-2 justify-between">
        {Array.from({ length: scale }).map((_, i) => {
          const num = i + 1;
          return (
            <button
              key={num}
              type="button"
              onClick={() => onChange(num)}
              disabled={disabled}
              className={`flex-1 py-2 rounded-lg font-semibold transition text-sm ${
                value === num
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div>{num}</div>
              <div className="text-xs opacity-75">{labels[i]}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
