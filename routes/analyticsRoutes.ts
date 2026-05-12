import express from "express";
import { getAdminStats } from "../controllers/analyticsController.ts";
import { authenticateToken, isAdmin } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.get("/admin-stats", authenticateToken, isAdmin, getAdminStats);

export default router;
