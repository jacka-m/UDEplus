import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useSession } from "@/context/SessionContext";
import { Play, LogOut, TrendingUp } from "lucide-react";

export default function SessionStart() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { startSession } = useSession();
  const [loading, setLoading] = useState(false);

  const handleStartSession = async () => {
    setLoading(true);
    try {
      await startSession();
      navigate("/");
    } catch (error) {
      console.error("Failed to start session:", error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to sign out?")) {
      logout();
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            UDE+
          </h1>
          <div className="flex items-center gap-3">
            {user && (
              <>
                <span className="text-sm text-gray-600">{user.username}</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
            {/* Welcome Section */}
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <Play className="w-8 h-8 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Ready to Drive?
              </h2>
              <p className="text-gray-600">
                Start a driving session to begin analyzing and tracking your orders
              </p>
            </div>

            {/* Benefits Section */}
            <div className="space-y-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                What happens in a session:
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="text-purple-600 font-bold">1.</span>
                  <span>Get AI-powered scores for each order before you accept</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-600 font-bold">2.</span>
                  <span>Track quick metrics right after each dropoff</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-600 font-bold">3.</span>
                  <span>Receive a reminder 2 hours after you finish for final details</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-600 font-bold">4.</span>
                  <span>Your data trains our ML model to improve predictions</span>
                </li>
              </ul>
            </div>

            {/* Session Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
              <p className="font-semibold mb-2">💡 Pro Tips:</p>
              <ul className="space-y-1 text-xs">
                <li>• You can end your session anytime</li>
                <li>• Quick feedback keeps data fresh and accurate</li>
                <li>• Final payout data helps calibrate our model</li>
              </ul>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartSession}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-lg font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5" />
              {loading ? "Starting Session..." : "Start a Driving Session!"}
            </button>

            {/* Info Footer */}
            <p className="text-center text-xs text-gray-500">
              Your session will track all orders and metrics until you end it
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
