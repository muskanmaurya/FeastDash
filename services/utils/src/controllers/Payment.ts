import axios from 'axios';
import { Request, Response } from "express";
import { razorpay } from '../config/razorpay.js';
import { verifyRazorpaySignature } from '../config/verifyRazorpay.js';
import { publishPaymentSuccess } from '../config/payment.producer.js';
import dotenv from 'dotenv';
import { Stripe } from 'stripe';








dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export const createRazorpayOrder = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ message: "Order ID is missing in request body" });
        }

        const restaurantServiceUrl = process.env.RESTAURANT_SERVICE || "http://localhost:5001";
        
        // Fetch order details safely from the Restaurant Service
        const { data } = await axios.get(`${restaurantServiceUrl}/api/order/payment/${orderId}`, {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "",
            },
        });

        // Initialize order collection within Razorpay systems
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(data.amount * 100), // Enforce clean integers for subunits
            currency: "INR",
            receipt: orderId,
        });

        return res.status(200).json({
            razorpayOrderId: razorpayOrder.id,
            key: process.env.RAZORPAY_KEY_ID,
        });

    } catch (error: any) {
        console.error("❌ ERROR inside createRazorpayOrder:", error.message || error);
        return res.status(500).json({ 
            message: "Failed to initialize Razorpay transaction layer",
            error: error.response?.data || error.message 
        });
    }
};

export const verifyRazorpayPayment = async (req: Request, res: Response) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

        const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

        if (!isValid) {
            return res.status(400).json({ message: "Payment verification failed" });
        }

        await publishPaymentSuccess({
            orderId,
            paymentId: razorpay_payment_id,
            provider: "razorpay"
        });

        return res.status(200).json({ message: "Payment verified successfully" });

    } catch (error: any) {
        console.error("❌ ERROR inside verifyRazorpayPayment:", error.message || error);
        return res.status(500).json({ message: "Internal verification pipeline error" });
    }
};


export const payWithStripe = async (req: Request, res: Response) => {
    try{
         const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ message: "Order ID is missing in request body" });
        }

        const restaurantServiceUrl = process.env.RESTAURANT_SERVICE || "http://localhost:5001";
        
        // Fetch order details safely from the Restaurant Service
        const { data } = await axios.get(`${restaurantServiceUrl}/api/order/payment/${orderId}`, {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "",
            },
        });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",

            line_items:[
                {
                    price_data:{
                        currency:"inr",
                        product_data:{
                            name:"FeastDash food order",
                        },
                        unit_amount: data.amount * 100,
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                orderId,
            },

            success_url:`${process.env.FRONTEND_URL}/ordersuccess?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url:`${process.env.FRONTEND_URL}/checkout`,

        })

        res.status(200).json({
            url:session.url
        })
    }catch(error: any){
        res.send(500).json({
            message: "Internal Stripe payment error",
        })
    }
}

export const verifyStripe = async (req: Request, res: Response) => {
    const {sessionId} = req.body;

    try{
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if(!session){
            return res.status(400).json({
                message: "Payement verification failed: Invalid session ID",
            })
        }

        const orderId = session.metadata?.orderId;

        if(!orderId){
            return res.status(400).json({
                message: "Payement verification failed: Missing order ID in session metadata",
            })
        }

        await publishPaymentSuccess({
            orderId,
            paymentId: sessionId,
            provider: "stripe",
        })

        res.json({
            message: "Payment verified successfully",
        })
    }catch(error: any){
        res.status(500).json({
            message: "Internal Stripe verification error",
        })
    }
}


