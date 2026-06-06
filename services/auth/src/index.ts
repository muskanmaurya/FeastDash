import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import morgan from "morgan";
import cors from "cors";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use(morgan("dev"));

const PORT = process.env.PORT || 5000;

app.listen(PORT,()=>{
    console.log(`Auth service is running on port ${PORT}`);
    connectDB();
})