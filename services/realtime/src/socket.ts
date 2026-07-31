import {Server} from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';

let io: Server;

export const initSocket = (server: http.Server)=>{
    io = new Server(server,{
        cors:{
            origin:"*",
        }
    })

    io.use((socket,next)=>{
        try{
            const token = socket.handshake.auth?.token;

            if(!token){
                return next(new Error("Authentication error: Token not provided"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as any;

            if(!decoded || !decoded.user){
                return next(new Error("Authentication error: Invalid token"));
            }

            socket.data.user = decoded.user;

            next();
        }catch(error){
            console.error("❌Socket authentication error:", error);
            next(new Error("Authentication error"));
        }
    })

    io.on("connection",(socket)=>{
        const user = socket.data.user;

        if(!user){
            socket.disconnect();
            return;
        }

        const userId = user._id;

        socket.join(`user:${userId}`);

        if(user.restaurantId){
            socket.join(`restaurant:${user.restaurantId}`); 
        }

        console.log(`User connected: ${userId}`);
        console.log("Socket room: ",[...socket.rooms]);

        socket.on("join", (room: string) => {
            if (room) {
                socket.join(room);
                console.log(`📌 Socket ${socket.id} joined room: ${room}`);
            }
        });

        socket.on("leave", (room: string) => {
            if (room) {
                socket.leave(room);
                console.log(`🚪 Socket ${socket.id} left room: ${room}`);
            }
        });

        socket.on("disconnect",()=>{
            console.log(`User disconnected: ${userId}`);
        })
    })

    return  io;
}

export const getIO = ()=>{
    if(!io){
        throw new Error("Socket.io not initialized. Please call initSocket first.");
    }

    return io;
}