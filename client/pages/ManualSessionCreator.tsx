import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSession } from "@/context/SessionContext";
import { ChevronLeft, Plus, Trash2, CheckCircle } from "lucide-react";
import { OrderData, DrivingSession } from "@shared/types";
import ManualOrderForm from "@/components/ManualOrderForm";
import SessionDetailsForm from "@/components/SessionDetailsForm";

export default function ManualSessionCreator() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { session } = useSession();
  const [step, setStep] = useState<"details" | "orders" | "review">("details");
  const [sessionDetails, setSessionDetails] = useState({
    startTime: new Date().toISOString().split("T")[0],
    endTime: new Date().toISOString().split("T")[0],
    startTimeInput: "09:00",
    endTimeInput: "17:00",
  });
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleAddOrder = (orderData: OrderData) => {
    setOrders([...orders, orderData]);
  };

  const handleRemoveOrder = (index: number) => {
    setOrders(orders.filter((_, i) => i !== index));
  };

  const handleSaveSession = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const startDateTime = new Date(
        `${sessionDetails.startTime}T${sessionDetails.startTimeInput}`
      );
      const endDateTime = new Date(
        `${sessionDetails.endTime}T${sessionDetails.endTimeInput}`
      );

      // Calculate session stats
      const totalEarnings = orders.reduce(
        (sum, o) => sum + (o.actualPay || o.shownPayout),
        0
      );
      const totalMinutes = orders.reduce(
        (sum, o) => sum + (o.actualTotalTime || o.estimatedTime || 0),
        0
      );
      const totalHours = totalMinutes / 60;

      const newSession: DrivingSession = {
        id: `session_${Date.now()}`,
        userId: user.id,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        status: "ended",
        orderIds: orders.map((o) => o.id),
        totalOrders: orders.length,
        totalEarnings,
        totalHours,
        averageScore:
          orders.length > 0
            ? orders.reduce((sum, o) => sum + o.score.score, 0) / orders.length
            : 0,
        delayedDataCollected: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save session to backend
      const sessionResponse = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSession),
      });

      if (!sessionResponse.ok) {
        throw new Error("Failed to save session");
      }

      // Save each order to backend
      for (const order of orders) {
        const orderResponse = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order),
        });

        if (!orderResponse.ok) {
          console.error("Failed to save order:", order.id);
        }
      }

      // Save to localStorage
      const existingSessions = localStorage.getItem("ude_all_sessions");
      const allSessions: DrivingSession[] = existingSessions
        ? JSON.parse(existingSessions)
        : [];
      localStorage.setItem(
        "ude_all_sessions",
        JSON.stringify([...allSessions, newSession])
      );

      const existingOrders = localStorage.getItem("ude_all_orders");
      const allOrders: OrderData[] = existingOrders ? JSON.parse(existingOrders) : [];
      localStorage.setItem(
        "ude_all_orders",
        JSON.stringify([...allOrders, ...orders])
      );

      setSuccessMessage("Session created successfully!");
      setTimeout(() => {
        navigate("/profile");
      }, 2000);
    } catch (error) {
      console.error("Failed to save session:", error);
      setSuccessMessage("Error saving session. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
        <div className="border-b border-gray-200 bg-white/60 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {t("nav.ude")}
            </h1>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-4 max-w-md">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Success!</h2>
            <p className="text-gray-600">{successMessage}</p>
            <p className="text-sm text-gray-500">Redirecting to profile...</p>
          </div>
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
            {t("nav.ude")}
          </h1>
          <button
            onClick={() => navigate("/session-start")}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Progress Steps */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-6 sm:mb-8">
          {["details", "orders", "review"].map((s) => (
            <button
              key={s}
              onClick={() => setStep(s as typeof step)}
              disabled={
                (s === "orders" && step === "details") ||
                (s === "review" && step !== "review" && orders.length === 0)
              }
              className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-semibold text-xs sm:text-base transition ${
                step === s
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {s === "details" && "Session Details"}
              {s === "orders" && "Add Orders"}
              {s === "review" && "Review & Save"}
            </button>
          ))}
        </div>

        {/* Step 1: Session Details */}
        {step === "details" && (
          <SessionDetailsForm
            sessionDetails={sessionDetails}
            setSessionDetails={setSessionDetails}
            onNext={() => setStep("orders")}
          />
        )}

        {/* Step 2: Add Orders */}
        {step === "orders" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Add Orders to Session
              </h2>
              <p className="text-gray-600 mb-6">
                Add all orders from this driving session. Each order should include
                the analysis score, payout, distance, and time.
              </p>

              <ManualOrderForm onAddOrder={handleAddOrder} />
            </div>

            {/* Orders List */}
            {orders.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Orders ({orders.length})
                </h3>
                <div className="space-y-3">
                  {orders.map((order, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          Order {index + 1} - ${order.shownPayout.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.pickupZone} → {order.dropoffZone || "N/A"} |{" "}
                          {order.miles} mi | {order.estimatedTime} min | Score:{" "}
                          {order.score.score}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveOrder(index)}
                        className="text-red-600 hover:text-red-700 transition p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setStep("details")}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Back
              </button>
              <button
                onClick={() => setStep("review")}
                disabled={orders.length === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Review
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Save */}
        {step === "review" && (
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Review Session</h2>

            {/* Session Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-semibold mb-1">Orders</p>
                <p className="text-3xl font-bold text-blue-900">{orders.length}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600 font-semibold mb-1">Earnings</p>
                <p className="text-3xl font-bold text-green-900">
                  ${orders
                    .reduce((sum, o) => sum + (o.actualPay || o.shownPayout), 0)
                    .toFixed(2)}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600 font-semibold mb-1">Hours</p>
                <p className="text-3xl font-bold text-purple-900">
                  {(
                    orders.reduce((sum, o) => sum + (o.estimatedTime || 0), 0) / 60
                  ).toFixed(1)}
                </p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-orange-600 font-semibold mb-1">
                  Avg Score
                </p>
                <p className="text-3xl font-bold text-orange-900">
                  {(
                    orders.reduce((sum, o) => sum + o.score.score, 0) / orders.length
                  ).toFixed(1)}
                </p>
              </div>
            </div>

            {/* Session Timeline */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Session Timeline</h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700">
                  <span className="font-semibold">Start:</span>{" "}
                  {new Date(
                    `${sessionDetails.startTime}T${sessionDetails.startTimeInput}`
                  ).toLocaleString()}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">End:</span>{" "}
                  {new Date(
                    `${sessionDetails.endTime}T${sessionDetails.endTimeInput}`
                  ).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Orders Summary */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">
                Orders Summary
              </h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {orders.map((order, idx) => (
                  <div
                    key={idx}
                    className="text-sm p-3 bg-white rounded border border-gray-200"
                  >
                    <p className="font-semibold text-gray-900">
                      Order {idx + 1}: ${order.shownPayout.toFixed(2)}
                    </p>
                    <p className="text-gray-600 text-xs">
                      {order.pickupZone} → {order.dropoffZone || "N/A"} | {order.miles}
                      mi | {order.estimatedTime}min | Score: {order.score.score}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setStep("orders")}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Back to Orders
              </button>
              <button
                onClick={handleSaveSession}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Session"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
