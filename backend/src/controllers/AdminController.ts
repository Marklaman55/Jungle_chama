import { Request, Response } from 'express';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import SystemConfig from '../models/SystemConfig.js';
import { sendWhatsAppMessage, getWhatsAppQR } from '../services/WhatsAppService.js';
import { initiateStkPush, initiateB2BPayout } from '../services/MpesaService.js';
import { v4 as uuidv4 } from 'uuid';
import Product from '../models/Product.js';

export const getWhatsAppStatus = (req: Request, res: Response) => {
  const status = getWhatsAppQR();
  res.json(status);
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

export const bulkDeleteProducts = async (req: Request, res: Response) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: 'ids must be an array' });
  }
  try {
    await Product.deleteMany({ _id: { $in: ids } });
    res.json({ message: 'Products deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete products' });
  }
};

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
};

export const buyProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.body;
    const user = await User.findOne({ userId: (req as any).user.userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.stock <= 0) return res.status(400).json({ error: 'Product out of stock' });
    if (user.balance < product.price) return res.status(400).json({ error: 'Insufficient balance' });

    user.balance -= product.price;
    product.stock -= 1;
    await user.save();
    await product.save();

    await new Transaction({
      userId: user.userId,
      amount: product.price,
      transactionId: `BUY-${Date.now()}`,
      type: 'deposit',
      status: 'completed',
      description: `Bought ${product.name}`,
      date: new Date(),
    }).save();

    res.json({ message: 'Product purchased successfully', newBalance: user.balance });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCycleOrder = async (req: Request, res: Response) => {
  try {
    const { cycleOrder } = req.body;
    if (!Array.isArray(cycleOrder)) {
      return res.status(400).json({ error: 'cycleOrder must be an array of userIds' });
    }
    const config = await SystemConfig.findOne();
    if (config) {
      config.cycleOrder = cycleOrder;
      config.currentIndex = 0;
      await config.save();
      res.json({ message: 'Cycle order updated', config });
    } else {
      res.status(404).json({ error: 'System config not found' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const processCyclePayout = async (req: Request, res: Response) => {
  try {
    const config = await SystemConfig.findOne();
    if (!config || config.cycleOrder.length === 0) {
      return res.status(400).json({ error: 'Cycle order not set' });
    }

    const userId = config.cycleOrder[config.currentIndex];
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ error: 'User in cycle not found' });
    }

    const payoutAmount = 5000;

    try {
      await initiateB2BPayout(user.phone, payoutAmount, `Cycle Payout Day ${config.cycleDay}`);
    } catch (mpesaError) {
      console.error('M-Pesa B2B Error:', mpesaError);
    }

    user.balance += payoutAmount;
    await user.save();

    const transaction = new Transaction({
      userId: user.userId,
      amount: payoutAmount,
      transactionId: `CYCLE-${Date.now()}`,
      type: 'payout',
      status: 'completed',
      date: new Date(),
      description: `Cycle Payout Day ${config.cycleDay}`
    });
    await transaction.save();

    await sendWhatsAppMessage(user.phone, `Congratulations ${user.name}! You have received your cycle payout of ${payoutAmount} KES. Your new balance is ${user.balance} KES.`);

    config.currentIndex = (config.currentIndex + 1) % config.cycleOrder.length;
    config.cycleDay += 1;
    await config.save();

    res.json({ message: 'Cycle payout processed', nextUser: config.cycleOrder[config.currentIndex], newDay: config.cycleDay });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUnpaidReminders = async (req: Request, res: Response) => {
  try {
    const config = await SystemConfig.findOne();
    const users = await User.find({ balance: { $lt: config?.cycleDay || 0 } });
    res.json({ currentDay: config?.cycleDay || 0, unpaidUsers: users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
};

export const sendDailyReminders = async (req: Request, res: Response) => {
  try {
    const config = await SystemConfig.findOne();
    const unpaidUsers = await User.find({ balance: { $lt: config?.cycleDay || 0 }, role: 'member' });

    let sentCount = 0;
    for (const user of unpaidUsers) {
      if (user.phone) {
        const message = `Hello ${user.name}, this is a reminder from Jungle Chama. Please top up your account to maintain your cycle position. Minimum required: ${config?.cycleDay} KES. Your current balance: ${user.balance} KES.`;
        await sendWhatsAppMessage(user.phone, message);
        sentCount++;
      }
    }

    res.json({ success: true, message: `${sentCount} reminders sent via WhatsApp.` });
  } catch (error) {
    console.error('sendDailyReminders error:', error);
    res.status(500).json({ error: 'Failed to send reminders' });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getSystemConfig = async (req: Request, res: Response) => {
  try {
    const config = await SystemConfig.findOne();
    res.status(200).json(config);
  } catch (error) {
    console.error('Error fetching system config:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const triggerPayout = async (req: Request, res: Response) => {
  const { userId, amount } = req.body;

  if (!userId || !amount) {
    return res.status(400).json({ error: 'User ID and amount are required.' });
  }

  try {
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    user.balance += Number(amount);
    await user.save();

    const transaction = new Transaction({
      userId: user.userId,
      amount: Number(amount),
      transactionId: uuidv4(),
      type: 'payout',
      status: 'completed',
      date: new Date(),
    });
    await transaction.save();

    await sendWhatsAppMessage(user.phone, `Admin has triggered a payout of ${amount} KES to your account.`);

    res.status(200).json({ message: 'Payout triggered successfully.', transaction });
  } catch (error) {
    console.error('Error triggering payout:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

export const updateMemberBalance = async (req: Request, res: Response) => {
  const { userId, amount } = req.body;
  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.balance += Number(amount);
    await user.save();

    const transaction = new Transaction({
      userId: user.userId,
      amount: Number(amount),
      transactionId: `MANUAL-${Date.now()}`,
      type: 'deposit',
      status: 'completed',
      description: 'Manual administrator deposit',
      date: new Date()
    });
    await transaction.save();

    res.json({ message: 'Balance updated', newBalance: user.balance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update balance' });
  }
};

export const triggerMemberStkPush = async (req: Request, res: Response) => {
  const { userId, amount } = req.body;
  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const phone = user.phone;
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const currentBaseUrl = `${protocol}://${host}`;
    const response = await initiateStkPush(phone, amount, user.userId, currentBaseUrl);

    const transaction = new Transaction({
      userId: user.userId,
      amount: amount,
      transactionId: response.CheckoutRequestID || `STK-${Date.now()}`,
      mpesa_checkout_id: response.CheckoutRequestID,
      type: 'deposit',
      status: 'pending',
      description: 'Admin requested STK Push',
      date: new Date()
    });
    await transaction.save();

    await sendWhatsAppMessage(phone, `Administrator has requested a payment of ${amount} KES. Please check your phone for the M-Pesa prompt.`);

    res.json({ message: 'STK Push initiated', response });
  } catch (error) {
    console.error('Error triggering member STK push:', error);
    res.status(500).json({ error: 'Failed to initiate STK Push' });
  }
};