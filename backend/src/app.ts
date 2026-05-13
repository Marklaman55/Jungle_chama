import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import mongoose from 'mongoose';
import { connectDatabase } from './config/database.js';
import { corsOptions } from './config/cors.js';
import { errorMiddleware } from './middleware/ErrorMiddleware.js';
import AuthRoutes from './routes/AuthRoutes.js';
import AdminRoutes from './routes/AdminRoutes.js';
import MemberRoutes from './routes/MemberRoutes.js';
import PaymentRoutes from './routes/PaymentRoutes.js';
import WebhookRoutes from './routes/WebhookRoutes.js';
import AIRoutes from './routes/AIRoutes.js';
import { startCron } from './cron/DailyCron.js';
import { initWhatsApp } from './services/WhatsAppService.js';
import { getProducts } from './controllers/AdminController.js';
import { getMyPayments } from './controllers/MemberController.js';
import { authMiddleware } from './middleware/AuthMiddleware.js';
import User from './models/User.js';
import SystemConfig from './models/SystemConfig.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import cloudinary from 'cloudinary';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Storage Configuration (Memory storage for Cloudinary)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit for videos
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'));
    }
  }
});

const createApp = async () => {
  const app = express();

  // Health endpoint for Render (must be before all middleware)
  app.get('/health', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send('{"status":"ok"}');
  });

  app.use(cors(corsOptions));

  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    next();
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static(uploadsDir));

  // Connect to MongoDB (non-blocking)
  connectDatabase().catch(err => {
    console.warn('MongoDB connection warning (will retry on first request):', err.message);
  });

  // Initialize WhatsApp if enabled
  if (process.env.ENABLE_WHATSAPP === 'true') {
    try {
      await initWhatsApp();
    } catch (err) {
      console.warn('WhatsApp service disabled or unavailable in this environment');
    }
  }

  // API health endpoint (database check)
  app.get('/api/health', async (req, res) => {
    try {
      if (mongoose.connection.readyState === 1) {
        res.status(200).json({ status: 'ok', database: 'connected' });
      } else {
        res.status(503).json({ status: 'error', database: 'disconnected' });
      }
    } catch (err) {
      res.status(503).json({ status: 'error', database: 'disconnected' });
    }
  });

  // Keepalive endpoint to prevent Render sleep
  app.get('/keepalive', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send('{"status":"alive"}');
  });

  // Database guard middleware - returns 503 if DB is not connected
  app.use('/api', async (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ status: 'error', database: 'disconnected' });
    }
    next();
  });

  // API request logger for debugging
  app.use('/api/*', (req, res, next) => {
    console.log(`[API Request] ${req.method} ${req.url}`);
    next();
  });

  // API Routes
  app.use('/api/auth', AuthRoutes);
  app.use('/api/member', MemberRoutes);
  app.use('/api/admin', AdminRoutes);
  app.use('/api/payment/mpesa', PaymentRoutes);
  app.use('/api/mpesa', PaymentRoutes);
  app.use('/api/webhook', WebhookRoutes);
  app.use('/api/ai', AIRoutes);

  // Top-level public routes (no auth required)
  app.get('/api/products', getProducts);
  app.get('/api/payments/my', authMiddleware, getMyPayments);

  // Image/Video Upload Route - Uploads to Cloudinary
  app.post('/api/admin/upload', authMiddleware, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const streamUpload = (req) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.v2.uploader.upload_stream(
            { resource_type: 'auto' },
            (error, result) => {
              if (result) {
                resolve(result);
              } else {
                reject(error);
              }
            }
          );
          stream.end(req.file.buffer);
        });
      };

const result: { secure_url?: string; resource_type?: string } = await streamUpload(req);
       res.json({ url: result.secure_url, resource_type: result.resource_type });
    } catch (error) {
      console.error('Cloudinary Upload Error:', error);
      res.status(500).json({ error: error.message || 'Failed to upload to Cloudinary' });
    }
  });

  // Fallback for non-existent API routes - ALWAYS RETURN JSON for /api/*
  app.all('/api/*', (req, res) => {
    console.warn(`[API 404] ${req.method} ${req.url}`);
    res.status(404).json({
      error: 'API route not found',
      method: req.method,
      path: req.originalUrl
    });
  });

  app.use(errorMiddleware);

  return app;
};

export default createApp;