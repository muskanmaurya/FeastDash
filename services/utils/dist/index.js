import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import cloudinary from "cloudinary";
import cors from "cors";
import uploadRoutes from "./routes/cloudinary.js";
dotenv.config();
const app = express();
app.use(cors());
app.use("/api", uploadRoutes); // Mount the upload routes at /api/upload
app.use(express.json({ "limit": "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(morgan("dev"));
const { CLOUDINARY_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
if (!CLOUDINARY_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary configuration variables are missing in the environment.");
}
cloudinary.v2.config({
    cloud_name: CLOUDINARY_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
    console.log(`Utils service is running on port ${PORT}`);
});
