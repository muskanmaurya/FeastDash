import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import restaurantRoutes from "./routes/restaurant.js";
import itemRoutes from "./routes/menuItems.js"
import cartRoutes from "./routes/cart.js"
import addressRoutes from "./routes/addressRoutes.js"   
import orderRoutes from "./routes/OrderRoutes.js"
import { connectRabbitMQ } from "./config/rabbitMQ.js";
import { startPaymentConsumer } from "./config/payment.consumer.js";

dotenv.config();

await connectRabbitMQ();
startPaymentConsumer();

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
app.use("/api/cart", cartRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/order", orderRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT,()=>{
    console.log(`Restaurant service is running on port ${PORT}`);
    connectDB();
})