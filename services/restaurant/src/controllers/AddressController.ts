import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/tryCatch.js";
import Address from "../models/Address.js";
import mongoose from "mongoose";


export const addAddress = TryCatch(async (req:AuthenticatedRequest, res) => {
    const user = req.user;

    if(!user){
        return res.status(401).json({message:"Unauthorized"});
    }

    const {mobile, formattedAddress, latitude, longitude} = req.body;

    if(!mobile || !formattedAddress || !latitude || !longitude || latitude === undefined || longitude === undefined){
        return res.status(400).json({message:"Missing required fields"});
    }

    const newAddress = await Address.create({
        userId: user._id,
        mobile,
        formattedAddress,
        location:{
            type:"Point",
            coordinates:[Number(longitude), Number(latitude)]
        }
    })

    res.status(201).json({
        message:"Address added successfully",
        address:newAddress
    });   

})

export const deleteAddress = TryCatch(async (req:AuthenticatedRequest, res) => {
    const user = req.user;

    if(!user){
        return res.status(401).json({
            message:"Unauthorized"
        });
    }

    const {id} = req.params;

    if(!id){
        return res.status(400).json({
            message:"Address ID is required"
        })
    }

    const address = await Address.findOne({
        _id: id,
        userId: user._id.toString(),
    })

    if(!address){
        return res.status(404).json({
            message:"Address not found"
        })    
    }

    await address.deleteOne();

    res.status(200).json({
        message:"Address deleted successfully"
    })
})

export const getMyAddresses = TryCatch(async (req:AuthenticatedRequest, res) => {

    const user = req.user;

    if(!user){
        return res.status(401).json({
            message:"Unauthorized"
        });
    }

    const addresses = await Address.find({
        userId: user._id.toString()
    }).sort({createdAt:-1})

    res.status(200).json({
        message:"Addresses fetched successfully",
        addresses
    })
})