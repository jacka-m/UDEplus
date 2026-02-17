import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  ChevronRight,
  ChevronLeft,
  PlayCircle,
  Zap,
  MessageSquare,
  Clock,
  BarChart3,
} from "lucide-react";

const steps = [
  {
    icon: PlayCircle,
    titleKey: "onboarding.step1Title",
    descKey: "onboarding.step1Desc",
    color: "from-blue-600 to-blue-400",
  },
  {
    icon: Zap,
    titleKey: "onboarding.step2Title",
    descKey: "onboarding.step2Desc",
    color: "from-yellow-600 to-yellow-400",
  },
  {
    icon: MessageSquare,
    titleKey: "onboarding.step3Title",
    descKey: "onboarding.step3Desc",
    color: "from-green-600 to-green-400",
  },
  {
    icon: Clock,
    titleKey: "onboarding.step4Title",
    descKey: "onboarding.step4Desc",
    color: "from-purple-600 to-purple-400",
  },
  {
    icon: BarChart3,
    titleKey: "onboarding.step5Title",
    descKey: "onboarding.step5Desc",
    color: "from-pink-600 to-pink-400",
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    // Mark onboarding as completed
    if (user) {
      try {
        await fetch("/api/auth/complete-onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });
      } catch (error) {
        console.error("Failed to mark onboarding complete:", error);
      }
    }
    navigate("/session-start");
  };

  const handleSkip = async () => {
    // Skip onboarding
    if (user) {
      try {
        await fetch("/api/auth/complete-onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });
      } catch (error) {
        console.error("Failed to mark onboarding complete:", error);
      }
    }
    navigate("/session-start");
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            UDE+
          </h1>
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700 transition"
          >
            {t("onboarding.skip")}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Content Section */}
            <div className="p-8 sm:p-12 min-h-[500px] flex flex-col justify-center">
              {/* Progress Indicator */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-gray-600">
                    UDE+
                  </h3>
                  <span className="text-sm text-gray-500">
                    {currentStep + 1} / {steps.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`bg-gradient-to-r ${step.color} h-2 rounded-full transition-all duration-300`}
                    style={{
                      width: `${((currentStep + 1) / steps.length) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Icon and Content */}
              <div className="text-center space-y-6">
                <div
                  className={`w-20 h-20 mx-auto bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center`}
                >
                  <Icon className="w-10 h-10 text-white" />
                </div>

                <div className="space-y-3">
                  <h2 className="text-3xl font-bold text-gray-900">
                    {t(step.titleKey)}
                  </h2>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {t(step.descKey)}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-8 py-6 flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm font-semibold">Previous</span>
              </button>

              <div className="flex gap-2">
                {steps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentStep
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 w-8"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                  ></button>
                ))}
              </div>

              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition font-semibold"
              >
                <span>
                  {currentStep === steps.length - 1
                    ? t("onboarding.finish")
                    : t("onboarding.next")}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-8 bg-white rounded-lg shadow p-6 text-center text-sm text-gray-600">
            <p>
              💡 {t("session.tip1")} {t("session.tip2")} {t("session.tip3")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
