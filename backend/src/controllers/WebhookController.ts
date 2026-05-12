import { Request, Response } from 'express';
import User from '../models/User.js';
import SystemConfig from '../models/SystemConfig.js';
import { applyPayment } from '../services/PaymentService.js';
import { sendWhatsAppMessage } from '../services/WhatsAppService.js';
import { v4 as uuidv4 } from 'uuid';

export const handleTwilioWebhook = async (req: Request, res: Response) => {
  const { Body, From } = req.body;
  const message = Body.trim().toLowerCase();
  const phone = From.replace('whatsapp:', '');

  console.log(`Received message from ${phone}: ${message}`);

  try {
    if (message.startsWith('register')) {
      const parts = message.split(' ');
      if (parts.length < 3) {
        await sendWhatsAppMessage(phone, 'Invalid format. Use: register [name] [phone]');
        return res.status(200).send();
      }
      const name = parts[1];
      const userPhone = parts[2];

      const existingUser = await User.findOne({ phone: userPhone });
      if (existingUser) {
        await sendWhatsAppMessage(phone, 'User already registered.');
        return res.status(200).send();
      }

      const newUser = new User({
        name,
        phone: userPhone,
        userId: uuidv4().slice(0, 8),
      });
      await newUser.save();

      await sendWhatsAppMessage(phone, `Welcome ${name}! You are registered. Your User ID is ${newUser.userId}.`);
      return res.status(200).send();
    }

    if (message.startsWith('pay')) {
      const parts = message.split(' ');
      if (parts.length < 2) {
        await sendWhatsAppMessage(phone, 'Invalid format. Use: pay [amount]');
        return res.status(200).send();
      }
      const amount = parseFloat(parts[1]);
      if (isNaN(amount)) {
        await sendWhatsAppMessage(phone, 'Invalid amount.');
        return res.status(200).send();
      }

      const user = await User.findOne({ phone });
      if (!user) {
        await sendWhatsAppMessage(phone, 'User not found. Please register first.');
        return res.status(200).send();
      }

      const transaction = await applyPayment(user, amount);
      await sendWhatsAppMessage(phone, `Payment of ${amount} KES received. Transaction ID: ${transaction.transactionId}. New balance: ${user.balance} KES.`);
      return res.status(200).send();
    }

    if (message === 'balance') {
      const user = await User.findOne({ phone });
      if (!user) {
        await sendWhatsAppMessage(phone, 'User not found.');
        return res.status(200).send();
      }
      await sendWhatsAppMessage(phone, `Your balance is ${user.balance} KES. Carry forward: ${user.carryForward} KES.`);
      return res.status(200).send();
    }

    if (message === 'status') {
      const config = await SystemConfig.findOne();
      if (!config) {
        await sendWhatsAppMessage(phone, 'System configuration not found.');
        return res.status(200).send();
      }
      await sendWhatsAppMessage(phone, `System State: ${config.systemState}. Cycle Day: ${config.cycleDay}/10.`);
      return res.status(200).send();
    }

    await sendWhatsAppMessage(phone, 'I didn\'t understand that. Try: register, pay, balance, or status.');
    res.status(200).send();
  } catch (error) {
    console.error('Error in Twilio webhook:', error);
    res.status(500).send();
  }
};

export const handleN8NWebhook = async (req: Request, res: Response) => {
  const { type, userId, message } = req.body;

  try {
    if (type === 'reminder') {
      const user = await User.findOne({ userId });
      if (user) {
        await sendWhatsAppMessage(user.phone, message || 'Reminder: Please make your daily payment.');
      }
    } else if (type === 'payout') {
      const user = await User.findOne({ userId });
      if (user) {
        await sendWhatsAppMessage(user.phone, message || 'Congratulations! Your payout is ready.');
      }
    }
    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Error in n8n webhook:', error);
    res.status(500).json({ status: 'error' });
  }
};