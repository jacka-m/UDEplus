import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/context/SessionContext";
import { loadActiveOrderState } from "@/utils/storage";

export default function ProfileSessionReturnButton() {
  const navigate = useNavigate();
  const { isSessionActive } = useSession();
  const [activeOrder, setActiveOrder] = useState<{ step?: string; orderData?: any } | null>(null);

  useEffect(() => {
    try {
      const s = loadActiveOrderState();
      setActiveOrder(s);
    } catch {
      setActiveOrder(null);
    }
  }, []);

  if (!isSessionActive && !activeOrder) return null;

  const handleReturn = () => {
    if (activeOrder && activeOrder.step && activeOrder.orderData) {
      // Map step to route
      const routeMap: Record<string, string> = {
        pickup: "/order-pickup",
        wait: "/restaurant-wait",
        dropoff: "/order-dropoff",
        "survey-immediate": "/post-order-survey-immediate",
      };
      const route = routeMap[activeOrder.step] || "/analyze";
      navigate(route, { state: { orderData: activeOrder.orderData } });
      return;
    }

    // If no active order but session active, go to analyze/dashboard
    navigate("/analyze");
  };

  return (
    <button onClick={handleReturn} className="text-sm px-3 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50">
      Return to Session
    </button>
  );
}
