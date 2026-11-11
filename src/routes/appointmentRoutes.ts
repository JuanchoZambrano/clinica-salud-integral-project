import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import {
  createAppointment,
  getAppointmentById,
  getAppointments,
  updateAppointment,
  updateAppointmentStatus,
} from "../controllers/appointmentController.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN", "RECEPTIONIST"),
  createAppointment,
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN", "RECEPTIONIST","MANAGER", "MEDIC"),
  getAppointments,
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "RECEPTIONIST", "MANAGER", "MEDIC"),
  getAppointmentById,
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "RECEPTIONIST", "MEDIC"),
  updateAppointment,
);

router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware("ADMIN", "MEDIC"),
  updateAppointmentStatus,
);

export default router;
