import { Router } from "express";
import { getReports } from "../controllers/reportController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

router.get("/", authMiddleware, roleMiddleware("ADMIN", "MANAGER"), getReports);

export default router;