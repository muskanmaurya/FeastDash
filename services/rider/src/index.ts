import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./config/db.js";
import riderRoutes from "./routes/riderRoutes.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";

dotenv.config();

await connectRabbitMQ();

const app = express();

// app.use(cors({
//     origin: "http://localhost:5173", // Exact matches with your frontend port
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"]
// }));


app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use("/api/rider", riderRoutes);

const PORT = process.env.PORT || 5005;

app.listen(PORT,()=>{
    console.log(`Rider service is running on port ${PORT}`);
    connectDB();
})