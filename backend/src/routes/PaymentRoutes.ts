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
router.post('/callback', handleMpesaCallback);
router.post('/b2b-payout', authMiddleware, processB2BPayout);
router.post('/b2b-result', handleB2BResult);
router.post('/b2b-timeout', handleB2BTimeout);

export default router;