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

// export const addRiderProfile = TryCatch(async (req: AuthenticatedRequest, res) => {
//     const user = req.user;

//     if (!user) {
//         return res.status(401).json({ message: "Unauthorized: Active session context missing" });
//     }

//     if (user.role !== "rider") {
//         return res.status(403).json({ message: "Forbidden: Only users with the rider role can initialize profiles" });
//     }

//     const file = req.file;
//     if (!file) {
//         return res.status(400).json({ message: "No file uploaded, Rider profile picture is required" });
//     }

//     const fileBuffer = getBuffer(file);
//     if (!fileBuffer?.content) {
//         return res.status(500).json({ message: "Failed to process the uploaded file format" });
//     }

//     // 🟢 Dynamic remote upload via the Utils service configuration
//     const uploadResponse = await axios.post(`${process.env.UTILS_SERVICE}/api/upload`, {
//         buffer: fileBuffer.content,
//     });

//     // 🟢 Safeguard fallback to fetch the picture URL path string correctly
//     const secureUrl = uploadResponse.data?.uploadResult?.url || uploadResponse.data?.url;

//     if (!secureUrl) {
//         console.error("❌ CLOUDINARY UPLOAD ERROR: Response structure mismatch:", uploadResponse.data);
//         return res.status(500).json({ message: "Failed to retrieve secure URL layout from storage layers" });
//     }

//     const { name, phoneNumber, aadharNumber, drivingLicenseNumber, latitude, longitude } = req.body;

//     if (!name || !phoneNumber || !aadharNumber || !drivingLicenseNumber || latitude === undefined || longitude === undefined) {
//         return res.status(400).json({ message: "Missing required fields, All fields are required" });
//     }

//     const existingProfile = await Rider.findOne({ userId: user._id });
//     if (existingProfile) {
//         return res.status(400).json({ message: "Rider profile already exists for this account record" });
//     }

//     // 🟢 Parse incoming string entries explicitly to floats to pass 2dsphere indexing requirements
//     const parsedLat = parseFloat(latitude);
//     const parsedLng = parseFloat(longitude);

//     if (isNaN(parsedLat) || isNaN(parsedLng)) {
//         return res.status(400).json({ message: "Invalid coordinate structure values provided" });
//     }

//     // 🟢 Execute data storage transaction model mapping
//     const riderProfile = await Rider.create({
//         userId: user._id,
//         name,
//         picture: secureUrl,
//         aadharNumber,
//         drivingLicenseNumber,
//         phoneNumber,
//         location: {
//             type: "Point",
//             coordinates: [parsedLng, parsedLat] // Enforce clean decimal tracking parameters
//         },
//         isAvailable: false,
//         isVerified: false,
//     });

//     return res.status(201).json({
//         message: "Rider profile created successfully",
//         riderProfile
//     });
// });

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

    // return res.status(200).json({
    //     message:"Rider profile fetched successfully",
    //     account
    // })

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

