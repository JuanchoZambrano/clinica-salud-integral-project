import { Router } from "express";
import authRoutes from "./authRoutes.js";
import reportRoutes from "./reportRoutes.js";
import patientRoutes from "./patientRoutes.js";
import appointmentRoutes from "./appointmentRoutes.js"
import medicRoutes from "./medicRoutes.js"

const router = Router();

router.use("/auth", authRoutes);
router.use("/reports", reportRoutes);
router.use("/patients", patientRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/medics", medicRoutes);

export default router;