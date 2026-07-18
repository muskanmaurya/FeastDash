import {Request, Response, NextFunction} from "express";
import jwt,{JwtPayload} from "jsonwebtoken";

export interface IUser {
    _id:string;
    name: String;
    email: String;
    image: String;
    role: String;
    restaurantId: string;
}

export interface AuthenticatedRequest extends Request{
    user?: IUser | null;
}

export const isAuth = async(req:AuthenticatedRequest, res: Response, next:NextFunction):
Promise<void> => {
    try{
        const authHeader = req.headers.authorization;

        if(!authHeader || !authHeader.startsWith("Bearer ")){
            res.status(401).json({
                message:"Unauthorized: Please Login",
            })
            return;
        }

        const token = authHeader.split(" ")[1];

        if(!token){
            res.status(401).json({
                message:"Unauthorized: token missing",
            })
            return;        
        }

            const decodedValue = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as JwtPayload;

            if(!decodedValue || !decodedValue.user){
                res.status(401).json({
                    message:"Unauthorized: Invalid token",
                })
                return;
            }

            req.user = decodedValue.user;
            next();
        }catch(error: any){
            console.error("JWT verify error:", error);
            const message = error?.message || "Unauthorized: jwt error";
            res.status(401).json({
                message,
            })
        }
}

export const isAdmin = async(req:AuthenticatedRequest, res: Response, next:NextFunction)=>{
    try{
        if(!req.user){
            res.status(401).json({
                message:"Unauthorized: User not found",
            })
            return;
        }

        if(req.user.role !== "admin"){
            res.status(403).json({
                message:"Forbidden: access denied, admin only",
            })
            return;
        }

        next();
    }catch(error: any){
        console.error("isAdmin middleware error:", error);
        const message = error?.message || "Unauthorized: isAdmin error";
        res.status(401).json({
            message,
        })
    }
}