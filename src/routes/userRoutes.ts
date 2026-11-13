import { Router } from "express";
import { createUser, getUsers, updateUser, updateUserStatus } from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

router.post("/", authMiddleware, roleMiddleware("ADMIN"), createUser);
router.get("/", authMiddleware, roleMiddleware("ADMIN"), getUsers);
router.put("/:id", authMiddleware, roleMiddleware("ADMIN"), updateUser);
router.patch("/:id/status", authMiddleware, roleMiddleware("ADMIN"), updateUserStatus);

export default router;
