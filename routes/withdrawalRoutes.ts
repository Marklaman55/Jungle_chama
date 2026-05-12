import express from "express";
import { 
  requestWithdrawal, 
  getWithdrawalsByUserId, 
  getAllWithdrawals, 
  updateWithdrawalStatus 
} from "../controllers/withdrawalController.ts";
import { authenticateToken as authenticate, isAdmin } from "../middleware/authMiddleware.ts";

const router = express.Router();

// Member routes
router.post("/request", authenticate, requestWithdrawal);
router.get("/my-withdrawals", authenticate, getWithdrawalsByUserId);

// Admin routes
router.get("/all", authenticate, isAdmin, getAllWithdrawals);
router.patch("/:id/status", authenticate, isAdmin, updateWithdrawalStatus);

export default router;
