import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import adminRoutes from "./routes/admin.js"

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());
app.use(morgan("dev"));

app.use("/api/v1",adminRoutes);

const PORT = process.env.PORT || 5006;

app.listen(PORT,()=>{
    console.log(`Admin service is running on port ${PORT}`);
})