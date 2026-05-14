import { Request, Response } from 'express';
import User from '../models/User.js';
import SystemConfig from '../models/SystemConfig.js';
import { applyPayment } from '../services/PaymentService.js';
import { sendWhatsAppMessage } from '../services/WhatsAppService.js';
import { v4 as uuidv4 } from 'uuid';

export const handleTwilioWebhook = async (req: Request, res: Response) => {
  try {
    const { Body, From, MessageSid } = req.body;

    if (!Body || !From) {
      return res.status(400).json({ error: 'Missing message body or sender' });
    }

    console.log(`[Twilio Webhook] From: ${From}, Body: ${Body}, SID: ${MessageSid}`);

    const config = await SystemConfig.findOne();
    const adminPhone = config?.adminPhone || '';

    const user = await User.findOne({ phone: From.replace('whatsapp:', '') });
    if (user) {
      await sendWhatsAppMessage(From.replace('whatsapp:', ''), `New message received: ${Body}`);
    }

    res.json({ status: 'ok', message: 'Webhook processed' });
  } catch (err: any) {
    console.error('Twilio Webhook Error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const handleN8NWebhook = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    console.log('[N8N Webhook] Received:', JSON.stringify(data, null, 2));

    const { event, userId, amount } = data;

    if (event === 'deposit_confirmed' && userId && amount) {
      try {
        await applyPayment(userId);
        console.log(`[N8N Webhook] Applied payment of ${amount} for user ${userId}`);
      } catch (err: any) {
        console.error('[N8N Webhook] Payment application failed:', err.message);
      }
    }

    res.json({ status: 'ok', received: true });
  } catch (err: any) {
    console.error('N8N Webhook Error:', err);
    res.status(500).json({ error: err.message });
  }
};