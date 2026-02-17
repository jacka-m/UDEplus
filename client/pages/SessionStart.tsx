import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useSession } from "@/context/SessionContext";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";
import { Play, LogOut, TrendingUp, User, Plus } from "lucide-react";

export default function SessionStart() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { startSession } = useSession();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartSession = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      await startSession(user.id);

      // Show success notification
      toast.success("Driving Session Started! Ready to analyze orders.");

      // Navigate to order analysis page
      navigate("/analyze");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to start session";
      setError(errorMsg);
      toast.error(errorMsg);
      console.error("Failed to start session:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm(t('order.areYouSure'))) {
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
            {t('nav.ude')}
          </h1>
          <div className="flex items-center gap-2">
            {user && (
              <>
                <button
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 text-gray-700 hover:from-purple-100 hover:to-blue-100 border border-purple-200 rounded-lg font-semibold transition"
                  title={t('order.account')}
                >
                  <User className="w-4 h-4" />
                  {t('order.account')}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-red-600 transition"
                  title={t('nav.signOut')}
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
                {t('session.startDriving')}
              </h2>
              <p className="text-gray-600">
                {t('session.startSubtitle')}
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                <p className="font-semibold">Error</p>
                <p className="text-xs mt-1">{error}</p>
              </div>
            )}

            {/* Benefits Section */}
            <div className="space-y-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                {t('session.sessionBenefits')}
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="text-purple-600 font-bold">1.</span>
                  <span>{t('session.benefit1')}</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-600 font-bold">2.</span>
                  <span>{t('session.benefit2')}</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-600 font-bold">3.</span>
                  <span>{t('session.benefit3')}</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-600 font-bold">4.</span>
                  <span>{t('session.benefit4')}</span>
                </li>
              </ul>
            </div>

            {/* Session Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
              <p className="font-semibold mb-2">💡 {t('session.tips')}</p>
              <ul className="space-y-1 text-xs">
                <li>• {t('session.tip1')}</li>
                <li>• {t('session.tip2')}</li>
                <li>• {t('session.tip3')}</li>
              </ul>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartSession}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-lg font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5" />
              {loading ? t('session.startingSession') : t('session.startButton')}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Manual Session Button */}
            <button
              onClick={() => navigate("/manual-session")}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 rounded-lg font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition"
            >
              <Plus className="w-5 h-5" />
              Add Previous Session Data
            </button>

            {/* Info Footer */}
            <p className="text-center text-xs text-gray-500">
              {t('session.sessionDescription')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
