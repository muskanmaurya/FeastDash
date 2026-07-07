import express from "express";
import cloudinary from "cloudinary";
const router = express.Router();
// router.post("/upload", async(req, res)=>{
//     try{
//         const {buffer} = req.body;  // Assuming the image is sent as a buffer in the request body
//         const cloud = await cloudinary.v2.uploader.upload(buffer);  // Upload the image to Cloudinary, uploader.upload is a method in the Cloudinary SDK that uploads an image to Cloudinary and returns a promise that resolves with the uploaded image's details.
//         res.json({
//             url: cloud.secure_url,
//         })
//     }catch(error: any){
//         res.status(500).json({message:"error uploading image", error: error.message})
//     }
// })
// 🟢 Open utils/src/routes/cloudinary.ts and update the handler:
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
    }
    catch (error) {
        console.error("🔥 Cloudinary Core Upload Error:", error);
        return res.status(500).json({ message: "Error uploading image to Cloudinary", error: error.message });
    }
});
export default router;
