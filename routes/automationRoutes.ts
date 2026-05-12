import express from 'express';

const router = express.Router();

router.post('/trigger', (req, res) => res.json({ status: 'triggered' }));

export default router;
