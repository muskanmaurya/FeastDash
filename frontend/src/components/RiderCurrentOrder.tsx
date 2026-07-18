import axios from "axios";
import type { IOrder } from "../types";
import { riderService } from "../config";
import toast from "react-hot-toast";

interface Props{
    order:IOrder;
    onStatusUpdate: () =>void;
}

const RiderCurrentOrder = ({ order, onStatusUpdate }: Props) => {
    const updateStatus = async()=>{
        try{
            await axios.put(`${riderService}/api/rider/order/update/${order._id}`, {}, {
                headers:{
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                }
            })

            toast.success("Order status updated successfully");
            onStatusUpdate(); // Call the function to refresh the current order
        }catch(error: any){
            console.error("Error updating order status:", error);
            toast.error(error.response?.data?.message || "Failed to update order status");
        }
    }

  return (
    <div className="rounded-xl shadow-sm p-4 space-y-4" >
        <h1 className="text-lg font-semibold text-gray-800">
            Current Order
        </h1>

        <div className="text-sm text-gray-600 space-y-1" >
            <p>
                <b>Pickup: </b>
                {order.restaurantName}
            </p>
            <p>
                <b>Drop: </b>
                {order.deliveryAddress.formattedAddress}
            </p>
            <p>
                <b>Total: </b>
                Rs.{order.totalAmount}
            </p>
            <p>
                <b>Your Earning: </b>
                Rs.{order.riderAmount}
            </p>
            <p>
                <b>Status: </b>
                <span className="capitalize text-blue-600" >{order.status.replace("-", " ")}</span>
            </p>

            {
                order.deliveryAddress.mobile && (
                    <div className="flex items-center justify-between rounded-lg border p-3" >
                        <div className="text-sm" >
                            <p className="font-normal" > Customer Phone: </p>
                            <p className="font-medium" > {order.deliveryAddress.mobile}</p>
                        </div>
                            <a href={`tel:${order.deliveryAddress.mobile}`} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:underline" >
                                Call
                            </a>
                    </div>
                )
            }

            <div className="space-y-2 cursor-pointer">
                {order.status === "rider-assigned" && (
                    <button onClick={()=>updateStatus()} className="bg-amber-500 hover:bg-amber-600 text-white cursor-pointer px-4 py-2 rounded-lg text-sm font-semibold hover:underline" >
                        Reached Restaurant
                    </button>
                )}
                {order.status === "picked-up" && (
                    <button onClick={()=>updateStatus()} className="bg-green-500 hover:bg-green-600 text-white cursor-pointer px-4 py-2 rounded-lg text-sm font-semibold hover:underline" >
                        Mark as Delivered
                    </button>
                )}
            </div>
        </div>
    </div>
  )
}

export default RiderCurrentOrder