import express from "express";
import { stkPush, mpesaCallback } from "../controllers/mpesaController.ts";
import { authenticateToken } from "../middleware/authMiddleware.ts";

const router = express.Router();

router.post("/stkpush", authenticateToken, stkPush);
router.post("/callback", mpesaCallback);

export default router;
