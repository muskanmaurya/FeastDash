import {Request, Response, NextFunction} from "express";
import jwt,{JwtPayload} from "jsonwebtoken";

export interface AuthenticatedRequest extends Request{
    user?: IUser | null;
}

export interface IUser {
    _id:string;
    name: String;
    email: String;
    image: String;
    role: String;
    restaurantId: string;
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

export const isSeller = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> =>{
    const user = req.user;

    if(user && user.role !== "seller"){
        res.status(403).json({
            message: "Forbidden: Access is denied. You must be a seller to perform this action.",
        });
        return;
    }
    
    next();
}