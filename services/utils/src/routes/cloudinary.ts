import express from "express";
import cloudinary from "cloudinary";

const router = express.Router();

router.post("/upload", async (req, res) => {
    try {
        const { buffer } = req.body; // This receives the fileBuffer.content string

        if (!buffer) {
            return res.status(400).json({ message: "No image content buffer provided" });
        }

        // Cloudinary uploads base64 Data URI strings seamlessly
        const cloud = await cloudinary.v2.uploader.upload(buffer, {
            folder: "restaurants", // Optional: organizes your uploads
        });
        
        return res.json({
            url: cloud.secure_url,
        });
    } catch (error: any) {
        console.error("🔥 Cloudinary Core Upload Error:", error);
        return res.status(500).json({ message: "Error uploading image to Cloudinary", error: error.message });
    }
});


export default router;