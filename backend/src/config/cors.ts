import { Router } from 'express';

export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow all origins for development and tunnels (ngrok, etc.)
    if (!origin) return callback(null, true);
    
    // In production, you may want to restrict this
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-forwarded-proto', 'x-forwarded-host'],
};