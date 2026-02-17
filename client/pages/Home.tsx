import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useSession } from "@/context/SessionContext";
import { Loader2 } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { isSessionActive } = useSession();
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      // If user has an active session, return to the analysis page
      if (isSessionActive) {
        navigate("/analyze");
      } else if (user?.completedOnboarding) {
        // Go directly to session start
        navigate("/session-start");
      } else {
        // Show onboarding carousel
        navigate("/onboarding");
      }
      setIsCheckingStatus(false);
    }
  }, [user, isLoading, isSessionActive, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
        <p className="mt-4 text-gray-600">Loading UDE+...</p>
      </div>
    </div>
  );
}
