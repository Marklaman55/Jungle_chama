import express from 'express';
import { 
    getMemberStats, 
    getPendingPayoutOrders, 
    processMemberPayout,
    updateProfile,
    submitManualDeposit,
    uploadProduct
} from '../controllers/MemberController';
import { authMiddleware } from '../middleware/AuthMiddleware';

const router = express.Router();

router.get('/stats', authMiddleware, getMemberStats);
router.get('/payout-orders/pending', authMiddleware, getPendingPayoutOrders);
router.post('/process-payout', authMiddleware, processMemberPayout);
router.put('/update-profile', authMiddleware, updateProfile);
router.post('/manual-deposit', authMiddleware, submitManualDeposit);
router.post('/products', authMiddleware, uploadProduct);

export default router;
