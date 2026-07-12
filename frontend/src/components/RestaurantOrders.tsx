import { useEffect, useRef, useState } from "react";
import type { IOrder } from "../types";
import { useSocket } from "../context/SocketContext";
import audio from "../assets/notifications/correct-answer-tone.wav"
import { restaurantService } from "../config";
import axios from "axios";
import OrderCard from "./OrderCard";

const ACTIVE_STATUSES = ["placed", "accepted", "preparing", "ready-for-rider", "rider-assigned", "picked-up"]

const RestaurantOrders = ({restaurantId}: {restaurantId: string}) => {

    const [orders, setOrders] = useState<IOrder[]>([]);

    const [loading, setLoading] = useState(true);

    const [audioUnlocked, setAudioUnlocked] = useState(false);

    const {socket} = useSocket()

    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        audioRef.current = new Audio(audio)
        audioRef.current.load()
    },[]);

    const unlockAudio = () =>{
        if(audioRef.current){
            audioRef.current.play().then(()=>{
                audioRef.current!.pause();
                audioRef.current!.currentTime = 0;
                setAudioUnlocked(true);
                console.log("Audio unlocked")
            }).catch((error)=>{
                console.error("Error unlocking audio: ", error);
            });
        }
    }

    const fetchOrders = async()=>{
        try{
            const {data} = await axios.get(`${restaurantService}/api/order/${restaurantId}`,{
                headers:{
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            })

            setOrders(data.orders || []);
        }catch(error){
            console.error("Error fetching orders: ", error);
        }finally{
            setLoading(false);
        }
    }

    useEffect(()=>{
        fetchOrders();
    },[restaurantId]);

    useEffect(() => {
    if (!socket) return;

    socket.emit("room:join", { restaurantId });

    const onNewOrder = () => {
        console.log("New order received via socket");

        // Sound trigger block
        if (audioRef.current && audioUnlocked) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch((err) => {
                console.error("Error playing audio: ", err);
            });
        }

        fetchOrders();
    };

    socket.on("order:new", onNewOrder);

    return () => {
        socket.emit("room:leave", { restaurantId });
        socket.off("order:new", onNewOrder);
    };

}, [socket, restaurantId, audioUnlocked]); 

    if(loading){
        return <p>Loading Orders...</p>
    }

    const activeOrders = orders.filter((o)=>{
        return ACTIVE_STATUSES.includes(o.status)
    })

    const completedOrders = orders.filter((o)=>!ACTIVE_STATUSES.includes(o.status))
  return (
    <div className="space-y-6" >
        {!audioUnlocked && <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between" >
            <div className="flex items-center gap-3 " >
                <span className="text-2xl" >🔔</span>
                <div>
                    <p className="font-medium text-blue-900" >Enable Sound Notifications</p>
                    <p className="text-sm text-blue-600" >Allow sound notifications for new orders</p>
                </div>
            </div>
                <button onClick={unlockAudio} className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md" >
                    Enable Sound
                </button>
            </div>}

            {/* Active Orders */}
            <div className="space-y-3">
                <h3 className="font-semibold text-lg" >Active Orders</h3>
                {
                    activeOrders.length === 0 ? 
                    <p className="text-gray-500" >No active orders</p> : 
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" >
                        {activeOrders.map((order)=>{
                            return <OrderCard key={order._id} order={order} onStatusUpdate={fetchOrders} />;
                        })}

                    </div>
                }
            </div>

            {/* completed orders */}
            <div className="space-y-3">
                <h3 className="font-semibold text-lg" >Completed Orders</h3>
                {
                    completedOrders.length === 0 ? 
                    <p className="text-gray-500" >No completed orders</p> : 
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" >
                        {completedOrders.map((order)=>{
                            return <OrderCard key={order._id} order={order} onStatusUpdate={fetchOrders} />;
                        })}

                    </div>
                }
            </div>
    </div>
  )
}

export default RestaurantOrders