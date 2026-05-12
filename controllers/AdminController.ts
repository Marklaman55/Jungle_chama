import { Request, Response } from 'express';
import User from '../models/User';
import Transaction from '../models/Transaction';
import SystemConfig from '../models/SystemConfig';
import { sendWhatsAppMessage, getWhatsAppQR } from '../services/WhatsAppService';
import { initiateStkPush, initiateB2BPayout } from '../services/MpesaService';
import { v4 as uuidv4 } from 'uuid';

import Product from '../models/Product';

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

export const buyProduct = async (req: Request, res: Response) => {
  const { productId, userId } = req.body;
  try {
    const user = await User.findOne({ userId });
    const product = await Product.findById(productId);

    if (!user || !product) {
      return res.status(404).json({ error: 'User or Product not found' });
    }

    if (user.balance < ((product.price as number) || 0)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    if (((product.stock as number) || 0) <= 0) {
        return res.status(400).json({ error: 'Product out of stock' });
    }

    // Deduct balance
    user.balance -= ((product.price as number) || 0);
    await user.save();

    // Reduce stock
    product.stock = ((product.stock as number) || 1) - 1;
    await product.save();

    // Create transaction
    const transaction = new Transaction({
        userId: user.userId,
        amount: product.price,
        transactionId: `BUY-${Date.now()}`,
        type: 'purchase',
        status: 'completed',
        date: new Date(),
        description: `Purchased ${product.name}`
    });
    await transaction.save();

    res.json({ message: 'Purchase successful', newBalance: user.balance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete purchase' });
  }
};

export const getUnpaidReminders = async (req: Request, res: Response) => {
  try {
    const config = await SystemConfig.findOne();
    const users = await User.find({ balance: { $lt: config?.cycleDay || 0 } }); // Simple logic for unpaid
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

export const updateSystemConfig = async (req: Request, res: Response) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig(req.body);
    } else {
      Object.assign(config, req.body);
    }
    await config.save();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update system config' });
  }
};

export const approveManualDeposit = async (req: Request, res: Response) => {
  const { transactionId, status } = req.body; // status: 'completed' | 'failed'
  try {
    const transaction = await Transaction.findById(transactionId);
    if (!transaction || transaction.type !== 'manual_deposit') {
      return res.status(404).json({ error: 'Transaction not found or not manual' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ error: 'Transaction already processed' });
    }

    transaction.status = status;
    await transaction.save();

    if (status === 'completed') {
      const user = await User.findOne({ userId: transaction.userId });
      if (user) {
        user.balance += transaction.amount;
        await user.save();
        await sendWhatsAppMessage(user.phone, `Your manual deposit of ${transaction.amount} KES has been approved. New balance: ${user.balance} KES.`);
      }
    }

    res.json({ message: `Transaction marked as ${status}`, transaction });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process transaction' });
  }
};

export const approveProduct = async (req: Request, res: Response) => {
  const { productId, status } = req.body; // status: 'approved' | 'rejected'
  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    product.status = status;
    await product.save();

    res.json({ message: `Product ${status}`, product });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process product' });
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

    user.balance += amount;
    await user.save();

    const transaction = new Transaction({
      userId: user.userId,
      amount: amount,
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

export const updateCycleOrder = async (req: Request, res: Response) => {
  const { cycleOrder } = req.body;
  if (!Array.isArray(cycleOrder)) {
    return res.status(400).json({ error: 'cycleOrder must be an array of userIds' });
  }

  try {
    const config = await SystemConfig.findOne();
    if (config) {
      config.cycleOrder = cycleOrder;
      config.currentIndex = 0; // Reset index when order changes
      await config.save();
      res.json({ message: 'Cycle order updated', config });
    } else {
      res.status(404).json({ error: 'System config not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cycle order' });
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

    // Logic for amount: e.g. 10 * 500 = 5000
    const payoutAmount = 5000; 

    // Attempt M-Pesa B2B Payout
    try {
        await initiateB2BPayout(user.phone, payoutAmount, `Cycle Payout Day ${config.cycleDay}`);
    } catch (mpesaError) {
        console.error('M-Pesa B2B Error:', mpesaError);
        // We might want to continue even if M-Pesa fails (manual payout) or stop.
        // For now, let's just log it and potentially warn the admin.
    }

    // Update user balance (acting as virtual wallet)
    user.balance += payoutAmount;
    await user.save();

    // Create transaction
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

    // Notify user
    await sendWhatsAppMessage(user.phone, `Congratulations ${user.name}! You have received your cycle payout of ${payoutAmount} KES. Your new balance is ${user.balance} KES.`);

    // Increment index for next time (or handle via B2B callback if using real money)
    config.currentIndex = (config.currentIndex + 1) % config.cycleOrder.length;
    config.cycleDay += 1;
    await config.save();

    res.json({ message: 'Cycle payout processed', nextUser: config.cycleOrder[config.currentIndex], newDay: config.cycleDay });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process cycle payout' });
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
        console.log('Request Headers for STK Push (Admin):', JSON.stringify(req.headers, null, 2));
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const currentBaseUrl = `${protocol}://${host}`;
        const response = await initiateStkPush(phone, amount, user.userId, currentBaseUrl);

        // Log pending transaction for history
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
