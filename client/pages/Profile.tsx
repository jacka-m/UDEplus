import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { LogOut, MapPin, DollarSign, Globe } from "lucide-react";
import { getMinimumWageByZip, getCostOfLivingFactor } from "@/utils/minimumWage";

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const [minimumWage, setMinimumWage] = useState(0);
  const [costOfLiving, setCostOfLiving] = useState(1.0);

  useEffect(() => {
    if (user?.zipCode) {
      const wage = getMinimumWageByZip(user.zipCode);
      const col = getCostOfLivingFactor(user.zipCode);
      setMinimumWage(wage);
      setCostOfLiving(col);
    }
  }, [user?.zipCode]);

  const handleLogout = () => {
    if (confirm("Are you sure you want to sign out?")) {
      logout();
      navigate("/login");
    }
  };

  const languageNames: Record<string, string> = {
    en: "English",
    es: "Español",
    fr: "Français",
    pt: "Português",
    zh: "中文",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            UDE+
          </h1>
          <button
            onClick={() => navigate("/")}
            className="text-gray-600 hover:text-gray-900 transition"
          >
            ← Back
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
            {/* Profile Header */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user?.username.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{user?.username}</h2>
              <p className="text-gray-600">UDE+ Driver Profile</p>
            </div>

            {/* User Information */}
            <div className="space-y-4 border-b pb-8">
              <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>

              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    ZIP Code
                  </span>
                  <span className="font-semibold text-gray-900">{user?.zipCode}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Language
                  </span>
                  <span className="font-semibold text-gray-900">
                    {languageNames[user?.language || "en"]}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Account Created</span>
                  <span className="font-semibold text-gray-900">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Minimum Wage Information */}
            <div className="space-y-4 border-b pb-8">
              <h3 className="text-lg font-semibold text-gray-900">Wage Information</h3>

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
                  <p className="text-sm text-gray-600 mb-2">Cost of Living Adjustment</p>
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
                  <p className="text-xs text-gray-600 mt-2">
                    {costOfLiving > 1
                      ? "High cost of living area - Orders are evaluated with consideration for local expenses"
                      : "Standard cost of living area"}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 mt-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">How This Helps:</span> UDE+ uses your
                    regional minimum wage to score orders fairly. A $15 order is evaluated
                    differently in high-cost vs. low-cost areas to account for your local
                    economic context.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
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
      </div>
    </div>
  );
}
