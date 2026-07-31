import { useEffect, useState } from "react";
import { useAppData } from "../context/AppContext";
import axios from "axios";
import { restaurantService, utilsService } from "../config";
import { useNavigate } from "react-router-dom";
import type { ICart, IMenuItem, IRestaurant } from "../types";
import { toast } from "react-hot-toast";
import { BiCreditCard, BiLoader, BiStoreAlt } from "react-icons/bi";
import {loadStripe} from '@stripe/stripe-js';

interface Address {
  _id: string;
  formattedAddress: string;
  mobile: number;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, subTotal, quantity } = useAppData();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [loadingRazorpay, setLoadingRazorpay] = useState(false);
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!cart || cart.length === 0) {
        setLoadingAddress(false);
        return;
      }

      try {
        const { data } = await axios.get(`${restaurantService}/api/address/all`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        
        if (data && Array.isArray(data.addresses)) {
          setAddresses(data.addresses);
        } else if (Array.isArray(data)) {
          setAddresses(data);
        } else if (data && Array.isArray(data.data)) {
          setAddresses(data.data);
        } else {
          setAddresses([]);
        }
      } catch (error) {
        console.error("Error fetching addresses:", error);
        setAddresses([]);
      } finally {
        setLoadingAddress(false);
      }
    };
    
    fetchAddresses();
  }, [cart]);

  if (!cart || cart.length === 0) {
    return (
      <div className="text-md text-gray-400 flex min-h-[60vh] flex-col items-center justify-center font-medium tracking-wide">
        <p>Your grocery basket is empty</p>
      </div>
    );
  }

  const restaurant = cart[0].restaurantId as IRestaurant;
  const deliveryFee = subTotal < 250 ? 49 : 0;
  const platformFee = Math.round(subTotal * 0.05) || 7; 
  const grandTotal = subTotal + deliveryFee + platformFee;

  const createOrder = async (paymentMethod: "razorpay" | "stripe") => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address.");
      return null;
    }

    setCreatingOrder(true);
    try {
      const { data } = await axios.post(`${restaurantService}/api/order/new`, {
        paymentMethod,
        addressId: selectedAddress,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        }
      });

      return data;
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Error creating order. Please try again.");
      return null;
    } finally {
      setCreatingOrder(false);
    }
  };

  const payWithRazorpay = async () => {
    try {
      setLoadingRazorpay(true);
      const order = await createOrder("razorpay");
      if (!order) return;

      const { orderId, amount } = order;
      const { data } = await axios.post(`${utilsService}/api/payment/create`, { orderId });
      const { razorpayOrderId, key } = data;

      const options = {
        key,
        amount: amount * 100,
        currency: "INR",
        name: "FeastDash",
        description: "Food Order Payment",
        order_id: razorpayOrderId,
        handler: async function (response: any) {
          try {
            await axios.post(`${utilsService}/api/payment/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderId,
            });
            toast.success("Payment successful! Your order has been placed 🎉");
            navigate("/paymentsuccess/" + response.razorpay_payment_id);
          } catch (error) {
            toast.error("Payment verification failed. Please contact support.");
            console.error("Payment verification error:", error);
          }
        },
        theme: {
          "color": "#E23744"
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error("Error initializing Razorpay. Please try again.");
      console.error("Error initializing Razorpay:", error);
    } finally {
      setLoadingRazorpay(false);
    }
  };

  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

  const payWithStripe = async () => {
    try {
      setLoadingStripe(true);
      const order = await createOrder("stripe");
      if (!order) return;

      const {orderId} = order;
      try{
        await stripePromise;

        const {data} = await axios.post(`${utilsService}/api/payment/stripe/create`,{
          orderId
        })

        if(data.url){
          window.location.href = data.url
        }else {
          toast.error("Failed to initiate Stripe payment. Please try again.");
        }

      }catch(error){
        console.error("Error initiating Stripe payment:", error);
        toast.error("Error initiating Stripe payment. Please try again.");
      }
    } catch (error) {
      toast.error("Error initializing Stripe. Please try again.");
      console.error("Error initializing Stripe:", error);
    } finally {
      setLoadingStripe(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 antialiased">
      
      {/* Upper Global Section Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Checkout</h1>
      </div>

      <div className="mb-8 rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Visual Brand Accent Circle Container */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#E23744]">
            <BiStoreAlt size={24} />
          </div>
          
          {/* Informational Text Stacks Hierarchy */}
          <div className="space-y-1">
            <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-xs font-semibold text-[#E23744]">
              Ordering From
            </span>
            <h2 className="text-xl font-extrabold tracking-tight text-gray-900">
              {restaurant?.name || "Loading Restaurant details..."}
            </h2>
            <p className="text-xs font-medium leading-relaxed text-gray-500">
              {restaurant?.autoLocation?.formattedAddress || "Store location address metadata loading..."}
            </p>
          </div>
        </div>
      </div>

      {/* Main Structural Balanced Component Grid Layout Wrapper */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        
        {/* Left Actions Workflow Group (8-Columns Responsive Width) */}
        <div className="space-y-6 lg:col-span-7">
          
          {/* Panel Component: Delivery Addresses Selector Wrapper */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
              Delivery Address
            </h3>
            
            {loadingAddress ? (
              <div className="flex items-center gap-2 py-4 text-sm text-gray-400">
                <BiLoader className="animate-spin" size={18} />
                <span>Locating saved user records...</span>
              </div>
            ) : addresses.length === 0 ? (
              <p className="py-4 text-sm text-gray-400 font-medium">
                No delivery addresses found. Please save an address to proceed.
              </p>
            ) : (
              <div className="space-y-3">
                {addresses.map((add) => {
                  const isSelected = selectedAddress === add._id;
                  return (
                    <label
                      key={add._id}
                      className={`group flex items-start gap-4 rounded-xl border p-4 transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "border-[#E23744] bg-red-50/40 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                      }`}
                    >
                      <div className="mt-0.5 flex h-5 items-center">
                        <input
                          type="radio"
                          name="address"
                          value={add._id}
                          checked={isSelected}
                          onChange={() => setSelectedAddress(add._id)}
                          className="h-4 w-4 border-gray-300 text-[#E23744] focus:ring-[#E23744] focus:ring-offset-0"
                        />
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <p className={`text-sm leading-relaxed font-semibold transition-colors ${
                          isSelected ? "text-gray-900" : "text-gray-700"
                        }`}>
                          {add.formattedAddress}
                        </p>
                        {add.mobile && (
                          <p className="text-xs font-mono tracking-wide text-gray-400 font-medium">
                            +91 {add.mobile}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panel Component: Cart Items Review Container Block */}
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
              Review Items
            </h3>
            <div className="divide-y divide-gray-100">
              {cart.map((cartItem: ICart) => {
                const item = cartItem.itemId as IMenuItem;
                return (
                  <div key={cartItem._id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-gray-800">{item?.name || "Menu Item"}</p>
                      <p className="text-xs text-gray-400 font-semibold">Quantity: {cartItem.quantity}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-700">
                      ₹{((item?.price || 0) * cartItem.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Dynamic Invoicing Panel Sidebar Block (5-Columns Width Sticky Shell) */}
        <div className="space-y-6 lg:col-span-5 lg:sticky lg:top-6">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
              Order Summary
            </h3>
            
            {/* Calculation Matrices Wrapper */}
            <div className="space-y-3.5 pb-4 border-b border-gray-100">
              <div className="flex justify-between text-sm text-gray-500 font-medium">
                <span>Items ({quantity})</span>
                <span className="text-gray-800 font-bold">₹{subTotal}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 font-medium">
                <span>Delivery Fee</span>
                <span className={deliveryFee === 0 ? "text-green-600 font-bold" : "text-gray-800 font-bold"}>
                  {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 font-medium">
                <span>Platform Fee</span>
                <span className="text-gray-800 font-bold">₹{platformFee}</span>
              </div>
              
              {subTotal < 250 && (
                <div className="rounded-xl bg-gray-50 p-3 text-center border border-dashed border-gray-200">
                  <p className="text-xs font-semibold text-gray-500">
                    Add items worth <span className="text-gray-800 font-bold">₹{250 - subTotal}</span> more to unlock <span className="text-green-600 font-extrabold">Free Delivery</span>
                  </p>
                </div>
              )}
            </div>

            {/* Invoiced Total Row Container */}
            <div className="flex items-center justify-between pt-4 pb-6">
              <span className="text-sm font-extrabold uppercase tracking-wide text-gray-800">Grand Total</span>
              <span className="text-xl font-black text-gray-900">₹{grandTotal}</span>
            </div>

            {/* Dynamic Triggers Architecture Wrapper */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                Select Payment Method
              </h4>
              
              {/* Razorpay Unified Call Implementation */}
              <button 
                onClick={payWithRazorpay}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#2D7ff9] py-3.5 px-4 text-sm font-bold text-white shadow-sm hover:bg-blue-600 active:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={!selectedAddress || loadingRazorpay || loadingStripe || creatingOrder}
              >
                {loadingRazorpay ? (
                  <BiLoader size={18} className="animate-spin" />
                ) : (
                  <BiCreditCard size={18} />
                )} 
                <span>Pay with Razorpay</span>
              </button>

              {/* Stripe Unified Call Implementation */}
              <button 
                onClick={payWithStripe}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-black py-3.5 px-4 text-sm font-bold text-white shadow-sm hover:bg-gray-900 active:bg-neutral-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={!selectedAddress || loadingRazorpay || loadingStripe || creatingOrder}
              >
                {loadingStripe ? (
                  <BiLoader size={18} className="animate-spin" />
                ) : (
                  <BiCreditCard size={18} />
                )} 
                <span>Pay with Stripe</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;