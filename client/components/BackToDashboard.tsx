import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/context/SessionContext";
import { loadActiveOrderState } from "@/utils/storage";

export default function BackToDashboard() {
  const navigate = useNavigate();
  const { isSessionActive } = useSession();
  const [hasActiveOrder, setHasActiveOrder] = useState(false);

  useEffect(() => {
    try {
      const saved = loadActiveOrderState();
      setHasActiveOrder(!!saved?.orderData);
    } catch {
      setHasActiveOrder(false);
    }
  }, []);

  // Do not show if a driving session is active or there's an in-flight order
  if (isSessionActive || hasActiveOrder) return null;

  return (
    <div className="fixed top-16 right-4 z-40">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md text-sm"
        title="Back to dashboard"
      >
        Back to dashboard
      </button>
    </div>
  );
}
