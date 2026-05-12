import express from 'express';
import { 
  getUsers, 
  getTransactions, 
  getSystemConfig, 
  triggerPayout, 
  getWhatsAppStatus,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  getUnpaidReminders,
  sendDailyReminders,
  buyProduct,
  updateCycleOrder,
  processCyclePayout,
  updateMemberBalance,
  triggerMemberStkPush
} from '../controllers/AdminController.js';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { roleMiddleware } from '../middleware/RoleMiddleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

router.get('/users', getUsers);
router.get('/members', getUsers);
router.get('/transactions', getTransactions);
router.get('/system', getSystemConfig);
router.get('/whatsapp-status', getWhatsAppStatus);
router.post('/trigger-payout', triggerPayout);
router.post('/cycle-order', updateCycleOrder);
router.post('/process-cycle-payout', processCyclePayout);

router.get('/products', getProducts);
router.post('/products', createProduct);
router.post('/products/buy', buyProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/bulk', bulkDeleteProducts);
router.delete('/products/:id', deleteProduct);

router.get('/reminders/unpaid', getUnpaidReminders);
router.post('/reminders/send', sendDailyReminders);
router.post('/update-balance', updateMemberBalance);
router.post('/trigger-stk', triggerMemberStkPush);

export default router;