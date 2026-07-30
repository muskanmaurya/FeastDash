import axios from "axios";
import { riderService } from "../config";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";


interface Props{
    orderId: string;
    onAccepted:()=>void;
}

const RiderOrderRequest = ({ orderId, onAccepted }: Props) => {

    const [accepting, setAccepting] = useState(false);

    const [secondsLeft, setSecondsLeft] = useState(10);

    useEffect(()=>{
        const interval = setInterval(()=>{
            setSecondsLeft((prev)=>{
                if(prev <= 1){
                    clearInterval(interval);
                    onAccepted();
                    return 0;
                }
                return prev - 1;
            })
        }, 1000);
        return ()=> clearInterval(interval);
    },[onAccepted])

    const acceptOrder = async()=>{
        try{
            await axios.post(`${riderService}/api/rider/accept/${orderId}`,{},{
               headers:{
                Authorization: `Bearer ${localStorage.getItem("token")}`
               } 
            })

            toast.success("Order accepted successfully");
            onAccepted();
        }catch(error: any){
            console.error("Error accepting order: ", error);
            toast.error("Error accepting order");
            onAccepted();
        }finally{
            setAccepting(false);
        }
    }
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm border border-green-300 space-y-3">
        <p className="text-center text-xs font-semibold text-red-600" >Accept within {secondsLeft} seconds</p>
        <p className="text-center text-xs font-semibold text-green-600" >New Delivery Request</p>
        <p>Order ID: <b>{orderId.slice(-6)}</b></p>
        <button
        disabled={accepting}
        onClick={acceptOrder}
        className="bg-green-500 hover:bg-green-600 text-white py-2 cursor-pointer px-4 rounded-md w-full"
        >{accepting? "Accepting..." : "Accept Order"}</button>
    </div>
  )
}

export default RiderOrderRequest