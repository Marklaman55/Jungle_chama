import express from 'express';
import { 
    triggerStkPush, 
    handleMpesaCallback, 
    processB2BPayout, 
    handleB2BResult, 
    handleB2BTimeout 
} from '../controllers/PaymentController';
import { authMiddleware } from '../middleware/AuthMiddleware';

const router = express.Router();

router.post('/stk-push', authMiddleware, triggerStkPush);
router.post('/callback', handleMpesaCallback); // Public for M-Pesa
router.post('/b2b-payout', authMiddleware, processB2BPayout);
router.post('/b2b-result', handleB2BResult); // Public for M-Pesa
router.post('/b2b-timeout', handleB2BTimeout); // Public for M-Pesa

export default router;
