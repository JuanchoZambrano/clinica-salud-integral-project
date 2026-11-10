import { Router } from "express";
import authRoutes from "./authRoutes.js";
import reportRoutes from "./reportRoutes.js";
import patientRoutes from "./patientRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/reports", reportRoutes);
router.use("/patients", patientRoutes);

export default router;