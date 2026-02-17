import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  AlertCircle,
  LogOut,
  BarChart3,
  Settings,
  Lock,
  User,
} from "lucide-react";
import { ordersManager } from "@/utils/ordersManager";
import { DrivingSession, OrderData } from "@shared/types";

interface MLSettings {
  enableAutoScaling: boolean;
  useHistoricalWeighting: boolean;
  enableAnomalyDetection: boolean;
  minDataPointsForPrediction: number;
  modelVersioning: string;
}

export default function AdminMLPanel() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<"metrics" | "settings">("metrics");
  const [metrics, setMetrics] = useState({
    totalUsers: 1,
    totalSessions: 0,
    totalOrders: 0,
    totalTimeSpent: 0,
    avgOrdersPerSession: 0,
    avgSessionDuration: 0,
    dataQualityScore: 0,
  });
  const [mlSettings, setMlSettings] = useState<MLSettings>({
    enableAutoScaling: true,
    useHistoricalWeighting: true,
    enableAnomalyDetection: true,
    minDataPointsForPrediction: 10,
    modelVersioning: "v1.0.2",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    // Check if user is the admin account
    if (user?.username === "jack_am") {
      setIsAuthorized(true);
      loadMetrics();
      loadMLSettings();
    } else {
      setIsAuthorized(false);
    }
  }, [user]);

  const loadMetrics = () => {
    try {
      const allSessions = ordersManager.getAllSessions();
      const allOrders = ordersManager.getAllOrders();

      // Calculate metrics
      const totalTimeSpent = allSessions.reduce(
        (sum, session) => sum + session.totalHours,
        0
      );

      const avgOrdersPerSession =
        allSessions.length > 0
          ? allOrders.length / allSessions.length
          : 0;

      const avgSessionDuration =
        allSessions.length > 0 ? totalTimeSpent / allSessions.length : 0;

      // Calculate data quality score (0-100)
      const ordersWithCompleteData = allOrders.filter(
        (order) => order.delayedDataCollectedAt
      ).length;
      const dataQualityScore =
        allOrders.length > 0
          ? (ordersWithCompleteData / allOrders.length) * 100
          : 0;

      setMetrics({
        totalUsers: 1, // Single user in demo
        totalSessions: allSessions.length,
        totalOrders: allOrders.length,
        totalTimeSpent: parseFloat(totalTimeSpent.toFixed(2)),
        avgOrdersPerSession: parseFloat(avgOrdersPerSession.toFixed(2)),
        avgSessionDuration: parseFloat(avgSessionDuration.toFixed(2)),
        dataQualityScore: parseFloat(dataQualityScore.toFixed(1)),
      });
    } catch (error) {
      console.error("Failed to load metrics:", error);
    }
  };

  const loadMLSettings = () => {
    try {
      const saved = localStorage.getItem("ml_model_settings");
      if (saved) {
        setMlSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load ML settings:", error);
    }
  };

  const saveMLSettings = async () => {
    setIsSaving(true);
    setSaveMessage("");

    try {
      // Save to localStorage
      localStorage.setItem("ml_model_settings", JSON.stringify(mlSettings));

      // Save to backend
      const response = await fetch("/api/admin/ml-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user?.username,
          settings: mlSettings,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setSaveMessage("✓ Settings saved successfully");
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        setSaveMessage("✗ Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save ML settings:", error);
      setSaveMessage("✗ Error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    if (confirm(t("order.areYouSure"))) {
      logout();
      navigate("/login");
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white/60 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {t("nav.ude")}
            </h1>
            <button
              onClick={() => navigate("/")}
              className="text-gray-600 hover:text-gray-900 transition"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
            <p className="text-gray-600 text-sm">
              The ML/Data admin panel is restricted to authorized accounts only.
            </p>
            <button
              onClick={() => navigate("/")}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {t("nav.ude")}
            </h1>
            <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
              <Lock className="w-4 h-4" />
              Admin ML/Data Panel
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 text-gray-700 hover:from-purple-100 hover:to-blue-100 border border-purple-200 rounded-lg font-semibold transition"
              title={t("order.account")}
            >
              <User className="w-4 h-4" />
              {t("order.account")}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-red-600 transition"
              title={t("nav.signOut")}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab("metrics")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === "metrics"
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            ML Metrics
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === "settings"
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
            }`}
          >
            <Settings className="w-5 h-5" />
            Model Settings
          </button>
        </div>

        {/* Metrics Tab */}
        {activeTab === "metrics" && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              ML Model Metrics Dashboard
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Total Sessions */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                <p className="text-sm text-blue-600 font-semibold mb-2">
                  Total Sessions
                </p>
                <p className="text-3xl font-bold text-blue-900">
                  {metrics.totalSessions}
                </p>
                <p className="text-xs text-blue-700 mt-2">Driving sessions created</p>
              </div>

              {/* Total Orders Logged */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                <p className="text-sm text-green-600 font-semibold mb-2">
                  Total Orders Logged
                </p>
                <p className="text-3xl font-bold text-green-900">
                  {metrics.totalOrders}
                </p>
                <p className="text-xs text-green-700 mt-2">
                  Orders added to model training
                </p>
              </div>

              {/* Total Time Spent */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
                <p className="text-sm text-purple-600 font-semibold mb-2">
                  Total Time Spent
                </p>
                <p className="text-3xl font-bold text-purple-900">
                  {metrics.totalTimeSpent}h
                </p>
                <p className="text-xs text-purple-700 mt-2">
                  Cumulative session duration
                </p>
              </div>

              {/* Data Quality Score */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
                <p className="text-sm text-orange-600 font-semibold mb-2">
                  Data Quality Score
                </p>
                <p className="text-3xl font-bold text-orange-900">
                  {metrics.dataQualityScore}%
                </p>
                <p className="text-xs text-orange-700 mt-2">
                  Complete data collection rate
                </p>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Average Orders Per Session
                </h3>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-purple-600">
                    {metrics.avgOrdersPerSession.toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-600 mb-2">orders</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Average Session Duration
                </h3>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-blue-600">
                    {metrics.avgSessionDuration.toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-600 mb-2">hours</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Active Users
                </h3>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-green-600">
                    {metrics.totalUsers}
                  </span>
                  <span className="text-sm text-gray-600 mb-2">user</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              ML Model Configuration
            </h2>

            <div className="space-y-6">
              {/* Model Version Info */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Model Version
                </h3>
                <p className="text-lg font-mono text-purple-600 mb-2">
                  {mlSettings.modelVersioning}
                </p>
                <p className="text-xs text-gray-600">
                  Current ML model version in production
                </p>
              </div>

              {/* Setting: Auto Scaling */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    Enable Auto Scaling
                  </h3>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mlSettings.enableAutoScaling}
                      onChange={(e) =>
                        setMlSettings({
                          ...mlSettings,
                          enableAutoScaling: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-600">
                  Automatically adjust model complexity based on data volume
                </p>
              </div>

              {/* Setting: Historical Weighting */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    Use Historical Weighting
                  </h3>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mlSettings.useHistoricalWeighting}
                      onChange={(e) =>
                        setMlSettings({
                          ...mlSettings,
                          useHistoricalWeighting: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-600">
                  Give more weight to recent data points in model training
                </p>
              </div>

              {/* Setting: Anomaly Detection */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">
                    Enable Anomaly Detection
                  </h3>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mlSettings.enableAnomalyDetection}
                      onChange={(e) =>
                        setMlSettings({
                          ...mlSettings,
                          enableAnomalyDetection: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-600">
                  Flag and exclude outlier data points from model training
                </p>
              </div>

              {/* Setting: Min Data Points */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">
                    Minimum Data Points for Prediction
                  </h3>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={mlSettings.minDataPointsForPrediction}
                    onChange={(e) =>
                      setMlSettings({
                        ...mlSettings,
                        minDataPointsForPrediction: parseInt(e.target.value) || 10,
                      })
                    }
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold"
                  />
                </div>
                <p className="text-sm text-gray-600">
                  Minimum orders needed before making ML recommendations
                </p>
              </div>

              {/* Save Message */}
              {saveMessage && (
                <div
                  className={`p-4 rounded-lg text-sm font-semibold ${
                    saveMessage.includes("✓")
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {saveMessage}
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={saveMLSettings}
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
