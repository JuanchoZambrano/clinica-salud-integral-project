import { Router } from "express";
import authRoutes from "./authRoutes.js";
import reportRoutes from "./reportRoutes.js";
import patientRoutes from "./patientRoutes.js";
import appointmentRoutes from "./appointmentRoutes.js";
import medicRoutes from "./medicRoutes.js";
import specialtyRoutes from "./specialtyRoutes.js";
import userRoutes from "./userRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/reports", reportRoutes);
router.use("/patients", patientRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/medics", medicRoutes);
router.use("/specialties", specialtyRoutes);
router.use("/users", userRoutes);

export default router;