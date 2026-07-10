import express from "express";
import { addAddress, deleteAddress, getMyAddresses } from "../controllers/AddressController.js";
import { isAuth } from "../middlewares/isAuth.js";

const router = express.Router();

router.post("/new", isAuth, addAddress);

router.delete("/:id", isAuth, deleteAddress);

router.get("/all", isAuth, getMyAddresses);

export default router;