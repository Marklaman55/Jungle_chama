import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { connectDatabase } from './config/database.js';
import { corsOptions } from './config/cors.js';
import { errorMiddleware } from './middleware/ErrorMiddleware.js';
import AuthRoutes from './routes/AuthRoutes.js';
import AdminRoutes from './routes/AdminRoutes.js';
import MemberRoutes from './routes/MemberRoutes.js';
import PaymentRoutes from './routes/PaymentRoutes.js';
import WebhookRoutes from './routes/WebhookRoutes.js';
import { startCron } from './cron/DailyCron.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
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

  await connectDatabase();

  startCron();

  if (process.env.ENABLE_WHATSAPP !== 'false') {
    try {
      const { initWhatsApp } = await import('./services/WhatsAppService.js');
      await initWhatsApp();
    } catch (err) {
      console.warn('WhatsApp service disabled or unavailable in this environment');
    }
  }

  app.use('/api/auth', AuthRoutes);
  app.use('/api/member', MemberRoutes);
  app.use('/api/admin', AdminRoutes);
  app.use('/api/payment/mpesa', PaymentRoutes);
  app.use('/api/mpesa', PaymentRoutes);
  app.use('/api/webhook', WebhookRoutes);

  app.use('/api/*', (req, res) => {
    console.warn(`[API 404] ${req.method} ${req.url}`);
    res.status(404).json({ error: 'API route not found' });
  });

  app.use(errorMiddleware);

  return app;
};

export default createApp;