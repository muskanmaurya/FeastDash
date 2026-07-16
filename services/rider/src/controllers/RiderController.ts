import TryCatch from "../middlewares/tryCatch.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import getBuffer from "../config/dataUri.js";
import axios from "axios";
import {Rider} from "../models/riderModel.js";

export const addRiderProfile = TryCatch(async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if(!user){
        return res.status(401).json({
            message:"Unauthorized"
        });
    }

    if(user.role !== "rider"){
        return res.status(403).json({
            message:"Forbidden: only riders can add rider profile"
        });
    }

    const file = req.file;

    if(!file){
        return res.status(400).json({
            message:"No file uploaded, Rider profile picture is required"
        });
    }

    const fileBuffer = getBuffer(file);

    if(!fileBuffer?.content){
        return res.status(500).json({
            message:"Failed to process the uploaded file"
        });
    }

    const {data: uploadResult} = await axios.post(`${process.env.UTILS_SERVICE_URL}/api/upload`,
        {
            buffer:fileBuffer.content,
        }
    )

    const {phoneNumber,aadharNumber,drivingLicenseNumber,latitude,longitude,} = req.body;

    if(!phoneNumber || !aadharNumber || !drivingLicenseNumber || latitude === undefined || longitude === undefined){
        return res.status(400).json({
            message:"Missing required fields, All fields are required"
        });
    }

    const existingProfile = await Rider.findOne({
        userId: user._id,
    })

    if(existingProfile){
        return res.status(400).json({
            message:"Rider profile already exists"
        });
    }

    const riderProfile = await Rider.create({
        userId: user._id,
        picture: uploadResult.url,
        phoneNumber,
        aadharNumber,
        drivingLicenseNumber,
        location:{
            type:"Point",
            coordinates:[longitude,latitude]
        },
        isAvailable:false,
        isVerified:false,
    })

    return res.status(201).json({
        message:"Rider profile created successfully",
        riderProfile
    })
})

export const fetchMyProfile = TryCatch(async (req: AuthenticatedRequest, res) => {
    const user = req.user;


    if(!user){
        return res.status(401).json({
            message:"Unauthorized"
        });
    }

    const account = await Rider.findOne({
        userId: user._id
    })


    res.json(account);
})

export const toggleRiderAvailability = TryCatch(async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if(!user){
        return res.status(401).json({
            message:"Unauthorized"
        });
    }

    if(user.role !== "rider"){
        return res.status(403).json({
            message:"Forbidden: only riders can add rider profile"
        });
    }

    const {isAvailable, latitude, longitude} = req.body;

    if(typeof isAvailable !== "boolean"){
        return res.status(400).json({
            message:"isAvailable must be a boolean"
        });
    }

    if(latitude === undefined || longitude === undefined){
        return res.status(400).json({
            message:"Missing required fields, location is required"
        });
    }

    const rider = await Rider.findOne({
        userId: user._id
    });

    if(!rider){
        return res.status(404).json({
            message:"Rider profile not found"
        });
    }

    if(isAvailable && !rider.isVerified){
        return res.status(403).json({
            message:"Cannot set availability until profile is verified"
        });
    }

    rider.isAvailable = isAvailable;

    rider.location = {
        type:"Point",
        coordinates:[longitude,latitude]
    }

    rider.lastActiveAt = new Date();

    await rider.save();

    res.json({
        message:isAvailable ? "Rider is now available" : "Rider is now unavailable",
        rider,
    })
})


export const acceptOrder = TryCatch(async (req: AuthenticatedRequest, res) => {
     const riderUserId = req.user?._id;
     const {orderId} = req.params;

     if(!riderUserId){
        return res.status(401).json({
            message:"Unauthorized"
        });
     }

     const rider = await Rider.findOne({userId: riderUserId, isAvailable: true});

     if(!rider){
        return res.status(404).json({
            message:"Rider is not available to accept orders"
        });
     }

     try{
        const {data} = await axios.put(`${process.env.RESTAURANT_SERVICE}/api/order/assign/rider`,{
            orderId,
            riderId: rider._id.toString(),
            riderUserId: rider.userId,
            riderName: rider.picture,
            riderPhone: rider.phoneNumber,

        },
    {
        headers:{
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY
        }
    })

    if(data.success){
        const riderDetails = await Rider.findOneAndUpdate({
            userId: riderUserId,
            isAvailable: true,
        },{
            isAvailable: false,
        },{
            new:true
        })

        res.status(200).json({
            message:"Order accepted successfully",
            order:data.order,
        })
    }
        }catch(Error){
        console.error("Order Already taken: ", Error);
        res.status(500).json({
            message:"Order Already taken by another rider or an error occurred",
        })
     }
})

export const fetchMyCurrentOrder = TryCatch(async (req: AuthenticatedRequest, res) => {
    const riderUserId = req.user?._id;
     const {orderId} = req.params;

     if(!riderUserId){
        return res.status(401).json({
            message:"Unauthorized"
        });
     }

     const rider = await Rider.findOne({
        userId: riderUserId, 
        isVerified: true
    });

     if(!rider){
        return res.status(404).json({
            message:"Rider is not available to accept orders"
        });
     }

     try{
        
        const { data } = await axios.get(`${process.env.RESTAURANT_SERVICE}/api/order/rider/current?riderId=${rider._id.toString()}`, {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY
            },
        });


        res.status(200).json({
            message:"Current order fetched successfully",
            // order: data,
            order: data.order || data,
        })
     }
     catch(error: any){
        console.error("Error fetching current order: ", error);
        res.status(500).json({
            message:error.response.data.message||"Error fetching current order"
        })
     }

})

export const updateOrderStatus = TryCatch(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;

    if(!userId){
        return res.status(401).json({
            message:"Unauthorized"
        });
    }

    const rider = await Rider.findOne({userId: userId});

    if(!rider){
        return res.status(404).json({
            message:"Rider profile not found"
        });
    }

    const { orderId } = req.params;

    try{
        const {data} = await axios.put(`${process.env.RESTAURANT_SERVICE}/api/order/update/status/rider`,{
            orderId,
        },{
            headers:{
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY
            },
        })

        res.status(200).json({
            message: data.message||"Order status updated successfully",
            // order:data,
        })

    }catch(error){
        console.error("Error updating order status: ", error);
        res.status(500).json({
            message:"Error updating order status"
        })
    }

})

