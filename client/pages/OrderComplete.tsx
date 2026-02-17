import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, ChevronRight } from "lucide-react";
import { OrderData } from "@shared/types";

export default function OrderComplete() {
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState<OrderData | null>(null);

  useEffect(() => {
    const state = location.state as { order?: OrderData };
    if (!state?.order) {
      navigate("/");
      return;
    }
    setOrder(state.order);
  }, [location, navigate]);

  const handleBackHome = () => {
    navigate("/");
  };

  if (!order) return null;

  const hourlyRate = order.actualTotalTime
    ? (order.actualPay || order.shownPayout) / (order.actualTotalTime / 60)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            UDE+
          </h1>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
            {/* Success Icon */}
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Order Complete!
              </h2>
              <p className="text-gray-600 mt-2">
                Thank you for using UDE+
              </p>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                Order Summary
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Actual Payout:</span>
                  <span className="font-semibold text-gray-900">
                    ${(order.actualPay || order.shownPayout).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Total Time:</span>
                  <span className="font-semibold text-gray-900">
                    {order.actualTotalTime} minutes
                  </span>
                </div>

                {order.waitTimeAtRestaurant && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wait Time:</span>
                    <span className="font-semibold text-gray-900">
                      {order.waitTimeAtRestaurant} minutes
                    </span>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="text-gray-600 font-semibold">
                    Hourly Rate:
                  </span>
                  <span className="font-bold text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text">
                    ${hourlyRate.toFixed(2)}/hr
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {order.numberOfStops}
                </p>
                <p className="text-xs text-blue-700 mt-1">Stops</p>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {order.miles.toFixed(1)}
                </p>
                <p className="text-xs text-purple-700 mt-1">Miles</p>
              </div>
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleBackHome}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition"
            >
              Analyze Next Order <ChevronRight className="w-4 h-4" />
            </button>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-700">
              <p className="font-semibold mb-1">Order Saved</p>
              <p>
                Your order data has been saved to help improve UDE+ predictions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
