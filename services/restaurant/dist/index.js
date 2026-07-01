import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import connectDB from "../src/config/db.js";
import restaurantRoutes from "../src/routes/restaurant.js";
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/restaurant", restaurantRoutes);
app.use(morgan("dev"));
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Restaurant service is running on port ${PORT}`);
    connectDB();
});
