import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { LogOut, MapPin, DollarSign, Globe, ChevronDown, Filter } from "lucide-react";
import { getMinimumWageByZip, getCostOfLivingFactor } from "@/utils/minimumWage";
import { ordersManager } from "@/utils/ordersManager";
import { OrderData, DrivingSession } from "@shared/types";

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const [minimumWage, setMinimumWage] = useState(0);
  const [costOfLiving, setCostOfLiving] = useState(1.0);
  const [sessions, setSessions] = useState<DrivingSession[]>([]);
  const [allOrders, setAllOrders] = useState<OrderData[]>([]);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [filterScore, setFilterScore] = useState<"all" | 1 | 2 | 3 | 4>("all");
  const [filterSession, setFilterSession] = useState<string>("all");

  useEffect(() => {
    if (user?.zipCode) {
      const wage = getMinimumWageByZip(user.zipCode);
      const col = getCostOfLivingFactor(user.zipCode);
      setMinimumWage(wage);
      setCostOfLiving(col);
    }

    // Load historical sessions and orders
    const historicalSessions = ordersManager.getAllSessions();
    const historicalOrders = ordersManager.getAllOrders();
    setSessions(historicalSessions);
    setAllOrders(historicalOrders);
  }, [user?.zipCode]);

  const handleLogout = () => {
    if (confirm("Are you sure you want to sign out?")) {
      logout();
      navigate("/login");
    }
  };

  const toggleSessionExpanded = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  // Filter orders based on selected filters
  const getFilteredOrders = (sessionId: string) => {
    return allOrders.filter((order) => {
      if (order.sessionId !== sessionId) return false;
      if (filterScore !== "all" && order.score.score !== filterScore) return false;
      return true;
    });
  };

  // Get the score color and label
  const getScoreDisplay = (score: 1 | 2 | 3 | 4) => {
    switch (score) {
      case 1:
        return {
          color: "bg-red-100 text-red-800 border-red-300",
          label: "Poor",
          recommendation: "Don't Take",
        };
      case 2:
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-300",
          label: "Fair",
          recommendation: "Consider",
        };
      case 3:
        return {
          color: "bg-blue-100 text-blue-800 border-blue-300",
          label: "Good",
          recommendation: "Take",
        };
      case 4:
        return {
          color: "bg-green-100 text-green-800 border-green-300",
          label: "Excellent",
          recommendation: "Take",
        };
    }
  };

  const languageNames: Record<string, string> = {
    en: "English",
    es: "Español",
    fr: "Français",
    pt: "Português",
    zh: "中文",
  };

  // Filter sessions based on score filter
  const filteredSessions =
    filterSession === "all"
      ? sessions
      : sessions.filter((s) => s.id === filterSession);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            UDE+
          </h1>
          <button
            onClick={() => navigate("/")}
            className="text-gray-600 hover:text-gray-900 transition"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {user?.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {user?.username}
                </h2>
                <p className="text-gray-600">UDE+ Driver Profile</p>
              </div>
            </div>
          </div>

          {/* Account Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 border-b pb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-semibold">ZIP Code</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{user?.zipCode}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Globe className="w-4 h-4" />
                <span className="text-sm font-semibold">Language</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {languageNames[user?.language || "en"]}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <span className="text-sm font-semibold">Account Created</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Minimum Wage Information */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-gray-700 font-semibold">
                  State Minimum Wage
                </span>
              </div>
              <span className="text-2xl font-bold text-green-600">
                ${minimumWage.toFixed(2)}/hr
              </span>
            </div>

            <div className="border-t border-green-200 pt-4">
              <p className="text-sm text-gray-600 mb-2">
                Cost of Living Adjustment
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-green-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-600 to-emerald-600 h-2 rounded-full"
                    style={{ width: `${(costOfLiving - 1) * 100 + 50}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {(costOfLiving * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Orders History Section */}
        {allOrders.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Orders History
              </h3>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Filter by Score
                  </label>
                  <select
                    value={filterScore}
                    onChange={(e) =>
                      setFilterScore(
                        e.target.value === "all"
                          ? "all"
                          : (parseInt(e.target.value) as 1 | 2 | 3 | 4)
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900"
                  >
                    <option value="all">All Scores</option>
                    <option value="1">Score 1 (Poor)</option>
                    <option value="2">Score 2 (Fair)</option>
                    <option value="3">Score 3 (Good)</option>
                    <option value="4">Score 4 (Excellent)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Filter by Session
                  </label>
                  <select
                    value={filterSession}
                    onChange={(e) => setFilterSession(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900"
                  >
                    <option value="all">All Sessions</option>
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {new Date(session.startTime).toLocaleDateString()} -{" "}
                        {session.totalOrders} orders
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Sessions with Orders */}
            <div className="space-y-4">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No sessions found</p>
                </div>
              ) : (
                filteredSessions.map((session) => {
                  const sessionOrders = getFilteredOrders(session.id);
                  if (sessionOrders.length === 0) return null;

                  const sessionStartDate = new Date(
                    session.startTime
                  ).toLocaleDateString();
                  const sessionStartTime = new Date(
                    session.startTime
                  ).toLocaleTimeString();

                  return (
                    <div
                      key={session.id}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      {/* Session Header */}
                      <button
                        onClick={() => toggleSessionExpanded(session.id)}
                        className="w-full px-6 py-4 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 flex items-center justify-between transition"
                      >
                        <div className="text-left">
                          <h4 className="font-semibold text-gray-900">
                            {sessionStartDate} at {sessionStartTime}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {sessionOrders.length} orders
                          </p>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-600 transition-transform ${
                            expandedSessions.has(session.id)
                              ? "transform rotate-180"
                              : ""
                          }`}
                        />
                      </button>

                      {/* Session Orders */}
                      {expandedSessions.has(session.id) && (
                        <div className="bg-white divide-y">
                          {sessionOrders.map((order, idx) => {
                            const scoreDisplay = getScoreDisplay(
                              order.score.score
                            );
                            return (
                              <div
                                key={order.id}
                                className="px-6 py-4 hover:bg-gray-50 transition"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <p className="text-sm text-gray-500">
                                      Order {idx + 1}
                                    </p>
                                    <p className="font-semibold text-gray-900">
                                      {order.pickupZone}
                                      {order.dropoffZone &&
                                        ` → ${order.dropoffZone}`}
                                    </p>
                                  </div>
                                  <div
                                    className={`px-3 py-1 rounded-full font-semibold text-sm border ${scoreDisplay.color}`}
                                  >
                                    Score {order.score.score}
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">
                                      Payout
                                    </p>
                                    <p className="font-semibold text-gray-900">
                                      ${order.shownPayout.toFixed(2)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">
                                      Miles
                                    </p>
                                    <p className="font-semibold text-gray-900">
                                      {order.miles}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">
                                      Est. Time
                                    </p>
                                    <p className="font-semibold text-gray-900">
                                      {order.estimatedTime}m
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">
                                      Stops
                                    </p>
                                    <p className="font-semibold text-gray-900">
                                      {order.numberOfStops}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">
                                      Status
                                    </p>
                                    <p className="font-semibold text-gray-900">
                                      {order.actualEndTime
                                        ? "Completed"
                                        : "Accepted"}
                                    </p>
                                  </div>
                                </div>

                                {/* Recommendation Banner */}
                                <div
                                  className={`px-3 py-2 rounded-lg text-sm font-semibold ${scoreDisplay.color}`}
                                >
                                  Recommendation: {scoreDisplay.recommendation}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {allOrders.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">No orders yet</p>
            <p className="text-gray-500">
              Start a driving session to begin tracking orders
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
          >
            Back to Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-2 bg-red-100 text-red-700 py-3 rounded-lg font-semibold hover:bg-red-200 transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
