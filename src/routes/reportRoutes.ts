import { Router } from "express";
import { getAppointmentsBySpecialty, getDailyReport } from "../controllers/reportController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

router.get("/specialties", authMiddleware, roleMiddleware("ADMIN", "MANAGER"), getAppointmentsBySpecialty);
router.get(
  "/daily",
  authMiddleware,
  roleMiddleware("ADMIN", "MANAGER"),
  getDailyReport,
);

export default router;