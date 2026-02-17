import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, Clock, DollarSign, TrendingUp } from "lucide-react";
import { DrivingSession } from "@shared/types";

export default function SessionEnd() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<DrivingSession | null>(null);

  useEffect(() => {
    const state = location.state as { session?: DrivingSession };
    if (!state?.session) {
      navigate("/");
      return;
    }
    setSession(state.session);
  }, [location, navigate]);

  const handleContinue = () => {
    navigate("/");
  };

  if (!session) return null;

  const endTime = session.endTime ? new Date(session.endTime) : new Date();
  const dueTime = new Date(endTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

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
                Great Job!
              </h2>
              <p className="text-gray-600 mt-2">
                Your driving session has ended
              </p>
            </div>

            {/* Session Summary */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                Session Summary
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-gray-600">
                    <TrendingUp className="w-4 h-4" />
                    Total Orders
                  </div>
                  <span className="font-semibold text-gray-900">
                    {session.totalOrders}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    Est. Earnings
                  </div>
                  <span className="font-semibold text-gray-900">
                    ${session.totalEarnings.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    Total Hours
                  </div>
                  <span className="font-semibold text-gray-900">
                    {session.totalHours.toFixed(1)}h
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="text-gray-600 font-semibold">
                    Avg. Hourly Rate
                  </span>
                  <span className="font-bold text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text">
                    ${(session.totalEarnings / Math.max(session.totalHours, 0.1)).toFixed(2)}/hr
                  </span>
                </div>
              </div>
            </div>

            {/* Delayed Data Collection Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-semibold mb-1">Final Details in 2 Hours</p>
                  <p className="text-xs mb-2">
                    We'll send you a reminder at {dueTime.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })} to add:
                  </p>
                  <ul className="text-xs space-y-1">
                    <li>✓ Pickup location names & addresses</li>
                    <li>✓ Final payout amounts</li>
                  </ul>
                  <p className="text-xs mt-2 opacity-75">
                    This helps us train our ML model with complete data
                  </p>
                </div>
              </div>
            </div>

            {/* Model Improvement Info */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-sm text-purple-700">
              <p className="font-semibold mb-2">🤖 ML Model Training</p>
              <p className="text-xs">
                Your feedback helps our AI get smarter at predicting which orders
                are worth taking. The more data you provide, the better the
                recommendations become.
              </p>
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
            >
              Start New Session
            </button>

            {/* Footer */}
            <p className="text-center text-xs text-gray-500">
              You can view your full session history in your profile
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
