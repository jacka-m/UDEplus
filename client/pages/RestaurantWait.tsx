import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, User, Clock } from "lucide-react";
import { OrderData } from "@shared/types";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export default function RestaurantWait() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantAddress, setRestaurantAddress] = useState("");
  const [dropoffZone, setDropoffZone] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualMinutes, setManualMinutes] = useState("");
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const state = location.state as { orderData?: OrderData };
    if (!state?.orderData) {
      navigate("/");
      return;
    }
    setOrderData(state.orderData);
  }, [location, navigate]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  const handleOrderPickedUp = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    const waitTime = Math.round(seconds / 60); // Convert to minutes
    const updatedOrder: OrderData = {
      ...orderData,
      pickupSiteName: restaurantName || orderData.pickupSiteName,
      pickupSiteAddress: restaurantAddress || orderData.pickupSiteAddress,
      dropoffZone: dropoffZone || orderData.dropoffZone,
      waitEndTime: new Date().toISOString(),
      waitTimeAtRestaurant: waitTime,
      actualStartTime: new Date().toISOString(),
    };

    navigate("/order-dropoff", { state: { orderData: updatedOrder } });
  };

  const handleManualTimeSubmit = () => {
    if (!manualMinutes || isNaN(parseInt(manualMinutes))) {
      return;
    }

    if (intervalRef.current) clearInterval(intervalRef.current);

    const waitTime = parseInt(manualMinutes);
    const updatedOrder: OrderData = {
      ...orderData!,
      pickupSiteName: restaurantName || orderData!.pickupSiteName,
      pickupSiteAddress: restaurantAddress || orderData!.pickupSiteAddress,
      dropoffZone: dropoffZone || orderData!.dropoffZone,
      waitEndTime: new Date().toISOString(),
      waitTimeAtRestaurant: waitTime,
      actualStartTime: new Date().toISOString(),
    };

    navigate("/order-dropoff", { state: { orderData: updatedOrder } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Waiting at Restaurant
          </h1>
          {user && (
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 text-gray-700 hover:from-purple-100 hover:to-blue-100 border border-purple-200 rounded-lg font-semibold transition"
              title={t('order.account')}
            >
              <User className="w-4 h-4" />
              {t('order.account')}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
            {/* Stopwatch */}
            <div className="text-center">
              <div className="text-6xl font-bold font-mono text-transparent bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text mb-4">
                {formatTime(seconds)}
              </div>
              <p className="text-gray-600">Time waiting at restaurant</p>

              {/* Manual Time Button - Small and Translucent */}
              <button
                onClick={() => setShowManualInput(true)}
                className="mt-3 text-xs text-gray-400 hover:text-gray-500 opacity-50 hover:opacity-75 transition px-2 py-1 rounded border border-gray-300 border-dashed hover:border-gray-400"
                title="Add wait time manually"
              >
                <Clock className="w-3 h-3 inline mr-1" />
                Add wait time manually
              </button>
            </div>

            {/* Restaurant Info Form */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 space-y-4">
              <p className="text-sm font-semibold text-gray-700 mb-4">
                📝 Fill in order details while you wait
              </p>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Pickup Location Name
                </label>
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="e.g., McDonald's, Thai Palace"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Pickup Location Address
                </label>
                <input
                  type="text"
                  value={restaurantAddress}
                  onChange={(e) => setRestaurantAddress(e.target.value)}
                  placeholder="e.g., 123 Main St, Downtown"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Dropoff Zone (City/Area)
                </label>
                <input
                  type="text"
                  value={dropoffZone}
                  onChange={(e) => setDropoffZone(e.target.value)}
                  placeholder="e.g., West Hollywood, Downtown LA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleOrderPickedUp}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition"
            >
              Order Picked Up
            </button>

            {/* Help Text */}
            <p className="text-center text-xs text-gray-500">
              The timer will continue until you tap "Order Picked Up"
            </p>
          </div>
        </div>
      </div>

      {/* Manual Wait Time Modal */}
      {showManualInput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Add Wait Time Manually</h3>
            <p className="text-sm text-gray-600">
              Enter the number of minutes you waited at the restaurant
            </p>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Minutes Waited
              </label>
              <input
                type="number"
                min="0"
                max="480"
                value={manualMinutes}
                onChange={(e) => setManualMinutes(e.target.value)}
                placeholder="e.g., 15"
                autoFocus
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowManualInput(false);
                  setManualMinutes("");
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleManualTimeSubmit}
                disabled={!manualMinutes || isNaN(parseInt(manualMinutes))}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
