import cron from 'node-cron';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import SystemConfig from '../models/SystemConfig.js';
import { sendPayoutAlert, sendSMSNotification } from '../services/NotificationService.js';
import { sendWhatsAppMessage } from '../services/WhatsAppService.js';
import { v4 as uuidv4 } from 'uuid';

export const startCron = () => {
  // Runs daily at midnight
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
          const msg = `Reminder: You are owing ${Math.abs(user.carryForward)} KES. Please make a payment to maintain your cycle position.`;
          await sendWhatsAppMessage(user.phone, msg);
          await sendSMSNotification(user.phone, msg);
        }
        await user.save();
      }

      config.cycleDay += 1;

      if (config.cycleDay > 10) {
        const payoutUserId = config.cycleOrder[config.currentIndex];
        const payoutUser = await User.findOne({ userId: payoutUserId });

        if (payoutUser) {
          const memberCount = await User.countDocuments({ role: 'member' });
          const payoutAmount = memberCount * 500;
          payoutUser.balance += payoutAmount;
          await payoutUser.save();

          const transaction = new Transaction({
            userId: payoutUser.userId,
            amount: payoutAmount,
            transactionId: `CYCLE-${Date.now()}`,
            type: 'payout',
            status: 'completed',
            date: new Date(),
            description: `Automated Cycle Payout Day 10`
          });
          await transaction.save();

          await sendPayoutAlert(payoutUser.email, payoutUser.phone, payoutUser.name, payoutAmount);
        }

        const userIds = [...config.cycleOrder];
        const paidUserId = userIds.splice(config.currentIndex, 1)[0];
        if (paidUserId) {
          userIds.push(paidUserId);
        }
        config.cycleOrder = userIds;
        config.currentIndex = 0;
        config.cycleDay = 1;

        for (let i = 0; i < userIds.length; i++) {
          await User.updateOne({ userId: userIds[i] }, { payout_number: i + 1 });
        }
      }

      await config.save();
      console.log('Daily cron job completed.');
    } catch (error) {
      console.error('Error in daily cron job:', error);
    }
  });
};