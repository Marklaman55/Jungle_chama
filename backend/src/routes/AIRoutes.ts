import express from 'express';

const router = express.Router();

router.post('/chat', async (req, res) => {
    // Placeholder for AI chat features
    res.json({ message: "AI Features coming soon!" });
});

export default router;