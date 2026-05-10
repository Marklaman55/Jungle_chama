import User, { IUser } from '../models/User';
import Transaction from '../models/Transaction';
import { v4 as uuidv4 } from 'uuid';

export const applyPayment = async (user: IUser, amount: number) => {
  user.balance += amount;
  await user.save();

  const transaction = new Transaction({
    userId: user.userId,
    amount: amount,
    transactionId: `PAY-${uuidv4().slice(0, 8).toUpperCase()}`,
    type: 'payment',
    status: 'completed',
    date: new Date(),
    description: 'WhatsApp Payment'
  });
  await transaction.save();

  return transaction;
};