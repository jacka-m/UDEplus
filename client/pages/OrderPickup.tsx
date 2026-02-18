import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, Loader2, X, User } from "lucide-react";
import { QuickLogPrompt } from "@/components/QuickLogPrompt";
import { OrderData } from "@shared/types";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { saveActiveOrderState, loadActiveOrderState, clearActiveOrderState } from "@/utils/storage";
import { toast } from "@/hooks/use-toast";

export default function OrderPickup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [showDeclinePrompt, setShowDeclinePrompt] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);
  // Track how many pickups have been confirmed for multi-stop orders
  const [pickedUpCount, setPickedUpCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const state = location.state as { orderData?: OrderData };
    if (state?.orderData) {
      setOrderData(state.orderData);
    } else {
      // Attempt to restore from persisted active order state (app reload/swipe-away)
      const saved = loadActiveOrderState();
      if (saved?.orderData) {
        setOrderData(saved.orderData);
      } else {
        toast({
          title: "Session Lost",
          description: "Order data was lost. Starting fresh.",
          variant: "destructive",
        });
        navigate("/session-start");
        return;
      }
    }

    // Show buttons after 5 seconds
    timerRef.current = setTimeout(() => {
      setShowButtons(true);
    }, 5000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [location, navigate]);

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  const totalStops = orderData.numberOfStops || 1;
  const isMultiStop = totalStops > 1;
  const allPickedUp = pickedUpCount >= totalStops;

  const handleConfirmPickup = () => {
    if (isMultiStop && !allPickedUp) {
      const next = pickedUpCount + 1;
      setPickedUpCount(next);
      if (next < totalStops) {
        // More pickups remain — stay on this page, update counter
        return;
      }
    }
    // All pickups done (or single-stop) — go to dropoff
    const updatedOrder: OrderData = {
      ...orderData,
      actualStartTime: new Date().toISOString(),
    };
    saveActiveOrderState("dropoff", updatedOrder);
    navigate("/order-dropoff", { state: { orderData: updatedOrder } });
  };

  const handleNeedToWait = () => {
    const updatedOrder: OrderData = {
      ...orderData,
      waitStartTime: new Date().toISOString(),
    };
    saveActiveOrderState("wait", updatedOrder);
    navigate("/restaurant-wait", { state: { orderData: updatedOrder } });
  };

  const handleDeclineConfirm = () => {
    clearActiveOrderState();
    navigate("/analyze");
  };

  // Determine button label based on multi-pickup progress
  const pickupButtonLabel = () => {
    if (!isMultiStop) return "Order Picked Up";
    const next = pickedUpCount + 1;
    if (next < totalStops) return `Pickup ${next} of ${totalStops} — Next Pickup`;
    return `Pickup ${next} of ${totalStops} — All Orders Picked Up`;
  };

  // Header label
  const headerLabel = isMultiStop
    ? `Pickup ${pickedUpCount + 1} of ${totalStops}`
    : "Heading to pickup…";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {headerLabel}
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

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            {/* Header row */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                {isMultiStop ? (
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                ) : (
                  <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                )}
                <span className="text-lg font-semibold text-gray-900">
                  {isMultiStop
                    ? `Stop ${pickedUpCount + 1} of ${totalStops}`
                    : "Heading to pickup…"}
                </span>
              </div>
              <button
                onClick={() => setShowDeclinePrompt(true)}
                className="text-gray-400 hover:text-gray-600 transition"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Multi-stop progress indicator */}
            {isMultiStop && (
              <div className="flex gap-1">
                {Array.from({ length: totalStops }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-2 rounded-full transition-colors ${
                      i < pickedUpCount
                        ? "bg-green-500"
                        : i === pickedUpCount
                        ? "bg-purple-500"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Quick log prompt after pickup becomes available */}
            {showButtons && !promptDismissed && (
              <QuickLogPrompt
                text={`✅ Pickup confirmed | Zone: ${orderData.pickupZone} | ${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} | Stops: ${orderData.numberOfStops} | $${orderData.shownPayout.toFixed(2)}`}
                onDismiss={() => setPromptDismissed(true)}
              />
            )}

            {/* Decline Prompt */}
            {showDeclinePrompt && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold text-yellow-900">
                  Did you decline the offer?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDeclineConfirm}
                    className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg font-semibold hover:bg-red-200 transition text-sm"
                  >
                    Yes, Decline
                  </button>
                  <button
                    onClick={() => setShowDeclinePrompt(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition text-sm"
                  >
                    No, Continue
                  </button>
                </div>
              </div>
            )}

            {/* Order Details */}
            <div className="bg-gray-50 rounded-lg p-4 text-center space-y-2">
              <p className="text-sm text-gray-600">
                {orderData.restaurantName || "Restaurant"} • {orderData.pickupZone}
              </p>
              <p className="text-xs text-gray-500">
                Estimated time: {orderData.estimatedTime} min
              </p>
              {isMultiStop && (
                <p className="text-xs font-semibold text-purple-600">
                  {totalStops} stop order
                </p>
              )}
            </div>

            {/* Action Buttons - Show after 5 seconds */}
            {showButtons ? (
              <div className="space-y-3 pt-4">
                <button
                  onClick={handleConfirmPickup}
                  className={`w-full text-white py-3 rounded-lg font-semibold hover:shadow-lg transition ${
                    isMultiStop && pickedUpCount + 1 < totalStops
                      ? "bg-gradient-to-r from-purple-500 to-blue-500"
                      : "bg-gradient-to-r from-green-500 to-emerald-600"
                  }`}
                >
                  {pickupButtonLabel()}
                </button>

                {!isMultiStop && (
                  <button
                    onClick={handleNeedToWait}
                    className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                  >
                    Need to wait for order
                  </button>
                )}
                {isMultiStop && pickedUpCount === 0 && (
                  <button
                    onClick={handleNeedToWait}
                    className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                  >
                    Need to wait for order
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                  Ready in a moment...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
