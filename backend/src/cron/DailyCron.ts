import cron from 'node-cron';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import SystemConfig from '../models/SystemConfig.js';
import { sendWhatsAppMessage } from '../services/WhatsAppService.js';
import { v4 as uuidv4 } from 'uuid';

export const startCron = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily cron job...');
    try {
      const config = await SystemConfig.findOne();
      if (!config || config.systemState !== 'SAVING') {
        console.log('System is not in SAVING state. Skipping cron.');
        return;
      }

      const users = await User.find();
      for (const user of users) {
        user.carryForward -= user.expectedDaily;
        if (user.carryForward < 0) {
          console.log(`User ${user.name} is owing: ${user.carryForward}`);
          await sendWhatsAppMessage(user.phone, `Reminder: You are owing ${Math.abs(user.carryForward)} KES. Please make a payment.`);
        }
        await user.save();
      }

      config.cycleDay += 1;

      if (config.cycleDay > 10) {
        const payoutUserId = config.cycleOrder[config.currentIndex];
        const payoutUser = await User.findOne({ userId: payoutUserId });

        if (payoutUser) {
          const payoutAmount = 1000;
          payoutUser.balance += payoutAmount;
          await payoutUser.save();

          const transaction = new Transaction({
            userId: payoutUser.userId,
            amount: payoutAmount,
            transactionId: uuidv4(),
            type: 'payout',
            status: 'completed',
            date: new Date(),
          });
          await transaction.save();

          await sendWhatsAppMessage(payoutUser.phone, `Congratulations! You have received your payout of ${payoutAmount} KES.`);
        }

        config.currentIndex += 1;
        config.cycleDay = 1;

        if (config.currentIndex >= config.cycleOrder.length) {
          config.systemState = 'BREAK';
          config.currentIndex = 0;
        }
      }

      await config.save();
      console.log('Daily cron job completed.');
    } catch (error) {
      console.error('Error in daily cron job:', error);
    }
  });
};