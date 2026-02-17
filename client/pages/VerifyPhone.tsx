import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function VerifyPhone() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");

  const pendingUser = sessionStorage.getItem("pending_user");

  useEffect(() => {
    if (!pendingUser) {
      navigate("/signup");
    }
  }, [pendingUser, navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!code || code.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setLoading(true);

    try {
      const userObj = JSON.parse(pendingUser!);

      const response = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userObj.id,
          code: code,
          zipCode: userObj.zipCode,
          language: userObj.language,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Verification failed");
      }

      const data = await response.json();
      setSuccessMessage("Phone verified successfully!");

      // Clear session and log in user
      sessionStorage.removeItem("pending_user");
      login(data.user);

      // Redirect after a brief delay
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setLoading(true);
    setResendTimer(60);

    try {
      const userObj = JSON.parse(pendingUser!);

      const response = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userObj.id,
          phone: userObj.phone,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to resend code");
      }

      setSuccessMessage("Code sent to your phone!");
    } catch (err) {
      setError("Failed to resend code. Please try again.");
      setResendTimer(0);
    } finally {
      setLoading(false);
    }
  };

  if (!pendingUser) return null;

  const userObj = JSON.parse(pendingUser);
  const maskedPhone = userObj.phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-****");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/60 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            UDE+
          </h1>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Verify Phone</h2>
              <p className="text-gray-600 mt-2">
                Enter the 6-digit code sent to {maskedPhone}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700">✓ {successMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 transition disabled:opacity-50 text-center text-2xl tracking-widest font-mono"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Check your text messages for the code. It may take a moment to arrive.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify & Create Account"}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <button
              onClick={handleResendCode}
              disabled={loading || resendTimer > 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
            </button>

            <div className="text-center text-sm">
              <button
                onClick={() => navigate("/signup")}
                className="text-purple-600 font-semibold hover:text-purple-700"
              >
                Back to sign up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
