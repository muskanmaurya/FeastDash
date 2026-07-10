import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/tryCatch.js";
import Address from "../models/Address.js";
import Cart from "../models/Cart.js";
import { IMenuItem } from "../models/MenuItems.js";
import Restaurant, { IRestaurant } from "../models/Restaurant.js";
import Order from "../models/OrderModel.js";


export const createOrder = TryCatch(async (req: AuthenticatedRequest, res: any) => {
    const user = req.user;

    if(!user){
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    const { paymentMethod, addressId } = req.body;


    if(!addressId){
        return res.status(400).json({
            message: "Address ID is required"
        })
    }

    const address = await Address.findOne({
        _id: addressId,
        userId: user._id,
    })

    if(!address){
        return res.status(404).json({
            message: "Address not found",
        })
    }

    const getDistanceKm = (lat1:number, lon1:number, lat2:number, lon2: number):number =>{ //here lat1 and lon1 are location of the user and lat2 and lon2 are location of the restaurant
    
    const R = 6371; // Radius of the earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180; //dLat is the difference between the latitudes of the two points in radians divided by 180 and multiplied by pi which means that we are converting the difference in latitudes from degrees to radians
    const dLon = ((lon2 - lon1) * Math.PI) / 180; //dLon is the difference between the longitudes of the two points in radians divided by 180 and multiplied by pi which means that we are converting the difference in longitudes from degrees to radians

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2); //a is the square of half the chord length between the two points

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return +(R * c).toFixed(2);

  }


    const cartItems = await Cart.find({
        userId: user._id
    }).populate<{itemId: IMenuItem}>("itemId")
    .populate<{restaurantId: IRestaurant}>("restaurantId");

    if(cartItems.length === 0){
        return res.status(400).json({
            message: "Cart is empty"
        })
    }

    const firstCartItem = cartItems[0];

    if(!firstCartItem || !firstCartItem.restaurantId){
        return res.status(400).json({
            message: "Invalid cart item"
        })
    }

    const restaurantId = firstCartItem.restaurantId._id;

    const restaurant = await Restaurant.findById(restaurantId);

    if(!restaurant){
        return res.status(404).json({
            message: "Restaurant not found"
        })
    }

    if(!restaurant.isOpen){
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

    const orderItems = cartItems.map((cart) =>{
        const item = cart.itemId;

        if(!item){
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
        deliveryAddress:{
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
    if(req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY){
        return res.status(401).json({
            message: "Forbidden"
        })
    }

    const order = await Order.findById(req.params.id);

    if(!order){
        return res.status(404).json({
            message: "Order not found"
        })
    }

    if(order.paymentStatus !== "pending"){
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