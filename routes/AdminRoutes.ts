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
  triggerMemberStkPush,
  updateSystemConfig,
  approveManualDeposit,
  approveProduct,
  updateMember,
  deleteMember
} from '../controllers/AdminController';
import { authMiddleware } from '../middleware/AuthMiddleware';
import { roleMiddleware } from '../middleware/RoleMiddleware';

const router = express.Router();

// Apply auth and admin role check to all routes in this file
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

router.get('/users', getUsers);
router.get('/members', getUsers); // Alias for frontend
router.get('/transactions', getTransactions);
router.get('/system', getSystemConfig);
router.post('/system', updateSystemConfig);
router.post('/whatsapp-status', getWhatsAppStatus);
router.post('/trigger-payout', triggerPayout);
router.post('/cycle-order', updateCycleOrder);
router.post('/process-cycle-payout', processCyclePayout);

router.get('/products', getProducts);
router.post('/products', createProduct);
router.post('/products/buy', buyProduct);
router.post('/products/approve', approveProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/bulk', bulkDeleteProducts);
router.delete('/products/:id', deleteProduct);

router.get('/reminders/unpaid', getUnpaidReminders);
router.post('/reminders/send', sendDailyReminders);
router.post('/update-balance', updateMemberBalance);
router.post('/trigger-stk', triggerMemberStkPush);
router.post('/transactions/approve-manual', approveManualDeposit);
router.put('/members/:id', updateMember);
router.delete('/members/:id', deleteMember);

export default router;
