import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/tryCatch.js";
import Address from "../models/Address.js";
import Cart from "../models/Cart.js";
import { IMenuItem } from "../models/MenuItems.js";
import Restaurant, { IRestaurant } from "../models/Restaurant.js";
import Order from "../models/OrderModel.js";
import axios from "axios";
import { publishEvent } from "../config/order.publisher.js";


export const createOrder = TryCatch(async (req: AuthenticatedRequest, res: any) => {
    const user = req.user;

    if (!user) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    const { paymentMethod, addressId } = req.body;


    if (!addressId) {
        return res.status(400).json({
            message: "Address ID is required"
        })
    }

    const address = await Address.findOne({
        _id: addressId,
        userId: user._id,
    })

    if (!address) {
        return res.status(404).json({
            message: "Address not found",
        })
    }

    const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => { //here lat1 and lon1 are location of the user and lat2 and lon2 are location of the restaurant

        const R = 6371; // Radius of the earth in km
        const dLat = ((lat2 - lat1) * Math.PI) / 180; //dLat is the difference between the latitudes of the two points in radians divided by 180 and multiplied by pi which means that we are converting the difference in latitudes from degrees to radians
        const dLon = ((lon2 - lon1) * Math.PI) / 180; //dLon is the difference between the longitudes of the two points in radians divided by 180 and multiplied by pi which means that we are converting the difference in longitudes from degrees to radians

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2); //a is the square of half the chord length between the two points

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return +(R * c).toFixed(2);

    }


    const cartItems = await Cart.find({
        userId: user._id
    }).populate<{ itemId: IMenuItem }>("itemId")
        .populate<{ restaurantId: IRestaurant }>("restaurantId");

    if (cartItems.length === 0) {
        return res.status(400).json({
            message: "Cart is empty"
        })
    }

    const firstCartItem = cartItems[0];

    if (!firstCartItem || !firstCartItem.restaurantId) {
        return res.status(400).json({
            message: "Invalid cart item"
        })
    }

    const restaurantId = firstCartItem.restaurantId._id;

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
        return res.status(404).json({
            message: "Restaurant not found"
        })
    }

    if (!restaurant.isOpen) {
        return res.status(404).json({
            message: "Restaurant is not open"
        })
    }

    const distance = getDistanceKm(
        address.location.coordinates[1],
        address.location.coordinates[0],
        restaurant.autoLocation.coordinates[1],
        restaurant.autoLocation.coordinates[0]);

    let subTotal = 0;

    const orderItems = cartItems.map((cart) => {
        const item = cart.itemId;

        if (!item) {
            throw new Error("Item not found");
        }

        const itemTotal = item.price * cart.quantity;

        subTotal += itemTotal;

        return {
            itemId: item._id.toString(),
            name: item.name,
            price: item.price,
            quantity: cart.quantity,
        }
    })

    const deliveryFee = subTotal < 250 ? 49 : 0;

    const platformFee = subTotal * 0.05 || 7;

    const totalAmount = subTotal + deliveryFee + platformFee;

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const [longitude, latitude] = address.location.coordinates;

    const riderAmount = Math.ceil(distance) * 17;

    const order = await Order.create({
        userId: user._id,
        restaurantId: restaurant._id.toString(),
        restaurantName: restaurant.name,
        riderId: null,
        distance,
        riderAmount,
        items: orderItems,
        subTotal,
        deliveryFee,
        platformFee,
        totalAmount,
        addressId: address._id.toString(),
        deliveryAddress: {
            formattedAddress: address.formattedAddress,
            mobile: address.mobile,
            latitude,
            longitude
        },
        paymentMethod,
        paymentStatus: "pending",
        status: "placed",
        expiresAt,
    });

    await Cart.deleteMany({
        userId: user._id
    })

    res.status(201).json({
        message: "Order created successfully",
        orderId: order._id.toString(),
        amount: totalAmount,
    })

});

export const fetchOrderForPayment = TryCatch(async (req, res: any) => {
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
        return res.status(401).json({
            message: "Forbidden"
        })
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
        return res.status(404).json({
            message: "Order not found"
        })
    }

    if (order.paymentStatus !== "pending") {
        return res.status(400).json({
            message: "Order is not pending payment, order already paid"
        })
    }

    res.status(200).json({
        orderId: order._id.toString(),
        amount: order.totalAmount,
        currency: "INR",
    })

})

export const fetchRestaurantOrders = TryCatch(async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    const { restaurantId } = req.params;

    if (!user) {
        return res.status(401).json({
            message: "Unauthorized"
        })
    }

    if (!restaurantId) {
        return res.status(400).json({
            message: "Restaurant ID is required"
        })
    }

    const limit = req.query.limit ? Number(req.query.limit) : 0

    const orders = await Order.find({
        restaurantId,
        paymentStatus: "paid"
    })
        .sort({ createdAt: -1 })
        .limit(limit);

    return res.json({
        success: true,
        count: orders.length,
        orders,
    });
})

const ALLOWED_STATUSES = ["accepted", "preparing", "ready-for-rider"] as const;

