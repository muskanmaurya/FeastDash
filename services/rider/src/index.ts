import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./config/db.js";
import riderRoutes from "./routes/riderRoutes.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { startOrderReadyConsumer } from "./config/orderReady.consumer.js";

dotenv.config();

await connectRabbitMQ();
startOrderReadyConsumer(); 

const app = express();


app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use("/api/rider", riderRoutes);

const PORT = process.env.PORT || 5005;

app.listen(PORT,()=>{
    console.log(`Rider service is running on port ${PORT}`);
    connectDB();
})