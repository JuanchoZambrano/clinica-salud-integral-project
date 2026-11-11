import { Router } from "express";
import {
  createMedic,
  getMedics,
  getMedicById,
  updateMedic,
  deleteMedic,
} from "../controllers/medicController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

router.post("/", authMiddleware, roleMiddleware("ADMIN"), createMedic);
router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN", "RECEPTIONIST", "MANAGER"),
  getMedics,
);
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN", "RECEPTIONIST", "MANAGER", "MEDIC"),
  getMedicById,
);
router.put("/:id", authMiddleware, roleMiddleware("ADMIN"), updateMedic);
router.delete("/:id", authMiddleware, roleMiddleware("ADMIN"), deleteMedic);

export default router;
