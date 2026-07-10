import axios from "axios";
import getBuffer from "../config/dataUri.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/tryCatch.js";
import Restaurant from "../models/Restaurant.js";
import MenuItems from "../models/MenuItems.js";


export const addMenuItem = TryCatch(async (req: AuthenticatedRequest, res) =>{

    if(!req.user){
        return res.status(401).json({
            message: "Unauthorized: Please login",
        })
    }

    const restaurant = await Restaurant.findOne({ownerId: req.user._id});

    if(!restaurant){
        return res.status(404).json({
            message: "Restaurant not found",
        })
    }

    const {name, description, price} = req.body;

    if(!name || !price){
        return res.status(400).json({
            message:"Name and price are required fields",
        })
    }

    const file = req.file;

    if (!file) {
        return res.status(400).json({
            message: "Missing required field: image",
        })
    }

    const fileBuffer = getBuffer(file);

    if (!fileBuffer?.content) {
        return res.status(500).json({
            message: "failed to create file buffer for image",
        })
    }

    const { data: uploadResult } = await axios.post(
        `${process.env.UTILS_SERVICE_URL}/api/upload`,
        {
            buffer: fileBuffer.content,
        }
    );

    const item = await MenuItems.create({
        name,
        description,
        price,
        restaurantId: restaurant._id,
        image: uploadResult.url
    });

    res.status(201).json({
        message: "Menu item added successfully",
        item
    })
})

export const getAllItems = TryCatch(async (req: AuthenticatedRequest, res) => {
    const{id} = req.params;

    if(!id){
        return res.status(400).json({
            message: "Restaurant id is required",
        })
    }

    const items = await MenuItems.find({restaurantId: id});

    res.status(200).json({
        message: "Menu items fetched successfully",
        items
    })
})

export const deleteMenuItem = TryCatch(async (req: AuthenticatedRequest, res) => {
    if(!req.user){
        return res.status(401).json({
            message: "Unauthorized: Please login",
        })
    }

    const{itemId} = req.params;

    if(!itemId){
        return res.status(400).json({
            message: "Menu item id is required",
        })
    }

    const item = await MenuItems.findById(itemId);

    if(!item){
        return res.status(404).json({
            message: "Menu item not found",
        })
    }

    const restaurant = await Restaurant.findOne(
        {
            _id: item.restaurantId,
            ownerId: req.user._id
        });

    if(!restaurant){
        return res.status(403).json({
            message: "You are not authorized to delete this menu item",
        })
    }

    await item.deleteOne();

    res.status(200).json({
        message: "Menu item deleted successfully",
    })

})


export const toggleMenuItemAvailability = TryCatch(async (req: AuthenticatedRequest, res) => {
    if(!req.user){
        return res.status(401).json({
            message: "Unauthorized: Please login",
        })
    }

    const{itemId} = req.params;

    if(!itemId){
        return res.status(400).json({
            message: "Menu item id is required",
        })
    }

    const item = await MenuItems.findById(itemId);

    if(!item){
        return res.status(404).json({
            message: "Menu item not found",
        })
    }

    const restaurant = await Restaurant.findOne(
        {
            _id: item.restaurantId,
            ownerId: req.user._id
        });

    if(!restaurant){
        return res.status(403).json({
            message: "You are not authorized to delete this menu item",
        })
    }

    item.isAvailable = !item.isAvailable;
    await item.save();

    res.status(200).json({
        message: `Item Marked as ${item.isAvailable ? "Available" : "Unavailable"} successfully`,
        item
    })

})