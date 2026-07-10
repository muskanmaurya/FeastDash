import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/tryCatch.js";
import Cart from "../models/Cart.js";

export const addToCart = TryCatch(async(req: AuthenticatedRequest, res) => {
    if(!req.user){
        return res.status(401).json({
            message: "Unauthorized: please login",
        })
    }

    const userId = req.user._id;

    const {restaurantId, itemId} = req.body;

    if(!mongoose.Types.ObjectId.isValid(restaurantId) || !mongoose.Types.ObjectId.isValid(itemId)){
        return res.status(400).json({
            message: "Invalid restaurantId or itemId",
        })
    }

    const cartFromDifferentRestaurant = await Cart.findOne({
        userId,
        restaurantId:{
            $ne: restaurantId,
        }
    })

    if(cartFromDifferentRestaurant){
        return res.status(400).json({
            message: "You have items from a different restaurant in your cart. Please clear your cart before adding items from a new restaurant.",
        })
    }

    const cartItem = await Cart.findOneAndUpdate(
        { userId, restaurantId, itemId },
        { $inc: { quantity: 1 },
          $setOnInsert:{userId, restaurantId, itemId}       
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    return res.status(200).json({
        message: "Item added to cart successfully",
        cart: cartItem,
    })
})

export const fetchMyCart = TryCatch(async(req: AuthenticatedRequest, res) => {
    if(!req.user){
        return res.status(401).json({
            message: "Unauthorized: please login",
        })
    }

    const userId = req.user._id;

    const cartItems = await Cart.find({userId})
    .populate("itemId")
    .populate("restaurantId");  //we are doing this so that we can get the restaurant details along with the cart items

    let subTotal = 0;
    let cartLength = 0;

    for(const cartItem of cartItems){
        const item:any = cartItem.itemId;

        subTotal += item.price * cartItem.quantity;
        cartLength += cartItem.quantity;
    }

    return res.status(200).json({
        success: true,
        message: "Cart fetched successfully",
        cart: cartItems,
        subTotal,
        cartLength,
    })
})

export const incrementCartItem = TryCatch(async(req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;

    const {itemId} = req.body;

    if(!userId || !itemId){
        return res.status(400).json({
            message: "Missing userId or itemId",
        })
    }

    const cartItem = await Cart.findOneAndUpdate(
        {userId, itemId},
        {$inc:{quantity : 1}},
        { new: true }
    )

    if(!cartItem){
        return res.status(404).json({
            message: "Cart item not found",
        })
    }

    res.json({
        message: "Cart item quantity increased",
        cartItem,
    })
})

export const decrementCartItem = TryCatch(async(req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;

    const {itemId} = req.body;

    if(!userId || !itemId){
        return res.status(400).json({
            message: "Missing userId or itemId",
        })
    }

    const cartItem = await Cart.findOne({userId, itemId})

    if(!cartItem){
        return res.status(404).json({
            message: "Cart item not found",
        })
    }

    if(cartItem.quantity === 1){
        await Cart.deleteOne({userId, itemId});

        return res.status(200).json({
            message: "Cart item removed from cart",
        })
    }

    cartItem.quantity -= 1;
    await cartItem.save();

    res.json({
        message: "Cart item quantity decreased",
        cartItem,
    })
})

export const clearCart = TryCatch(async(req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    if(!userId){
        return res.status(400).json({
            message: "Unauthorized: please login",
        })
    }

    await Cart.deleteMany({userId});

    res.status(200).json({
        message: "Cart cleared successfully",
    })

})