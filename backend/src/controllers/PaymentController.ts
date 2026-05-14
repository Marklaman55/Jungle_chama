import { Request, Response } from 'express';
import { initiateStkPush, initiateB2BPayout } from '../services/MpesaService.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import SystemConfig from '../models/SystemConfig.js';
import { v4 as uuidv4 } from 'uuid';
import { sendPaymentConfirmation } from '../services/NotificationService.js';

export const triggerStkPush = async (req: Request, res: Response) => {
  try {
    const { amount, phone } = req.body;
    const user = (req as any).user;

    if (!amount || !phone) {
      return res.status(400).json({ error: 'Amount and phone number are required' });
    }

    if (amount < 10) {
      return res.status(400).json({ error: 'Minimum deposit is KES 10' });
    }

    const accountReference = `DEP-${uuidv4().slice(0, 8)}`;
    const result = await initiateStkPush(phone, amount, accountReference);

    const transaction = new Transaction({
      user: user.id,
      amount,
      type: 'deposit',
      method: 'mpesa_stk',
      mpesaCheckoutRequestID: result.CheckoutRequestID,
      phone,
      status: 'pending',
      accountReference,
    });
    await transaction.save();

    res.json({ success: true, checkoutRequestID: result.CheckoutRequestID, message: 'STK push initiated' });
  } catch (err: any) {
    console.error('STK Push Error:', err);
    res.status(500).json({ error: err.message || 'Failed to initiate STK push' });
  }
};

export const handleMpesaCallback = async (req: Request, res: Response) => {
  try {
    const { Body } = req.body;

    if (!Body) {
      return res.status(400).json({ error: 'Invalid callback body' });
    }

    const callbackData = Body.stkCallback || Body;
    const resultCode = callbackData.ResultCode || callbackData.resultCode;
    const checkoutRequestID = callbackData.CheckoutRequestID || callbackData.checkoutRequestID;

    if (resultCode === 0) {
      await Transaction.findOneAndUpdate(
        { mpesaCheckoutRequestID: checkoutRequestID },
        { status: 'completed', completedAt: new Date() },
        { new: true }
      );
    } else {
      await Transaction.findOneAndUpdate(
        { mpesaCheckoutRequestID: checkoutRequestID },
        { status: 'failed', failureReason: `M-Pesa error code: ${resultCode}` },
        { new: true }
      );
    }

    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err: any) {
    console.error('M-Pesa Callback Error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const processB2BPayout = async (req: Request, res: Response) => {
  try {
    const { phone, amount, remarks } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({ error: 'Phone and amount are required' });
    }

    if (amount < 50) {
      return res.status(400).json({ error: 'Minimum B2B payout is KES 50' });
    }

    const result = await initiateB2BPayout(phone, amount, remarks || 'Payment');
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('B2B Payout Error:', err);
    res.status(500).json({ error: err.message || 'Failed to process B2B payout' });
  }
};

export const handleB2BResult = async (req: Request, res: Response) => {
  try {
    const result = req.body;
    console.log('B2B Result received:', JSON.stringify(result, null, 2));
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err: any) {
    console.error('B2B Result Error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const handleB2BTimeout = async (req: Request, res: Response) => {
  try {
    const result = req.body;
    console.log('B2B Timeout received:', JSON.stringify(result, null, 2));
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err: any) {
    console.error('B2B Timeout Error:', err);
    res.status(500).json({ error: err.message });
  }
};