import express from "express";
import { fetchOrderForPayment, createOrder, fetchRestaurantOrders, updateOrderStatus, getMyOrders, fetchSingleOrder } from "../controllers/Order.js";
import { isAuth, isSeller } from "../middlewares/isAuth.js";

const router = express.Router();

router.post("/new", isAuth, createOrder )

router.get("/payment/:id", fetchOrderForPayment )

router.get("/:restaurantId",isAuth, isSeller, fetchRestaurantOrders)

router.put("/:orderId",isAuth, isSeller, updateOrderStatus)

router.get("/my",isAuth, getMyOrders)

router.get("/:id",isAuth, fetchSingleOrder)

export default router;