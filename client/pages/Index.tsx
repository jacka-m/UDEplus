import { useState, useEffect, useRef } from "react";
import { X, ChevronRight, Loader2 } from "lucide-react";

type FlowStep =
  | "form"
  | "recommendation"
  | "offerChoice"
  | "loading"
  | "orderWait";

interface FormData {
  stops: number;
  payout: number;
  miles: number;
  estimatedTime: number;
  pickupZone: string;
}

export default function Index() {
  const [step, setStep] = useState<FlowStep>("form");
  const [formData, setFormData] = useState<FormData>({
    stops: 0,
    payout: 0,
    miles: 0,
    estimatedTime: 0,
    pickupZone: "",
  });
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [loadingTime, setLoadingTime] = useState(0);
  const [showWaitButton, setShowWaitButton] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  const calculateScore = (data: FormData): number => {
    // ML algorithm to calculate hourly rate score (1-4)
    // Formula considers multiple factors
    const hourlyRate = (data.payout / (data.estimatedTime / 60)) * 1.2; // Adjusted for 1.2x multiplier
    const milesEfficiency = data.payout / Math.max(data.miles, 0.1);
    const stopsBonus = Math.min(data.stops * 0.1, 0.5); // Bonus for multiple stops
    const zoneMultiplier = data.pickupZone.toLowerCase() === "downtown" ? 1.2 : 1;

    // Weighted score calculation
    const baseScore =
      (hourlyRate * 0.5 + milesEfficiency * 0.3 + stopsBonus * 0.2) *
      zoneMultiplier;

    // Normalize to 1-4 scale
    if (baseScore < 15) return 1;
    if (baseScore < 20) return 2;
    if (baseScore < 25) return 3;
    return 4;
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
    const now = new Date();
    setStartTime(now);
    setLoadingTime(0);
    setShowWaitButton(false);
    setStep("loading");

    // Start timer - show wait button after 5 seconds
    timerRef.current = setTimeout(() => {
      setShowWaitButton(true);
    }, 5000);
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

  const handleCloseLoading = () => {
    if (
      confirm("Did you decline the offer?")
    ) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      handleDeclinedOffer();
    }
  };

  const handleOrderWait = () => {
    // This is where the user clicks when they're waiting for the order
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    // Record completion time - can be used for analytics
    const endTime = new Date();
    const completionMinutes =
      startTime && (endTime.getTime() - startTime.getTime()) / 60000;
    console.log(
      `Order completed. Time taken: ${completionMinutes?.toFixed(1)} minutes`
    );
    handleDeclinedOffer();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      {/* Modern header */}
      <div className="border-b border-gray-200 bg-white/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Welcome to UDE+
          </h1>
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

        {/* Loading Step */}
        {step === "loading" && (
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                  <span className="text-lg font-semibold text-gray-900">
                    Loading…
                  </span>
                </div>
                <button
                  onClick={handleCloseLoading}
                  className="text-gray-400 hover:text-gray-600 transition"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Order details are being prepared
                </p>
                <p className="text-xs text-gray-500">
                  Started at {startTime?.toLocaleTimeString()}
                </p>
              </div>

              {showWaitButton && (
                <button
                  onClick={handleOrderWait}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
                >
                  Click if you have to wait for order
                </button>
              )}

              {!showWaitButton && (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                    Ready in a moment...
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
