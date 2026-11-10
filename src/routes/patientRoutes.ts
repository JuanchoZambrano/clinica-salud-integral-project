import { Router } from "express";
import {
  createPatient,
  getPatientAppointments,
  getPatientById,
  getPatients,
  updatePatient,
} from "../controllers/patientController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN", "RECEPTIONIST"),
  createPatient,
);
router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN", "RECEPTIONIST"),
  getPatients,
);
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "RECEPTIONIST"),
  getPatientById,
);
router.get(
  "/:id/appointments",
  authMiddleware,
  roleMiddleware("ADMIN", "RECEPTIONIST"),
  getPatientAppointments,
);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "RECEPTIONIST"),
  updatePatient,
);

export default router;
