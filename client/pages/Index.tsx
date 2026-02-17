import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, ChevronRight, Loader2, LogOut, Clock, DollarSign, TrendingUp, Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSession } from "@/context/SessionContext";
import { useDelayedReminder } from "@/hooks/useDelayedReminder";
import { OrderData } from "@shared/types";
import { mlModel } from "@/utils/mlModel";
import { delayedDataReminder } from "@/utils/delayedDataReminder";

type FlowStep = "form" | "recommendation";

interface FormData {
  stops: number;
  payout: number;
  miles: number;
  estimatedTime: number;
  pickupZone: string;
}

export default function Index() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { session, isSessionActive, endSession, addOrderToSession } = useSession();
  const [step, setStep] = useState<FlowStep>("form");
  const [formData, setFormData] = useState<FormData>({
    stops: 0,
    payout: 0,
    miles: 0,
    estimatedTime: 0,
    pickupZone: "",
  });
  const [score, setScore] = useState(0);
  const [sessionEndLoading, setSessionEndLoading] = useState(false);
  const [reminderOrder, setReminderOrder] = useState<OrderData | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  // Setup delayed reminder hook
  useDelayedReminder({
    onReminder: (order) => {
      setReminderOrder(order);
      setShowReminderModal(true);
    },
  });

  // Check for active session on mount
  useEffect(() => {
    if (!isSessionActive) {
      navigate("/session-start");
    }
    mlModel.loadModel();

    // Request notification permission for reminders
    delayedDataReminder.requestNotificationPermission();
  }, [isSessionActive, navigate]);

  const calculateScore = (data: FormData): 1 | 2 | 3 | 4 => {
    // Create a temporary order object for ML prediction
    const tempOrder: OrderData = {
      id: "temp",
      userId: user?.id || "",
      sessionId: session?.id || "",
      numberOfStops: data.stops,
      shownPayout: data.payout,
      miles: data.miles,
      estimatedTime: data.estimatedTime,
      pickupZone: data.pickupZone,
      score: {
        score: 1,
        recommendation: "decline",
        timestamp: new Date().toISOString(),
      },
      offeredAt: new Date().toISOString(),
      dayOfWeek: new Date().toLocaleDateString("en-US", { weekday: "long" }),
      date: new Date().toLocaleDateString("en-US"),
      timeOfDay: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Use ML model for prediction
    return mlModel.predictScore(tempOrder);
  };

  const handleFormSubmit = () => {
    if (
      !formData.pickupZone ||
      formData.stops === 0 ||
      formData.payout === 0 ||
      formData.miles === 0 ||
      formData.estimatedTime === 0
    ) {
      return;
    }

    const calculatedScore = calculateScore(formData);
    setScore(calculatedScore);
    setStep("recommendation");
  };

  const handleTookOffer = () => {
    if (!user || !session) return;

    const now = new Date();
    const dayOfWeek = now.toLocaleDateString("en-US", { weekday: "long" });
    const date = now.toLocaleDateString("en-US");
    const timeOfDay = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // Create order data object
    const orderData: OrderData = {
      id: `order_${Date.now()}`,
      userId: user.id,
      sessionId: session.id,
      numberOfStops: formData.stops,
      shownPayout: formData.payout,
      miles: formData.miles,
      estimatedTime: formData.estimatedTime,
      pickupZone: formData.pickupZone,
      score: {
        score: score as 1 | 2 | 3 | 4,
        recommendation: score <= 2 ? "decline" : "take",
        timestamp: now.toISOString(),
      },
      offeredAt: now.toISOString(),
      acceptedAt: now.toISOString(),
      dayOfWeek,
      date,
      timeOfDay,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // Add to session
    addOrderToSession(orderData);

    // Navigate to order pickup page with order data
    navigate("/order-pickup", { state: { orderData } });
  };

  const handleDeclinedOffer = () => {
    setStep("form");
    setFormData({
      stops: 0,
      payout: 0,
      miles: 0,
      estimatedTime: 0,
      pickupZone: "",
    });
  };

  const handleEndSession = async () => {
    if (!session) return;

    if (
      confirm(
        `End your driving session? You've completed ${session.totalOrders} orders.`
      )
    ) {
      setSessionEndLoading(true);
      try {
        await endSession();
        // Redirect to session end summary
        navigate("/session-end", { state: { session } });
      } catch (error) {
        console.error("Failed to end session:", error);
        setSessionEndLoading(false);
      }
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
      {/* Modern header */}
      <div className="border-b border-gray-200 bg-white/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Welcome to UDE+
            </h1>
            <div className="flex items-center gap-3">
              {user && (
                <>
                  <span className="text-sm text-gray-600">
                    {user.username}
                  </span>
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

          {/* Session Info Bar */}
          {session && isSessionActive && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-gray-700">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold">{session.totalOrders}</span>
                  <span>orders</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-700">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-semibold">${session.totalEarnings.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-700">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>{session.totalHours.toFixed(1)}h</span>
                </div>
              </div>
              <button
                onClick={handleEndSession}
                disabled={sessionEndLoading}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-xs font-semibold hover:bg-red-200 transition disabled:opacity-50"
              >
                {sessionEndLoading ? "Ending..." : "End Session"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
        {/* Form Step */}
        {step === "form" && (
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Stops
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stops || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stops: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Enter number of stops"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Shown Payout from Order
                </label>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.payout || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payout: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Miles (Distance)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.miles || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      miles: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="Enter miles"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Uber Estimated Time (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.estimatedTime || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimatedTime: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Enter minutes"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pickup Zone (City)
                </label>
                <input
                  type="text"
                  value={formData.pickupZone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pickupZone: e.target.value,
                    })
                  }
                  placeholder="Enter city name (e.g., Downtown)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 transition"
                />
              </div>

              <button
                onClick={handleFormSubmit}
                disabled={
                  !formData.pickupZone ||
                  formData.stops === 0 ||
                  formData.payout === 0 ||
                  formData.miles === 0 ||
                  formData.estimatedTime === 0
                }
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Analyze Order <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Recommendation Step */}
        {step === "recommendation" && (
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
              {/* Score Display */}
              <div className="flex justify-center">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full opacity-10"></div>
                  <div className="absolute inset-2 bg-white rounded-full"></div>
                  <div className="text-center z-10">
                    <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      {score}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">Score</div>
                  </div>
                </div>
              </div>

              {/* Recommendation Text */}
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  Order Analysis Complete
                </p>
                <div className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-purple-100 to-blue-100">
                  <p
                    className={`text-sm font-semibold ${
                      score <= 2
                        ? "text-red-700"
                        : "text-green-700"
                    }`}
                  >
                    {score <= 2
                      ? "⚠️ Recommendation: Do not take this order."
                      : "✓ Recommendation: Take this order."}
                  </p>
                </div>
              </div>

              {/* Order Details Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payout:</span>
                  <span className="font-semibold text-gray-900">
                    ${formData.payout.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance:</span>
                  <span className="font-semibold text-gray-900">
                    {formData.miles.toFixed(1)} miles
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Est. Time:</span>
                  <span className="font-semibold text-gray-900">
                    {formData.estimatedTime} min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stops:</span>
                  <span className="font-semibold text-gray-900">
                    {formData.stops}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleTookOffer}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
                >
                  Took Offer
                </button>
                <button
                  onClick={handleDeclinedOffer}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Declined Offer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delayed Data Reminder Modal */}
        {showReminderModal && reminderOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bell className="w-6 h-6 text-blue-600" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-gray-900">
                  Time for Final Details
                </h3>
                <p className="text-gray-600 text-sm">
                  It's been 2 hours since you completed this order. Help us finalize
                  the record by adding the pickup location and actual payout.
                </p>
              </div>

              {/* Order Info */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Payout:</span>
                  <span className="font-semibold">
                    ${reminderOrder.shownPayout.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-mono text-xs text-gray-500">
                    {reminderOrder.id.substring(0, 12)}...
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    navigate("/post-order-survey-delayed", {
                      state: { orderData: reminderOrder },
                    });
                    setShowReminderModal(false);
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
                >
                  Add Final Details
                </button>
                <button
                  onClick={() => setShowReminderModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Later
                </button>
              </div>

              {/* Info */}
              <p className="text-xs text-gray-500 text-center">
                This data helps train our ML model
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
