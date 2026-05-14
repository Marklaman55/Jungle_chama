import { Request, Response } from 'express';
import User from '../models/User.js';
import SystemConfig from '../models/SystemConfig.js';
import { applyPayment } from '../services/PaymentService.js';
import { sendWhatsAppMessage } from '../services/WhatsAppService.js';
import { v4 as uuidv4 } from 'uuid';