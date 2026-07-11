import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { initSocket } from "./socket.js";
import internalRoutes from "./routes/internal.js";


dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({limit: "50mb", extended: true}));
app.use(morgan("dev"));

app.use("/api/v1/internal", internalRoutes);

const PORT = process.env.PORT || 5004;

const server = http.createServer(app);

initSocket(server);

server.listen(PORT,()=>{
    console.log(`Realtime service is running on port ${PORT}`);
})