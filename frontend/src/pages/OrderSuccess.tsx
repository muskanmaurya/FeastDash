import { useSearchParams } from "react-router-dom";
import { utilsService } from "../config";
import axios from "axios";
import toast from "react-hot-toast";
import { useEffect } from "react";

const OrderSuccess = () => {
    const [params] = useSearchParams();

    const sessionId = params.get("session_id")

    useEffect(()=>{
        const verifyPayement = async()=>{
            if(!sessionId) return;

            try{
                await axios.post(`${utilsService}/api/payment/stripe/verify`, {sessionId});
                
                toast.success("Payment successful! 🎉");
            }catch(error){
                console.error("Error verifying payment:", error);
                toast.error("Payment verification failed. Please contact support.");
            }
        }

        verifyPayement();
    },[sessionId])

    
  return (
    <div className="flex h-[60vh] items-center justify-center">
        <h1 className="text-2xl font-bold text-green-600">Payment Successful! 🎉</h1>
    </div>
  )
}

export default OrderSuccess