import express from "express";
import { fetchOrderForPayment, createOrder, fetchRestaurantOrders, updateOrderStatus, getMyOrders, fetchSingleOrder, assignRiderToOrder, getCurrentOrderForRider, updateOrderStatusByRider  } from "../controllers/Order.js";
import { isAuth, isSeller } from "../middlewares/isAuth.js";

const router = express.Router();

router.get("/myorders",isAuth, getMyOrders)

router.get("/:id",isAuth, fetchSingleOrder)

router.post("/new", isAuth, createOrder )

router.get("/payment/:id", fetchOrderForPayment )

router.get("/restaurant/:restaurantId",isAuth, isSeller, fetchRestaurantOrders)

router.put("/:orderId",isAuth, isSeller, updateOrderStatus)

router.put("/assign/rider", assignRiderToOrder)

// router.get("/current/order", getCurrentOrderForRider)

router.get("/rider/current", getCurrentOrderForRider);

router.put("/update/status/rider", updateOrderStatusByRider)

export default router;