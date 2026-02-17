import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, ChevronRight, AlertCircle, Clock, User } from "lucide-react";
import { OrderData } from "@shared/types";
import { useAuth } from "@/context/AuthContext";
import { ordersManager } from "@/utils/ordersManager";
import { useLanguage } from "@/context/LanguageContext";

export default function PostOrderSurveyDelayed() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    pickupSiteName: "",
    pickupSiteAddress: "",
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

      // Add delayed survey data to order
      const completedOrder: OrderData = {
        ...orderData,
        pickupSiteName: formData.pickupSiteName,
        pickupSiteAddress: formData.pickupSiteAddress,
        actualPay: formData.actualPay,
        delayedDataCollectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save complete order with all data
      const response = await fetch("/api/orders/delayed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(completedOrder),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to save survey");
      }

      // Update completed order in user's historical data (localStorage)
      // This ensures the order record is updated with the delayed data
      const existingOrders = localStorage.getItem("ude_all_orders");
      const allOrders: OrderData[] = existingOrders ? JSON.parse(existingOrders) : [];
      const updatedOrders = allOrders.map(order =>
        order.id === completedOrder.id ? completedOrder : order
      );
      localStorage.setItem("ude_all_orders", JSON.stringify(updatedOrders));

      setSuccess(true);

      // Redirect back to main session after 1 second
      setTimeout(() => {
        navigate("/", { state: { delayedDataSaved: true } });
      }, 1000);
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
          <div className="text-5xl">✓</div>
          <h2 className="text-2xl font-bold text-gray-900">Thank you!</h2>
          <p className="text-gray-600">Order data has been saved successfully</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Final Order Details
          </h1>
          {user && (
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 text-gray-700 hover:from-purple-100 hover:to-blue-100 border border-purple-200 rounded-lg font-semibold transition"
              title={t('order.account')}
            >
              <User className="w-4 h-4" />
              {t('order.account')}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-6 sm:py-8">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 space-y-6">
            {/* Timer Badge */}
            <div className="flex items-center gap-2 text-sm bg-green-50 text-green-700 px-3 py-2 rounded-lg w-fit">
              <Clock className="w-4 h-4" />
              <span>2-hour reminder received</span>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Complete Your Order Record
              </h2>
              <p className="text-gray-600 text-sm">
                Help us finalize the record for order #{orderData.id.split("_")[1]}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pickup Site Section */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Pickup Site Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pickup Site Name
                    </label>
                    <input
                      type="text"
                      value={formData.pickupSiteName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pickupSiteName: e.target.value,
                        })
                      }
                      placeholder="e.g., Joe's Pizza, Main St Deli"
                      disabled={loading}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 transition disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pickup Site Address
                    </label>
                    <input
                      type="text"
                      value={formData.pickupSiteAddress}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pickupSiteAddress: e.target.value,
                        })
                      }
                      placeholder="Full address including street, city, state, zip"
                      disabled={loading}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 transition disabled:opacity-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Example: 123 Main St, New York, NY 10001
                    </p>
                  </div>
                </div>
              </div>

              {/* Final Payout Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Final Payment Information
                </h3>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Actual Payout Received
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">$</span>
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
                  <p className="text-xs text-gray-500 mt-1">
                    Original offer: ${orderData.shownPayout.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm text-purple-700">
                <p className="font-semibold mb-2">🤖 ML Model Training</p>
                <p className="text-xs">
                  Completing this information helps our AI learn the relationship
                  between order characteristics and actual profitability, improving
                  future recommendations.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Complete Order Record"}{" "}
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>

            {/* Optional Note */}
            <p className="text-center text-xs text-gray-500">
              This information helps us build a smarter prediction model
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