export const updateOrderStatus = TryCatch(async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    const { orderId } = req.params;

    const { status } = req.body;

    if (!user) {
        return res.status(401).json({
            message: "Unauthorized"
        })
    }

    if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
            message: `Invalid status. Allowed statuses are: ${ALLOWED_STATUSES.join(", ")}`
        })
    }

    const order = await Order.findById(orderId);

    if (!order) {
        return res.status(404).json({
            message: "Order not found"
        })
    }

    if (order.paymentStatus !== "paid") {
        return res.status(400).json({
            message: "Cannot update order status. Order is not paid yet."
        })
    }

    const restaurant = await Restaurant.findById(order.restaurantId);

    if (!restaurant) {
        return res.status(404).json({
            message: "Restaurant not found"
        })
    }

    if (restaurant.ownerId !== user._id.toString()) {
        return res.status(403).json({
            message: "Forbidden. You are not the owner of this restaurant."
        })
    }

    order.status = status;

    await order.save();

    await axios.post(`${process.env.REALTIME_SERVICE}/api/v1/internal/emit`, {
        event: "order:update",
        room: `user:${order.userId}`,
        payload: {
            orderId: order._id,
            status: order.status,
        }
    },
        {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY
            }
        })

    //now assign riders
    if (status === "ready-for-rider") {
        console.log(
            "Publishing Order ready fr rider event for order",
            order._id
        );
        await publishEvent("ORDER_READY_FOR_RIDER", {
            orderId: order._id.toString(),
            restaurantId: restaurant._id.toString(),
            location: restaurant.autoLocation,
        });

        console.log("Event published successfully")
    }

    res.json({
        message: "Order status updated successfully",
        order,
    })

})

export const getMyOrders = TryCatch(async (req: AuthenticatedRequest, res) => {

    if (!req.user) {
        return res.status(401).json({
            message: "Unauthorized"
        })
    }

    const orders = await Order.find({
        userId: req.user._id.toString(),
        paymentStatus: "paid"
    }).sort({ createdAt: -1 })

    res.status(200).json({ orders });

})

export const fetchSingleOrder = TryCatch(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
        return res.status(401).json({
            message: "Unauthorized"
        })
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
        return res.status(404).json({
            message: "Order not found"
        })
    }

    if (order.userId !== req.user._id.toString()) {
        return res.status(403).json({
            message: "Forbidden. You are not the owner of this order."
        })
    }

    res.status(200).json({ order })
})

export const assignRiderToOrder = TryCatch(async (req, res) => {
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
        return res.status(401).json({
            message: "Forbidden"
        })
    }

    const { orderId, riderId, riderName, riderPhone } = req.body;

    const orderAvailable = await Order.findOne({
        riderId,
        status: {$ne: "delivered"}
    })

    if(orderAvailable) {
        return res.status(400).json({
            message: "You already have an active order. Please complete it before accepting a new one."
        })
    }   

    const order = await Order.findById(orderId);

    if (order?.riderId !== null) {
        return res.status(400).json({
            message: "Rider already assigned to this order"
        })
    }

    const orderUpdated = await Order.findByIdAndUpdate({
        _id: orderId, riderId: null
    }, {
        riderId,
        riderName,
        riderPhone,
        status: "rider-assigned",
    }, {
        new: true
    })

    await axios.post(`${process.env.REALTIME_SERVICE}/api/v1/internal/emit`, {
        event: "order:rider-assigned",
        room: `user:${order.userId}`,
        payload: order,
    },
        {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY
            }
        })


    await axios.post(`${process.env.REALTIME_SERVICE}/api/v1/internal/emit`, {
        event: "order:rider-assigned",
        room: `restaurant:${order.restaurantId}`,
        payload: order,
    },
        {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY
            }
        })

    res.json({
        message: "Rider assigned to order successfully",
        success: true,
        order: orderUpdated
    })
})


export const getCurrentOrderForRider = TryCatch(async(req, res)=>{

    if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
        return res.status(401).json({
            message: "Forbidden"
        })
    }

    const rawRiderId = req.query.riderId || req.params.riderId;

    if(!rawRiderId){
        return res.status(400).json({
            message: "Rider ID parameter is required"
        });
    }

    const riderIdString = rawRiderId.toString();

    const order = await Order.findOne({
        riderId: riderIdString,
        status: { $ne: "delivered" },
    });

    if(!order){
        return res.status(404).json({
            message: "No current order found for this rider"
        })
    }

    res.status(200).json({
        order
    })

})


export const updateOrderStatusByRider = TryCatch(async(req, res)=>{
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
        return res.status(401).json({
            message: "Forbidden"
        })
    }

    const { orderId } = req.body;

    if (!orderId) {
        return res.status(400).json({
            message: "Order ID parameter is missing in the payload"
        });
    }

    const order = await Order.findById(orderId);

    if(!order){
        return res.status(404).json({
            message: "Order not found"
        })
    }

    if(order.status === "rider-assigned"){
        order.status = "picked-up";

        await order.save();

        await axios.post(`${process.env.REALTIME_SERVICE}/api/v1/internal/emit`, {
        event: "order:rider-assigned",
        room: `restaurant:${order.userId}`,
        payload: order,
    },
        {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY
            }
        })

         await axios.post(`${process.env.REALTIME_SERVICE}/api/v1/internal/emit`, {
        event: "order:rider-assigned",
        room: `user:${order.userId}`,
        payload: order,
    },
        {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY
            }
        })


        return res.status(200).json({
            message: "Order status updated to picked-up",
            order
        })
    }

    if(order.status === "picked-up"){
        order.status = "delivered"

        await order.save();

        await axios.post(`${process.env.REALTIME_SERVICE}/api/v1/internal/emit`, {
        event: "order:rider-assigned",
        room: `restaurant:${order.userId}`,
        payload: order,
    },
        {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY
            }
        })

        
         await axios.post(`${process.env.REALTIME_SERVICE}/api/v1/internal/emit`, {
        event: "order:rider-assigned",
        room: `user:${order.userId}`,
        payload: order,
    },
        {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY
            }
        })

        return res.status(200).json({
            message: "Order status updated to picked-up",
            order
        })
    }
})