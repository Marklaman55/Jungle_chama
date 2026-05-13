import express from 'express';
import { updateSystemConfig } from '../controllers/AdminController.js';

const router = express.Router();

router.post('/chat', (req, res) => {
  res.json({ message: "AI Features coming soon!" });
});

export default router;