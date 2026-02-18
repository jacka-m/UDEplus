import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, User } from "lucide-react";
import { QuickLogPrompt } from "@/components/QuickLogPrompt";
import { OrderData } from "@shared/types";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { saveActiveOrderState, loadActiveOrderState, clearActiveOrderState } from "@/utils/storage";
import { useSession } from "@/context/SessionContext";
import { toast } from "@/hooks/use-toast";

export default function OrderDropoff() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [dropped, setDropped] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderData | null>(null);
  const [dropoffPromptDismissed, setDropoffPromptDismissed] = useState(false);

  useEffect(() => {
    const state = location.state as { orderData?: OrderData };
    if (state?.orderData) {
      setOrderData(state.orderData);
    } else {
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
  }, [location, navigate]);

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  const { addPendingImmediateSurvey, getNextPendingImmediateSurvey } = useSession();

  const handleDropoffComplete = () => {
    const now = new Date();

    // Calculate actual time taken
    const startTime = new Date(orderData.acceptedAt || now);
    const actualTime = Math.round((now.getTime() - startTime.getTime()) / 60000); // minutes

    const updated: OrderData = {
      ...orderData,
      actualEndTime: now.toISOString(),
      actualTotalTime: actualTime,
    };

    setCompletedOrder(updated);
    setDropped(true);

    try {
      addPendingImmediateSurvey && addPendingImmediateSurvey(updated);
    } catch {}
  };

  // Driver indicates all orders in the trip are done — show immediate survey
  const handleAllOrdersDone = () => {
    // Navigate to the next pending immediate survey (oldest first)
    const next = getNextPendingImmediateSurvey();
    if (next) {
      saveActiveOrderState("survey-immediate", next);
      navigate("/post-order-survey-immediate", { state: { orderData: next } });
      return;
    }

    // Fallback to completedOrder if nothing in session pending list
    if (!completedOrder) return;
    saveActiveOrderState("survey-immediate", completedOrder);
    navigate("/post-order-survey-immediate", { state: { orderData: completedOrder } });
  };

  // Driver has more orders — skip survey and go back to analyze
  const handleMoreOrders = () => {
    if (!completedOrder) return;
    clearActiveOrderState();
    navigate("/analyze");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {dropped ? "Order Complete" : "Standing by for dropoff…"}
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
            {!dropped && !dropoffPromptDismissed && (
              <QuickLogPrompt
                text={`🚚 En route to dropoff | From: ${orderData.pickupZone} | To: ${orderData.dropoffZone || "TBD"} | ${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`}
                onDismiss={() => setDropoffPromptDismissed(true)}
              />
            )}
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
            {!dropped ? (
              <>
                {/* Status Message */}
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Order En Route
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Complete dropoff to continue
                  </p>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pickup Zone:</span>
                    <span className="font-semibold text-gray-900">
                      {orderData.pickupZone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dropoff Zone:</span>
                    <span className="font-semibold text-gray-900">
                      {orderData.dropoffZone || "Not specified"}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-3">
                    <span className="text-gray-600">Est. Payout:</span>
                    <span className="font-semibold text-gray-900">
                      ${orderData.shownPayout.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={handleDropoffComplete}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition"
                >
                  Order dropped off
                </button>

                {/* Help Text */}
                <p className="text-center text-xs text-gray-500">
                  Tap the button above once you've completed the dropoff
                </p>
              </>
            ) : (
              <>
                {/* Post-dropoff: what's next? */}
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Order Delivered!</h2>
                  <p className="text-gray-600 text-sm">What would you like to do next?</p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-600 text-center">Use the session action bar (top-right) to add another order or start deliveries.</p>
                  <button
                    onClick={handleAllOrdersDone}
                    className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                  >
                    Done for Now — Quick Feedback
                  </button>
                </div>

                <p className="text-center text-xs text-gray-500">
                  Quick feedback helps improve future recommendations
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
