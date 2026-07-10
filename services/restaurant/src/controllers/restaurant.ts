import axios from "axios";
import getBuffer from "../config/dataUri.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/tryCatch.js";
import Restaurant from "../models/Restaurant.js";
import jwt from "jsonwebtoken";

export const addRestaurant = TryCatch(async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    //as we know it's a restaur.. servicee where we need a seller so we need to check if thsi api is called that person is a seller or not? so we will creaet a middlewware checkpoint for isseeller


    if (!user || user.role !== "seller") {  
        return res.status(403).json({
            message: "Unauthorized/Forbidden: Only sellers can add a restaurant",
        })
    }


    const existingRestaurant = await Restaurant.findOne({ ownerId: user._id });

    if (existingRestaurant) {
        return res.status(400).json({
            message: "You already have a restaurant.",
        })
    }

    const { name, description, latitude, longitude, formattedAddress, phone } = req.body;

    if (!name || !latitude || !longitude) {
        return res.status(400).json({
            message: "Missing required fields: name, latitude, longitude",
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

    const restaurant = await Restaurant.create({
        name,
        description,
        phone,
        image: uploadResult.url,
        ownerId: user._id,
        autoLocation: {
            type: "Point",
            coordinates: [Number(longitude), Number(latitude)],
            formattedAddress: formattedAddress || "", 
        },
        isVerified: false,
    })

    return res.status(201).json({
        message: "Restaurant created successfully",
        restaurant,
    })
})

export const fetchMyRestaurant = TryCatch(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
        return res.status(401).json({
            message: "Unauthorized: Please login",
        })
    }

    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });

    if (!restaurant) {
        return res.status(200).json({
            success: false,
            message: "No restaurant found for this user yet.",
            restaurant: null // Explicitly send null with a successful request status
        });
    }

    if (!req.user.restaurantId) {
        const token = jwt.sign(
            {
                user: {
                    ...req.user,
                    restaurantId: restaurant._id,
                },
            },
            process.env.JWT_SECRET_KEY as string, {
            expiresIn: "15d",
        }
        );

        return res.status(200).json({
            restaurant,
            token,
        })
    }

    res.status(200).json({ restaurant });

})


export const updateStatusRestaurant = TryCatch(async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
        return res.status(403).json({
            message: "Unauthorized: Please login",
        })
    }

    const { status } = req.body;
    if (typeof status !== "boolean") {
        return res.status(400).json({
            message: "Invalid status value. It should be a boolean.",
        })
    }

    const restaurant = await Restaurant.findOneAndUpdate(
        {
            ownerId: req.user._id,
        }, {
        isOpen: status
        }, {
        returnDocument: 'after'
    });

    if (!restaurant) {
        return res.status(404).json({
            message: "Restaurant not found",
        });
    }

    return res.status(200).json({
        message: "Restaurant status updated successfully",
        restaurant,
    });
});

export const updateRestaurant = TryCatch(async (req: AuthenticatedRequest, res) => {
    if(!req.user) {
        return res.status(403).json({
            message: "Unauthorized: Please login",
        })
    }

    const {name, description} = req.body;

    const restaurant = await Restaurant.findOneAndUpdate(
        {ownerId: req.user._id},
        { name: name, description: description },
        { returnDocument: 'after' }
    );

    if (!restaurant) {
        return res.status(404).json({
            message: "Restaurant not found",
        });
    }

    return res.status(200).json({
        message: "Restaurant updated successfully",
        restaurant,
    });
});

export const getNearbyRestaurant = TryCatch(async(req, res)=>{
    const {latitude, longitude, radius = 5000, search = ""} = req.query;
    if(!latitude || !longitude){
        return res.status(400).json({
            message: "Missing required query parameters: latitude and longitude",
        })
    }

    const query: any = {
        // isVerified : true
    }

    if(search && typeof search === "string"){
        query.name = {$regex: search, $options: "i"};
    }

    const restaurants = await Restaurant.aggregate([
        {
            $geoNear: {
                near:{
                    type: "Point",
                    coordinates:[Number(longitude), Number(latitude)]
                },
                distanceField: "distance",
                maxDistance: Number(radius),
                spherical: true,
                query: query,
            }
        },
        {
            $sort:{
                isOpen: -1,
                distance: 1,
            }
        },
        {
            $addFields:{
                distanceKm:{
                    $round:[{$divide:["$distance", 1000]}, 2]
                }
            }
        }
    ])

    res.status(200).json({
        success: true,
        count: restaurants.length,
        restaurants,
        message: "Nearby restaurants fetched successfully",
    })
})

export const fetchSingleRestaurant = TryCatch(async(req, res)=>{
    const restaurant = await Restaurant.findById(req.params.id);
    res.status(200).json({
        message: "Restaurant fetched successfully",
        restaurant,
    })
})

