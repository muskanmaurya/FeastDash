import { useNavigate, useParams } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import { useEffect } from "react";
import { BiCheckCircle } from "react-icons/bi";
import { BsArrowRight } from "react-icons/bs";

const PaymentSuccess = () => {
    const { paymentId } = useParams<{ paymentId: string }>();
    const navigate = useNavigate();
    const { fetchCart } = useAppData();

    useEffect(() => {
        fetchCart(); // Clean cart state exactly once on initial load
    }, []); 

    return (
        <div className="flex min-h-[75vh] items-center justify-center px-4 py-8 antialiased">
            {/* Main Aesthetic Centered Card Container */}
            <div className="flex w-full max-w-md flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
                
                {/* Visual Status Indicator Icon */}
                <BiCheckCircle size={72} className="text-green-500 mb-5" />
                
                {/* Title Elements Group */}
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-2">
                    Payment Successful
                </h1>
                
                <p className="text-sm font-medium text-gray-500 mb-6">
                    Your order has been placed successfully 🎉
                </p>
                
                {/* Dynamic Parameter Badge Layer */}
                {paymentId && (
                    <div className="w-full rounded-xl bg-gray-50/70 p-4 border border-gray-100/50 mb-8 space-y-0.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                            Payment ID
                        </span>
                        <span className="text-sm font-mono font-semibold text-gray-700 select-all break-all">
                            {paymentId}
                        </span>
                    </div>
                )}
                
                {/* Re-routing Action Controls Section */}
                <div className="w-full space-y-3">
                    <button 
                        onClick={() => navigate("/")}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E23744] py-3.5 text-sm font-bold text-white shadow-sm hover:bg-red-600 transition-colors"
                    >
                        <span>Order More</span> 
                        <BsArrowRight size={16} strokeWidth={0.5} />
                    </button>
                    
                    <button
                        onClick={() => navigate("/orders")}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E23744] py-3.5 text-sm font-bold text-white shadow-sm hover:bg-red-600 transition-colors"
                    >
                        <span>Your orders</span> 
                        <BsArrowRight size={16} strokeWidth={0.5} />
                    </button>
                </div>

            </div>
        </div>
    );
};

export default PaymentSuccess;