import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`[Error] ${req.method} ${req.url}:`, err.message);
  
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON format' });
  }

  if (err.message.includes('Cast to ObjectId failed')) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  res.status(500).json({ 
    error: 'Internal Server Error',
    ...(config.nodeEnv !== 'production' && { stack: err.stack })
  });
};