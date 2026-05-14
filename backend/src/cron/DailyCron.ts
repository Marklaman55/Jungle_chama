import cron from 'node-cron';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import SystemConfig from '../models/SystemConfig.js';
import { sendPayoutAlert, sendSMSNotification } from '../services/NotificationService.js';
import { sendWhatsAppMessage } from '../services/WhatsAppService.js';
import { v4 as uuidv4 } from 'uuid';