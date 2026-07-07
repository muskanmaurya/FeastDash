import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import restaurantRoutes from "./routes/restaurant.js";
import itemRoutes from "./routes/menuItems.js"

dotenv.config();

const app = express();

app.use(cors({
    origin: "http://localhost:5173", // Exact matches with your frontend port
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(morgan("dev"));
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/item", itemRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT,()=>{
    console.log(`Restaurant service is running on port ${PORT}`);
    connectDB();
})