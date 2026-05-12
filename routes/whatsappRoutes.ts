import express from "express";
import { getStatus, restartClient, broadcast, getWhatsappMembers, resendInvite } from "../controllers/whatsappController.ts";
import { authenticateToken, isAdmin } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.get("/status", authenticateToken, isAdmin, getStatus);
router.post("/restart", authenticateToken, isAdmin, restartClient);
router.post("/broadcast", authenticateToken, isAdmin, broadcast);
router.get("/members", authenticateToken, isAdmin, getWhatsappMembers);
router.post("/resend-invite", authenticateToken, isAdmin, resendInvite);

export default router;
