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
  syncCycleOrder,
  advanceCycleManual,
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

// Unified auth for all routes
router.use(authMiddleware);

// Viewer can see almost everything
router.get('/users', roleMiddleware(['admin', 'contributor', 'viewer']), getUsers);
router.get('/members', roleMiddleware(['admin', 'contributor', 'viewer']), getUsers);
router.get('/transactions', roleMiddleware(['admin', 'contributor', 'viewer']), getTransactions);
router.get('/system', roleMiddleware(['admin', 'contributor', 'viewer']), getSystemConfig);
router.get('/products', roleMiddleware(['admin', 'contributor', 'viewer']), getProducts);
router.get('/reminders/unpaid', roleMiddleware(['admin', 'contributor', 'viewer']), getUnpaidReminders);
router.get('/whatsapp-status', roleMiddleware(['admin', 'contributor', 'viewer']), getWhatsAppStatus);

// Contributor can process operations
router.post('/reminders/send', roleMiddleware(['admin', 'contributor']), sendDailyReminders);
router.post('/process-cycle-payout', roleMiddleware(['admin', 'contributor']), processCyclePayout);
router.post('/products/buy', roleMiddleware(['admin', 'contributor']), buyProduct);
router.post('/products/approve', roleMiddleware(['admin', 'contributor']), approveProduct);
router.post('/transactions/approve-manual', roleMiddleware(['admin', 'contributor']), approveManualDeposit);
router.post('/trigger-stk', roleMiddleware(['admin', 'contributor']), triggerMemberStkPush);

// Admin only for system settings and destructive actions
router.post('/system', roleMiddleware(['admin']), updateSystemConfig);
router.post('/trigger-payout', roleMiddleware(['admin']), triggerPayout);
router.post('/cycle-order', roleMiddleware(['admin']), updateCycleOrder);
router.post('/cycle/sync', roleMiddleware(['admin']), syncCycleOrder);
router.post('/cycle/advance', roleMiddleware(['admin']), advanceCycleManual);
router.post('/products', roleMiddleware(['admin']), createProduct);
router.put('/products/:id', roleMiddleware(['admin']), updateProduct);
router.post('/products/bulk', roleMiddleware(['admin']), bulkDeleteProducts);
router.delete('/products/:id', roleMiddleware(['admin']), deleteProduct);
router.post('/update-balance', roleMiddleware(['admin']), updateMemberBalance);
router.put('/members/:id', roleMiddleware(['admin']), updateMember);
router.delete('/members/:id', roleMiddleware(['admin']), deleteMember);

export default router;
