import express from 'express';
import { addRiderProfile, fetchMyProfile, toggleRiderAvailability } from '../controllers/RiderController.js';
import { isAuth } from '../middlewares/isAuth.js';
import uploadFile from '../middlewares/multer.js';

const router = express.Router();

router.post("/new", isAuth, uploadFile, addRiderProfile)

router.get("/myprofile", isAuth, fetchMyProfile)

router.patch("/toggle", isAuth, toggleRiderAvailability)

export default router;