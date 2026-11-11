import { Router } from "express";
import authRoutes from "./authRoutes.js";
import reportRoutes from "./reportRoutes.js";
import patientRoutes from "./patientRoutes.js";
import appointmentRoutes from "./appointmentRoutes.js"

const router = Router();

router.use("/auth", authRoutes);
router.use("/reports", reportRoutes);
router.use("/patients", patientRoutes);
router.use("/appointments", appointmentRoutes);

export default router;