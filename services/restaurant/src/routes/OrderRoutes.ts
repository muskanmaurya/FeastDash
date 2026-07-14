import express from "express";
import { fetchOrderForPayment, createOrder, fetchRestaurantOrders, updateOrderStatus, getMyOrders, fetchSingleOrder } from "../controllers/Order.js";
import { isAuth, isSeller } from "../middlewares/isAuth.js";

const router = express.Router();

router.get("/myorders",isAuth, getMyOrders)

router.get("/:id",isAuth, fetchSingleOrder)

router.post("/new", isAuth, createOrder )

router.get("/payment/:id", fetchOrderForPayment )

router.get("/restaurant/:restaurantId",isAuth, isSeller, fetchRestaurantOrders)

router.put("/:orderId",isAuth, isSeller, updateOrderStatus)



export default router;