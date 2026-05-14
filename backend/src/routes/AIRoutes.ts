import { Router, Request, Response } from 'express';

const router = Router();

router.post('/chat', (req: Request, res: Response) => {
  res.status(501).json({ error: 'AI chat endpoint not yet implemented' });
});

export default router;