import express from "express";
import { fetchOrderForPayment, createOrder } from "../controllers/Order.js";
import { isAuth } from "../middlewares/isAuth.js";

const router = express.Router();

router.post("/new", isAuth, createOrder )

router.get("/payment/:id", fetchOrderForPayment )

export default router;