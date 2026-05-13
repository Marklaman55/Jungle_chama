import express from 'express';
import {
    triggerStkPush,
    handleMpesaCallback,
    processB2BPayout,
    handleB2BResult,
    handleB2BTimeout
} from '../controllers/PaymentController.js';
import Transaction from '../models/Transaction.js';
import { authMiddleware } from '../middleware/AuthMiddleware.js';

const router = express.Router();

router.post('/stk-push', authMiddleware, triggerStkPush);
router.post('/callback', handleMpesaCallback);
router.post('/b2b-payout', authMiddleware, processB2BPayout);
router.post('/b2b-result', handleB2BResult);
router.post('/b2b-timeout', handleB2BTimeout);

// Get current user's payment history
router.get('/my', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const payments = await Transaction.find({ userId }).sort({ date: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

export default router;