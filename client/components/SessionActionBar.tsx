import { useNavigate } from "react-router-dom";
import { PlusCircle, Truck, Edit3 } from "lucide-react";
import { useSession } from "@/context/SessionContext";
import { useState } from "react";
import SessionEditModal from "./SessionEditModal";

export default function SessionActionBar() {
  const navigate = useNavigate();
  const { session, isSessionActive, setTripPhase, getNextUndeliveredOrder } = useSession();
  const [showEdit, setShowEdit] = useState(false);

  if (!isSessionActive || !session) return null;

  const handleAddOrder = () => {
    setTripPhase("collecting");
    navigate("/analyze");
  };

  const handleStartDeliveries = () => {
    setTripPhase("delivering");
    const next = getNextUndeliveredOrder();
    if (next) {
      navigate("/order-dropoff", { state: { orderData: next } });
    }
  };

  return (
    <>
      <SessionEditModal isOpen={showEdit} onClose={() => setShowEdit(false)} />
      <div className="fixed top-16 right-4 z-50 flex flex-col gap-2">
        <button
          onClick={() => setShowEdit(true)}
          title="Edit current order details"
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md text-sm"
        >
          <Edit3 className="w-4 h-4 text-blue-600" /> Edit Details
        </button>

        <button
          onClick={handleAddOrder}
          title="Add another order to this trip"
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md text-sm"
        >
          <PlusCircle className="w-4 h-4 text-purple-600" /> Add Order
        </button>

        <button
          onClick={handleStartDeliveries}
          title="Start deliveries (begin dropoffs)"
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md text-sm"
        >
          <Truck className="w-4 h-4 text-green-600" /> Start Deliveries
        </button>
      </div>
    </>
  );
}
