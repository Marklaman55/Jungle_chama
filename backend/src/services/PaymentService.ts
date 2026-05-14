import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import SystemConfig from '../models/SystemConfig.js';

export const applyPayment = async (transactionId: string) => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) throw new Error('Transaction not found');

  const config = await SystemConfig.findOne();
  const chargePercentage = config?.depositChargePercentage || 0;
  const chargeAmount = (transaction.amount * chargePercentage) / 100;
  const netAmount = transaction.amount - chargeAmount;

  const user = await User.findById(transaction.user);
  if (!user) throw new Error('User not found');

  user.balance += netAmount;
  user.totalDeposited = (user.totalDeposited ?? 0) + transaction.amount;
  await user.save();

  transaction.status = 'completed';
  transaction.chargeAmount = chargeAmount;
  transaction.netAmount = netAmount;
  transaction.processedAt = new Date();
  await transaction.save();

  return transaction;
};

export const refundPayment = async (transactionId: string, reason: string) => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) throw new Error('Transaction not found');
  if (transaction.status !== 'pending') throw new Error('Only pending transactions can be refunded');

  transaction.status = 'refunded';
  transaction.rejectionReason = reason;
  await transaction.save();

  return transaction;
};

export const getAllTransactions = async (filters: any = {}) => {
  const { status, userId, from, to, page = 1, limit = 20 } = filters;
  const query: any = {};
  if (status) query.status = status;
  if (userId) query.user = userId;
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) query.createdAt.$lte = new Date(to);
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(query).populate('user', 'name email phone').skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }),
    Transaction.countDocuments(query),
  ]);

  return { transactions, total, page, pages: Math.ceil(total / limit) };
};