
import { useState } from "react";
import type { IOrder } from "../types"
import { ORDER_ACTIONS } from "../utils/orderflow";
import axios from "axios";
import { restaurantService } from "../config";
import toast from "react-hot-toast";

interface props {
  order: IOrder;
  onStatusUpdate?: () => void;
}

const statusColor = (status: string) => {
  switch (status) {
    case "placed":
      return "bg-yellow-100 text-yellow-700";
    case "accepted":
      return "bg-orange-100 text-orange-700";
    case "preparing":
      return "bg-blue-100 text-blue-700";
    case "ready-for-rider":
      return "bg-indigo-100 text-indigo-700";
    case "picked-up":
      return "bg-purple-100 text-purple-700";
    case "delivered":
      return "bg-green-100 text-green-700";
    default: 
      return "bg-gray-100 text-gray-700";
  }
}

const OrderCard = ({ order, onStatusUpdate }: props) => {
  const [loading, setLoading] = useState(false);
  
  const actions = ORDER_ACTIONS[order.status] || [];

  const updateStatus = async (status: string) => {
    try {
      setLoading(true);
      await axios.put(`${restaurantService}/api/order/${order._id}`, { status }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      toast.success(`Order status updated to ${status}`);
      onStatusUpdate?.();
    } catch (error) {
      toast.error("Failed to update order status");
      console.error("Error updating order status: ", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-3" >
      
      <div className="flex justify-between items-center ">
        <p className="font-bold text-gray-800">Order #{order._id.slice(-6)}</p>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColor(order.status)}`}>
          {order.status.replaceAll("-", " ")}
        </span>
      </div>

      <div className="text-sm font-medium text-gray-600 bg-gray-50/50 rounded-lg p-3 space-y-1">
        {order.items.map((item, i) => (
          <p key={i} className="flex justify-between">
            <span>{item.name}</span>
            <span className="text-gray-400 font-mono">x{item.quantity}</span>
          </p>
        ))}
      </div>

      <div className="flex justify-between text-sm font-bold text-gray-700 pt-1">
        <span>Total Amount:</span>
        <span className="text-gray-900">₹{order.totalAmount}</span>
      </div>
      
      <p className="text-xs font-semibold text-gray-400">
        Payment Status: <span className="uppercase text-green-600 font-bold">{order.paymentStatus}</span>
      </p>

      {order.paymentStatus === "paid" && actions.length > 0 && (
        <div className="flex flex-wrap pt-2" >
          {actions.map((status) => (
            <button 
              key={status} 
              disabled={loading} 
              onClick={() => updateStatus(status)} 
              className="w-full bg-[#E23744] text-white py-2 px-4 rounded-xl text-sm font-bold shadow-sm hover:bg-red-600 active:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Updating..." : `Mark as ${status.replaceAll("-", " ")}`}
            </button>
          ))}
        </div>
      )}

    </div>
  );
};

export default OrderCard;