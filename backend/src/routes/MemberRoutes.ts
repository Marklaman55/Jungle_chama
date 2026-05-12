import express from 'express';
import { 
    getMemberStats, 
    getPendingPayoutOrders, 
    processMemberPayout,
    updateProfile 
} from '../controllers/MemberController.js';
import { authMiddleware } from '../middleware/AuthMiddleware.js';

const router = express.Router();

router.get('/stats', authMiddleware, getMemberStats);
router.get('/payout-orders/pending', authMiddleware, getPendingPayoutOrders);
router.post('/process-payout', authMiddleware, processMemberPayout);
router.put('/update-profile', authMiddleware, updateProfile);

export default router;