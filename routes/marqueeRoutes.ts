import express from 'express';
import { getMarquees, createMarquee, updateMarquee, deleteMarquee } from '../controllers/marqueeController.ts';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware.ts';

const router = express.Router();

router.get('/', getMarquees);
router.post('/', authenticateToken, isAdmin, createMarquee);
router.put('/:id', authenticateToken, isAdmin, updateMarquee);
router.delete('/:id', authenticateToken, isAdmin, deleteMarquee);

export default router;
