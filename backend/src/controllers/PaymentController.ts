import { Request, Response } from 'express';
import { initiateStkPush, initiateB2BPayout } from '../services/MpesaService.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import SystemConfig from '../models/SystemConfig.js';
import { v4 as uuidv4 } from 'uuid';
import { sendPaymentConfirmation } from '../services/NotificationService.js';