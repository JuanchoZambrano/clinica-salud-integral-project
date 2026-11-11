import { Router } from "express";
import { createSpecialty, getSpecialties, getSpecialtyById, updateSpecialty, deleteSpecialty } from "../controllers/specialtyController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  createSpecialty
);
router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN", "RECEPTIONIST", "MANAGER", "MEDIC"),
  getSpecialties
);
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "RECEPTIONIST", "MANAGER", "MEDIC"),
  getSpecialtyById
);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  updateSpecialty
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  deleteSpecialty
);

export default router;