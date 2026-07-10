import express from "express";
import { createRazorpayOrder, verifyRazorpayPayment } from "../controllers/Payment.js";

const router = express.Router();

router.post("/create", createRazorpayOrder);

router.post("/verify", verifyRazorpayPayment);

export default router;