import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { LogOut, MapPin, DollarSign, Globe, ChevronDown, Filter, Lock } from "lucide-react";
import { getMinimumWageByZip, getCostOfLivingFactor } from "@/utils/minimumWage";
import { ordersManager } from "@/utils/ordersManager";
import { OrderData, DrivingSession } from "@shared/types";

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [minimumWage, setMinimumWage] = useState(0);
  const [costOfLiving, setCostOfLiving] = useState(1.0);
  const [sessions, setSessions] = useState<DrivingSession[]>([]);
  const [allOrders, setAllOrders] = useState<OrderData[]>([]);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [filterScore, setFilterScore] = useState<"all" | 1 | 2 | 3 | 4>("all");
  const [filterSession, setFilterSession] = useState<string>("all");
  const [editingZipCode, setEditingZipCode] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState(false);
  const [tempZipCode, setTempZipCode] = useState(user?.zipCode || "");
  const [tempLanguage, setTempLanguage] = useState(user?.language || "en");
  const [savingChanges, setSavingChanges] = useState(false);

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

  const handleSaveZipCode = async () => {
    if (!tempZipCode.trim()) return;
    setSavingChanges(true);
    try {
      await updateUser({
        ...user!,
        zipCode: tempZipCode,
      });
      const wage = getMinimumWageByZip(tempZipCode);
      const col = getCostOfLivingFactor(tempZipCode);
      setMinimumWage(wage);
      setCostOfLiving(col);
      setEditingZipCode(false);
    } catch (error) {
      console.error("Failed to update ZIP code:", error);
    } finally {
      setSavingChanges(false);
    }
  };

  const handleSaveLanguage = async () => {
    setSavingChanges(true);
    try {
      await updateUser({
        ...user!,
        language: tempLanguage,
      });
      setLanguage(tempLanguage as "en" | "es" | "fr" | "pt" | "zh");
      setEditingLanguage(false);
    } catch (error) {
      console.error("Failed to update language:", error);
    } finally {
      setSavingChanges(false);
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
            {t('nav.ude')}
          </h1>
          <button
            onClick={() => navigate("/")}
            className="text-gray-600 hover:text-gray-900 transition"
          >
            {t('profile.backToDashboard')}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 mb-8">
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold flex-shrink-0">
                {user?.username.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
                  {user?.username}
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                  {user?.username === "jack_am" ? "UDE+ Founder, Admin" : t('profile.driverProfile')}
                </p>
              </div>
            </div>
          </div>

          {/* Account Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 border-b pb-8">
            {/* ZIP Code Card */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-semibold">{t('profile.zipCode')}</span>
                </div>
                {!editingZipCode && (
                  <button
                    onClick={() => {
                      setTempZipCode(user?.zipCode || "");
                      setEditingZipCode(true);
                    }}
                    className="text-xs text-purple-600 hover:text-purple-700 font-semibold"
                  >
                    {t('profile.edit')}
                  </button>
                )}
              </div>
              {editingZipCode ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={tempZipCode}
                    onChange={(e) => setTempZipCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    disabled={savingChanges}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveZipCode}
                      disabled={savingChanges}
                      className="flex-1 px-2 py-1 bg-purple-600 text-white text-xs rounded font-semibold hover:bg-purple-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingZipCode(false)}
                      disabled={savingChanges}
                      className="flex-1 px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded font-semibold hover:bg-gray-400 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{user?.zipCode}</p>
              )}
            </div>

            {/* Language Card */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-semibold">{t('profile.language')}</span>
                </div>
                {!editingLanguage && (
                  <button
                    onClick={() => {
                      setTempLanguage(user?.language || "en");
                      setEditingLanguage(true);
                    }}
                    className="text-xs text-purple-600 hover:text-purple-700 font-semibold"
                  >
                    {t('profile.edit')}
                  </button>
                )}
              </div>
              {editingLanguage ? (
                <div className="space-y-2">
                  <select
                    value={tempLanguage}
                    onChange={(e) => setTempLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    disabled={savingChanges}
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="pt">Português</option>
                    <option value="zh">中文</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveLanguage}
                      disabled={savingChanges}
                      className="flex-1 px-2 py-1 bg-purple-600 text-white text-xs rounded font-semibold hover:bg-purple-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingLanguage(false)}
                      disabled={savingChanges}
                      className="flex-1 px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded font-semibold hover:bg-gray-400 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {languageNames[user?.language || "en"]}
                </p>
              )}
            </div>

            {/* Account Created Card */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <span className="text-sm font-semibold">{t('profile.accountCreated')}</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Admin Panel Access (for jack_am) */}
          {user?.username === "jack_am" && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border-2 border-indigo-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock className="w-6 h-6 text-indigo-600" />
                  <div>
                    <h3 className="font-semibold text-indigo-900">
                      Admin ML/Data Panel
                    </h3>
                    <p className="text-sm text-indigo-700">
                      Access ML metrics, model settings, and system configuration
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/admin/ml-panel")}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
                >
                  Open Admin Panel
                </button>
              </div>
            </div>
          )}

          {/* Minimum Wage Information */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-gray-700 font-semibold">
                  {t('profile.minimumWage')}
                </span>
              </div>
              <span className="text-2xl font-bold text-green-600">
                ${minimumWage.toFixed(2)}{t('profile.perHour')}
              </span>
            </div>

            <div className="border-t border-green-200 pt-4">
              <p className="text-sm text-gray-600 mb-2">
                {t('profile.costOfLiving')}
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
                {t('profile.ordersHistory')}
              </h3>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('profile.filterByScore')}
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
                    <option value="all">{t('profile.allScores')}</option>
                    <option value="1">Score 1 (Poor)</option>
                    <option value="2">Score 2 (Fair)</option>
                    <option value="3">Score 3 (Good)</option>
                    <option value="4">Score 4 (Excellent)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('profile.filterBySession')}
                  </label>
                  <select
                    value={filterSession}
                    onChange={(e) => setFilterSession(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900"
                  >
                    <option value="all">{t('profile.filterBySession')}</option>
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {new Date(session.startTime).toLocaleDateString()} -{" "}
                        {session.totalOrders} {t('profile.orders')}
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
                  <p className="text-gray-500">{t('profile.noSessions')}</p>
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
            <p className="text-gray-600 mb-4">{t('profile.noOrders')}</p>
            <p className="text-gray-500">
              {t('profile.startSession')}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
          >
            {t('profile.backToDash')}
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-2 bg-red-100 text-red-700 py-3 rounded-lg font-semibold hover:bg-red-200 transition"
          >
            <LogOut className="w-4 h-4" />
            {t('nav.signOut')}
          </button>
        </div>
      </div>
    </div>
  );
}
