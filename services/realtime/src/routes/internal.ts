import express from "express";
import { getIO } from "../socket.js";

const router = express.Router();

router.post("/emit", (req, res) => {
    if(req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY){
        return res.status(401).json({
            message: "Forbidden"
        })
    }

    const {event, room, payload} = req.body;

    if(!event || !room || !payload){
        return res.status(400).json({
            message: "Missing required fields: event, room, payload"
        })
    }

    const io = getIO()

    console.log(`📶 Emitting event: ${event} to room: ${room}`)

    io.to(room).emit(event, payload ?? {});

    return res.json({success: true, message: `Event ${event} emitted to room ${room}`})
})

export default router;