import cron from 'node-cron';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import SystemConfig from '../models/SystemConfig.js';
import { sendPayoutAlert, sendSMSNotification } from '../services/NotificationService.js';
import { sendWhatsAppMessage } from '../services/WhatsAppService.js';
import { v4 as uuidv4 } from 'uuid';

let isRunning = false;

const processPendingTransactions = async () => {
  if (isRunning) {
    console.log('[Cron] Previous run still in progress, skipping...');
    return;
  }
  isRunning = true;

  try {
    const config = await SystemConfig.findOne();
    const cycleDuration = config?.cycleDuration || 30;
    const sharePrice = config?.sharePrice || 100;
    const payoutPercentage = config?.payoutPercentage || 80;

    const pendingTransactions = await Transaction.find({
      status: 'completed',
      payoutProcessed: { $ne: true },
    }).populate('user');

    for (const transaction of pendingTransactions) {
      const user = transaction.user as any;
      if (!user) continue;

      const payoutAmount = Math.round(transaction.amount * (payoutPercentage / 100));

      user.balance -= transaction.amount;
      user.totalWithdrawn += payoutAmount;
      user.cyclesCompleted = (user.cyclesCompleted || 0) + 1;
      await user.save();

      const payoutTransaction = new Transaction({
        user: user._id,
        amount: payoutAmount,
        type: 'payout',
        method: 'cycle',
        status: 'pending',
        accountReference: `PAYOUT-${uuidv4().slice(0, 8)}`,
        relatedTransaction: transaction._id,
      });
      await payoutTransaction.save();

      transaction.payoutProcessed = true;
      transaction.payoutTransactionId = payoutTransaction._id.toString();
      await transaction.save();

      await sendPayoutAlert(user.email, user.phone, user.name, payoutAmount);
      console.log(`[Cron] Processed payout of ${payoutAmount} KES for user ${user.name}`);
    }

    console.log(`[Cron] Processed ${pendingTransactions.length} pending transactions`);
  } catch (err: any) {
    console.error('[Cron] Error processing transactions:', err);
  } finally {
    isRunning = false;
  }
};

export const startCron = () => {
  cron.schedule('*/5 * * * *', async () => {
    console.log('[Cron] Running scheduled task...');
    await processPendingTransactions();
  });
  console.log('[Cron] Started — checking every 5 minutes');
};