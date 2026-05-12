import express from 'express';
import { uploadPhoto, getPhotos } from '../controllers/photoController.ts';
import { authenticateToken } from '../middleware/authMiddleware.ts';
import { upload } from '../middleware/upload.ts';

const router = express.Router();

router.post('/upload', authenticateToken, upload.single('photo'), uploadPhoto);
router.get('/', getPhotos);

export default router;
