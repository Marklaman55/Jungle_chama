import express from 'express';
import { getSystemState } from '../controllers/systemController.ts';

const router = express.Router();

router.get('/state', getSystemState);

export default router;
