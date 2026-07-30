import { useParams } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { restaurantService } from "../config";
import axios from "axios";
import { useEffect, useState } from "react";
import type { IOrder } from "../types";
import { BiCheckCircle, BiMap, BiReceipt, BiTimeFive } from "react-icons/bi";
import UserOrderMap from "../components/UserOrderMap";

const statusConfig = (status: string) => {
    switch (status) {
        case "delivered":
            return "bg-green-50 border border-green-100 text-green-700";
        case "placed":
        case "accepted":
            return "bg-yellow-50 border border-yellow-100 text-yellow-700";
        default:
            return "bg-blue-50 border border-blue-100 text-blue-700";
    }
};

const OrderPage = () => {
    const { id } = useParams<{ id: string }>();
    const { socket } = useSocket();
    const [order, setOrder] = useState<IOrder | null>(null);
    const [loading, setLoading] = useState(true);


    const fetchOrder = async () => {
        try {
            const { data } = await axios.get(`${restaurantService}/api/order/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
            setOrder(data.order || data || null);
        } catch (error) {
            console.error("Error fetching order: ", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();
    }, [id]);

    useEffect(() => {
        if (!socket) return;

        const onOrderUpdate = () => {
            fetchOrder();
        };

        socket.on("order:update", onOrderUpdate);
        socket.on("order:rider-assigned", onOrderUpdate);


        return () => {
            socket.off("order:update", onOrderUpdate);
            socket.off("order:rider-assigned", onOrderUpdate);
        };
    }, [socket]);


    useEffect(() => {
        if (!socket || !id) return;

        socket.emit("join", `user:${id}`);
        socket.emit("join", `order:${id}`);

        return () => {
            socket.emit("leave", `user:${id}`)
            socket.emit("leave", `order:${id}`)
        }
    }, [socket, id])



    const [riderLocation, setRiderLocation] = useState<[number, number] | null>(null);

    useEffect(() => {
        if (!socket) return;

        const onRiderLocation = (data: any) => {
            // Handle payload whether sent directly or nested inside a payload wrapper
            const lat = data?.latitude ?? data?.payload?.latitude;
            const lng = data?.longitude ?? data?.payload?.longitude;

            if (lat && lng) {
                console.log("📍 Rider Location Received on User Map:", lat, lng);
                setRiderLocation([lat, lng]);
            }
        };

        socket.on("rider:location", onRiderLocation);

        return () => {
            socket.off("rider:location", onRiderLocation);
        };
    }, [socket]);

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <p className="animate-pulse text-sm font-semibold text-gray-400">Loading your order details...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-2">
                <p className="text-base font-semibold text-gray-500">No order found</p>
                <p className="text-xs text-gray-400">Please verify your order link or tracking identifier.</p>
            </div>
        );
    }

    // Invoice breakdown mathematics layer
    const subTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = order.deliveryFee ?? (subTotal < 250 ? 49 : 0);
    const platformFee = order.platformFee ?? 7;
    const grandTotal = order.totalAmount ?? (subTotal + deliveryFee + platformFee);

    // console.log("Rider Location State:", riderLocation);
    // console.log("Delivery Location:", order.deliveryAddress.latitude, order.deliveryAddress.longitude);

    return (
        <div className="mx-auto max-w-2xl px-4 py-8 antialiased space-y-6">

            {/* Upper Global Invoice Header Row */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                    <h1 className="text-xl font-black text-gray-900 tracking-tight">
                        Order #{order._id.slice(-6)}
                    </h1>
                    <p className="text-xs font-medium text-gray-400 mt-0.5 flex items-center gap-1">
                        <BiTimeFive /> Live tracker context pipeline active
                    </p>
                </div>
            </div>

            {/* 1. Dynamic Alert Status Banner */}
            <div className={`rounded-xl p-4 flex items-center gap-3 shadow-sm font-bold text-sm tracking-wide capitalize ${statusConfig(order.status)}`}>
                {order.status === "delivered" ? <BiCheckCircle size={18} /> : <div className="h-2 w-2 rounded-full bg-current animate-ping" />}
                <span>Status: {order.status.replaceAll("_", " ")}</span>
            </div>

            {/* 2. Structured Card Component: Items Review List */}
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    <BiReceipt size={16} /> Items
                </h2>
                <div className="divide-y divide-gray-50">
                    {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between items-center py-3 first:pt-0 last:pb-0 text-sm">
                            <span className="font-semibold text-gray-700">{item.name} <span className="text-gray-400 font-normal font-mono text-xs ml-1">x{item.quantity}</span></span>
                            <span className="font-bold text-gray-800">₹{item.price * item.quantity}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Structured Card Component: User Delivery Address Metadata */}
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    <BiMap size={16} /> Delivery Address
                </h2>
                <div className="text-sm space-y-1 text-gray-600 leading-relaxed font-semibold">
                    <p className="text-gray-800">{order.deliveryAddress?.formattedAddress || "No physical address coordinate strings supplied."}</p>
                    {order.deliveryAddress?.mobile && (
                        <p className="text-xs font-medium font-mono text-gray-400 pt-0.5">Mobile: +91 {order.deliveryAddress.mobile}</p>
                    )}
                </div>
            </div>

            {/* 4. Pricing Matrices Breakdown Ledger Layout */}
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
                <div className="space-y-2.5 pb-3.5 border-b border-gray-100 text-sm text-gray-500 font-medium">
                    <div className="flex justify-between">
                        <span>SubTotal</span>
                        <span className="text-gray-800 font-bold">₹{subTotal}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span className={deliveryFee === 0 ? "text-green-600 font-bold" : "text-gray-800 font-bold"}>
                            {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Platform Fee</span>
                        <span className="text-gray-800 font-bold">₹{platformFee}</span>
                    </div>
                </div>

                {/* Invoiced Grand Total Section */}
                <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-extrabold uppercase tracking-wide text-gray-800">Total</span>
                    <span className="text-xl font-black text-gray-900">₹{grandTotal}</span>
                </div>

                {/* Secondary Transaction Identifiers Metadata Group */}
                <div className="pt-2 text-[11px] font-medium text-gray-400 space-y-1 border-t border-dashed border-gray-100">
                    <p className="capitalize">Payment Method: <span className="font-semibold text-gray-600 font-mono">{order.paymentMethod || "N/A"}</span></p>
                    <p className="capitalize">Payment Status: <span className={`font-bold font-mono ${order.paymentStatus === "paid" ? "text-green-600" : "text-amber-600"}`}>{order.paymentStatus || "pending"}</span></p>
                </div>
            </div>
            {
                (order.status === "rider-assigned" ||
                    order.status === "picked-up") &&
                (riderLocation ?
                    <UserOrderMap riderLocation={riderLocation} deliveryLocation={[order.deliveryAddress.latitude!, order.deliveryAddress.longitude!]} /> :
                    <p>Waiting for rider location...</p>)
            }

        </div>
    );
};

export default OrderPage;