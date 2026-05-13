import { Request, Response } from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Transaction from '../models/Transaction.js';
import SystemConfig from '../models/SystemConfig.js';

export const uploadProduct = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const productData = {
      ...req.body,
      creatorId: userId,
      isGlobal: false,
      status: 'pending'
    };
    const product = new Product(productData);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('uploadProduct error:', error);
    res.status(500).json({ error: 'Failed to upload product' });
  }
};

export const submitManualDeposit = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { amount, manualMessage } = req.body;

    if (!amount || !manualMessage) {
      return res.status(400).json({ error: 'Amount and transaction message are required' });
    }

    const transaction = new Transaction({
      userId,
      amount: Number(amount),
      transactionId: `MAN-${Date.now()}`,
      type: 'manual_deposit',
      status: 'pending',
      manualMessage,
      date: new Date(),
      description: 'Manual deposit request'
    });

    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    console.error('submitManualDeposit error:', error);
    res.status(500).json({ error: 'Failed to submit deposit request' });
  }
};

export const getMemberStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const user = await User.findOne({ userId });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const transactions = await Transaction.find({ userId, type: 'deposit', status: 'completed' });
    const totalSaved = transactions.reduce((sum, t) => sum + t.amount, 0);

    const config = await SystemConfig.findOne();

    res.json({
      totalSaved,
      referralCount: 0,
      currentCycle: config ? {
          day: config.cycleDay,
          state: config.systemState,
          nextPayout: config.cycleOrder[config.currentIndex]
      } : null,
      balance: user.balance
    });
  } catch (error) {
    console.error('getMemberStats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

export const getMyPayments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const transactions = await Transaction.find({ userId }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    console.error('getMyPayments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

export const getPendingPayoutOrders = async (req: Request, res: Response) => {
  try {
      const userId = (req as any).user.userId;
      const payouts = await Transaction.find({ userId, type: 'payout', status: 'completed' }).sort({ date: -1 });
      const mapped = payouts.map(p => ({
          id: p._id,
          amount: p.amount,
          status: p.status,
          date: p.date
      }));
      res.json(mapped);
  } catch (error) {
      console.error('getPendingPayoutOrders error:', error);
      res.status(500).json({ error: 'Failed to fetch payout orders' });
  }
};

export const processMemberPayout = async (req: Request, res: Response) => {
  try {
      const userId = (req as any).user.userId;
      const { productId, payoutOrderId } = req.body;
      res.json({ success: true, message: 'Redemption successful' });
  } catch (error) {
      console.error('processMemberPayout error:', error);
      res.status(500).json({ error: 'Failed to process payout' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
      const userId = (req as any).user.userId;
      const { name, phone, avatar_url } = req.body;

      const user = await User.findOne({ userId });
      if (!user) return res.status(404).json({ error: 'User not found' });

      if (name) user.name = name;
      if (phone) user.phone = phone;
      if (avatar_url) (user as any).avatar_url = avatar_url;

      await user.save();

      res.json({
          success: true,
          message: 'Profile updated successfully',
          user: {
              name: user.name,
              email: user.email,
              phone: user.phone,
              userId: user.userId,
              balance: user.balance,
              role: user.role,
              avatar_url: (user as any).avatar_url
          }
      });
  } catch (error) {
      console.error('updateProfile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
  }
};