import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { startCron } from './cron/DailyCron';
import { initWhatsApp } from './services/WhatsAppService';
import WebhookRoutes from './routes/WebhookRoutes';
import AIRoutes from './routes/AIRoutes';
import AdminRoutes from './routes/AdminRoutes';
import PaymentRoutes from './routes/PaymentRoutes';
import AuthRoutes from './routes/AuthRoutes';
import MemberRoutes from './routes/MemberRoutes';
import { getProducts } from './controllers/AdminController';
import { getMyPayments } from './controllers/MemberController';
import { authMiddleware } from './middleware/AuthMiddleware';
import User from './models/User';
import SystemConfig from './models/SystemConfig';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Storage Configuration (Memory storage for Cloudinary)
const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enhanced CORS for ngrok and other forwarded hosts
  app.use(cors({
    origin: true, // Allow all origins for the tunnel
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-forwarded-proto', 'x-forwarded-host']
  }));

  // Security headers for ngrok
  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    next();
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Serve static files
  app.use('/uploads', express.static(uploadsDir));
  app.use(express.static(path.join(__dirname, 'public')));

  // MongoDB Connection
  const MONGO_URI = process.env.MONGO_URI;
  const FALLBACK_URI = 'mongodb+srv://n8n_scrapper:n8n_scrapper@atlas-citrine-cable.60ngaae.mongodb.net/?appName=atlas-citrine-cable';
  
  const connectionString = MONGO_URI || FALLBACK_URI;

  // Enable buffering to prevent immediate failure if DB connection is slightly delayed
  mongoose.set('bufferCommands', true);

  if (!MONGO_URI) {
    console.log('Using requested Atlas MongoDB URI as fallback...');
  } else {
    // Log the cleaned connection string for debugging DNS/ENOTFOUND issues
    const censoredUri = MONGO_URI.replace(/:([^@]+)@/, ':****@');
    console.log(`Connecting to MongoDB Atlas Cluster: ${censoredUri}`);
  }
  
  // Ensure we use a specific database and not 'test' which often has permission issues
  const dbOptions = {
    dbName: 'jungle_chama',
    serverSelectionTimeoutMS: 10000, // Wait up to 10s for cluster selection
    connectTimeoutMS: 15000,
  };

  mongoose.connection.on('connected', () => console.log('Mongoose connected successfully to jungle_chama database.'));
  mongoose.connection.on('error', (err) => console.error('Mongoose connection error:', err));
  mongoose.connection.on('disconnected', () => console.log('Mongoose connection lost.'));

  mongoose.connect(connectionString, dbOptions)
    .then(async () => {
      console.log(`Mongoose connection promise resolved.`);
      
      // Initialize SystemConfig if it doesn't exist. 
      // We wrap this in a try-catch to avoid crashing if permissions are still an issue.
      try {
        const { default: SystemConfig } = await import('./models/SystemConfig');
        const config = await SystemConfig.findOne();
        if (!config) {
          const newConfig = new SystemConfig({
            cycleOrder: [],
            currentIndex: 0,
            cycleDay: 1,
            systemState: 'RECRUITMENT',
          });
          await newConfig.save();
          console.log('Initial system configuration created.');
        }
      } catch (err) {
        console.error('Error during SystemConfig initialization:', err);
      }

      // Start daily cron job
      startCron();
      
      // Initialize WhatsApp client
      await initWhatsApp();

      // Bootstrap Admin User
      try {
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
          const hashedPassword = await bcrypt.hash('Admin@Jungle2024', 10);
          const adminUser = new User({
            name: 'Jungle Admin',
            email: 'admin@junglechama.com',
            password: hashedPassword,
            phone: '254700000000',
            userId: uuidv4().slice(0, 8).toUpperCase(),
            role: 'admin',
            balance: 1000000
          });
          await adminUser.save();
          console.log('Default admin user created: admin@junglechama.com / Admin@Jungle2024');
        }

        // Also ensure the current user is an admin for convenience
        await User.findOneAndUpdate(
          { email: 'vincentkamau179@gmail.com' },
          { role: 'admin' }
        );
      } catch (err) {
          console.error('Error bootstrapping admin user:', err);
      }
    })
    .catch((err) => {
        console.error('Initial MongoDB connection error:', err);
    });

  // Handle process termination to clean up WhatsApp client
  const cleanup = async () => {
      console.log('Cleaning up resources before exit...');
      try {
          const { client } = await import('./services/WhatsAppService');
          if (client) {
              await client.destroy();
              console.log('WhatsApp client destroyed.');
          }
      } catch (e) {}
      process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // API request logger for debugging
  app.use('/api/*', (req, res, next) => {
    console.log(`[API Request] ${req.method} ${req.url}`);
    next();
  });

  // API Routes - Order matters: most specific or common first
  app.use('/api/auth', AuthRoutes);
  app.use('/api/member', MemberRoutes);
  app.use('/api/admin', AdminRoutes);
  app.use('/api/payment/mpesa', PaymentRoutes);
  app.use('/api/mpesa', PaymentRoutes); // Alias to match the URL in .env
  app.use('/api/webhook', WebhookRoutes);
  app.use('/api/ai', AIRoutes);
  
  // Image Upload Route - Uploads to Cloudinary
  app.post('/api/admin/upload', authMiddleware, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const streamUpload = (req: any) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream((error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          });
          stream.end(req.file.buffer);
        });
      };

      const result: any = await streamUpload(req);
      res.json({ url: result.secure_url });
    } catch (error: any) {
      console.error('Cloudinary Upload Error:', error);
      res.status(500).json({ error: error.message || 'Failed to upload to Cloudinary' });
    }
  });
  
  // Public/Member accessible products and payments
  app.get('/api/products', authMiddleware, getProducts);
  app.get('/api/payments/my', authMiddleware, getMyPayments);

  // Fallback for non-existent API routes - ALWAYS RETURN JSON for /api/*
  app.all('/api/*', (req, res) => {
    console.warn(`[API 404] ${req.method} ${req.url}`);
    res.status(404).json({ 
      error: 'API route not found', 
      method: req.method, 
      path: req.originalUrl 
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      configFile: 'frontend/vite.config.ts',
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
