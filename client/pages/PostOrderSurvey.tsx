import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, ChevronRight, AlertCircle } from "lucide-react";
import { OrderData } from "@shared/types";
import { useAuth } from "@/context/AuthContext";

export default function PostOrderSurvey() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    restaurantName: "",
    restaurantAddress: "",
    dropoffZone: "",
    parkingDifficulty: 2,
    dropoffDifficulty: 2,
    endZoneQuality: 2,
    routeCohesion: 3,
    dropoffCompression: 3,
    nextOrderMomentum: 3,
    actualPay: 0,
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
      if (!orderData || !user) throw new Error("Missing order or user data");

      const completedOrder: OrderData = {
        ...orderData,
        userId: user.id,
        restaurantName: formData.restaurantName,
        restaurantAddress: formData.restaurantAddress,
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
        actualPay: formData.actualPay,
        updatedAt: new Date().toISOString(),
      };

      // Save order to backend
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(completedOrder),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to save order");
      }

      // Redirect to success page
      navigate("/order-complete", { state: { order: completedOrder } });
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
            Order Complete - Final Details
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

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Restaurant Info Section */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Restaurant Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Restaurant Name
                    </label>
                    <input
                      type="text"
                      value={formData.restaurantName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          restaurantName: e.target.value,
                        })
                      }
                      placeholder="Enter restaurant name"
                      disabled={loading}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 transition disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Restaurant Address
                    </label>
                    <input
                      type="text"
                      value={formData.restaurantAddress}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          restaurantAddress: e.target.value,
                        })
                      }
                      placeholder="Enter full address"
                      disabled={loading}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 transition disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Dropoff Zone
                    </label>
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
                </div>
              </div>

              {/* Financial Section */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Financial Information
                </h3>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Actual Pay Received
                  </label>
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-2">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.actualPay || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          actualPay: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                      disabled={loading}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 transition disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Experience Ratings Section */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Experience Ratings (1-3 scale)
                </h3>

                <div className="space-y-4">
                  <RatingField
                    label="Parking Difficulty at Restaurant"
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
                    value={formData.dropoffDifficulty}
                    onChange={(val) =>
                      setFormData({ ...formData, dropoffDifficulty: val })
                    }
                    disabled={loading}
                    scale={3}
                    labels={["Easy", "Moderate", "Difficult"]}
                  />

                  <RatingField
                    label="End Zone Quality (1=Bad, 3=Excellent)"
                    value={formData.endZoneQuality}
                    onChange={(val) =>
                      setFormData({ ...formData, endZoneQuality: val })
                    }
                    disabled={loading}
                    scale={3}
                    labels={["Bad Area", "Neutral", "Great Area"]}
                  />
                </div>
              </div>

              {/* Multi-Stop Ratings (only for multi-stop orders) */}
              {orderData.numberOfStops > 1 && (
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Multi-Stop Specific Ratings
                  </h3>

                  <div className="space-y-4">
                    <RatingField
                      label="Route Cohesion (1=Chaotic, 5=Perfect)"
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
                      label="Dropoff Compression (1=Far Apart, 5=Clustered)"
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
                  </div>
                </div>
              )}

              {/* Next Order Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Next Order Opportunity
                </h3>

                <RatingField
                  label="Next Order Momentum (1=Dead, 5=Busy)"
                  value={formData.nextOrderMomentum}
                  onChange={(val) =>
                    setFormData({ ...formData, nextOrderMomentum: val })
                  }
                  disabled={loading}
                  scale={5}
                  labels={["Dead Zone", "Slow", "Normal", "Busy", "Very Busy"]}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving Order..." : "Complete & Save Order"}{" "}
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
  value: number;
  onChange: (value: number) => void;
  disabled: boolean;
  scale: 3 | 5;
  labels: string[];
}

function RatingField({
  label,
  value,
  onChange,
  disabled,
  scale,
  labels,
}: RatingFieldProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        {label}
      </label>
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
