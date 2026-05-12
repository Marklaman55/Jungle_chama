import cron from 'node-cron';
import { User } from '../models/User.ts';
import { SystemState } from '../models/SystemState.ts';
import Withdrawal from '../models/Withdrawal.ts';
import { broadcastNotification, sendNotification } from './socketService.ts';

export const processDailyCycle = async () => {
  console.log('Processing daily cycle...');
  try {
    let state = await SystemState.findOne();
    if (!state) {
      state = new SystemState({ cycleDay: 1, currentIndex: 0 });
      await state.save();
    }

    if (state.mode === 'SAVING') {
      // 1. Process contributions and carryForward logic
      const users = await User.find({ role: 'user' });
      for (const user of users) {
        user.carryForward -= user.expectedDaily;
        await user.save();
      }

      // 2. Increment cycleDay
      state.cycleDay += 1;
      
      // 3. Trigger payout if cycleDay > 10 (example: payout every 10 days)
      if (state.cycleDay > 10) {
        await triggerPayout(state);
      } else {
        state.lastUpdated = new Date();
        await state.save();

        // Broadcast day update to all clients
        broadcastNotification({
          title: 'Cycle Update',
          message: `Day ${state.cycleDay} of the savings cycle.`,
          type: 'info'
        });
      }
    }
    return state;
  } catch (error) {
    console.error('Error processing cycle:', error);
    throw error;
  }
};

export const initCronJobs = () => {
  // Run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    await processDailyCycle();
  });
};

export const triggerPayout = async (state: any) => {
  if (state.cycleOrder.length === 0) {
    // Initialize cycle order if empty
    const users = await User.find({ role: 'user' }).sort({ createdAt: 1 });
    state.cycleOrder = users.map(u => u._id);
  }

  const currentMemberId = state.cycleOrder[state.currentIndex];
  const user = await User.findById(currentMemberId);

  if (user) {
    console.log(`Triggering payout for ${user.name}`);
    
    // Create withdrawal record
    const withdrawal = new Withdrawal({
      memberId: user._id,
      amount: 2000, // Example payout amount
      status: 'paid',
      createdAt: new Date()
    });
    await withdrawal.save();

    // Notify user specifically
    sendNotification(user._id.toString(), {
      title: 'Payout Received!',
      message: `Congratulations! You have received your payout of KES 2000.`,
      type: 'success'
    });

    // Broadcast to everyone about the new payout and next in line
    const nextIndex = (state.currentIndex + 1) % state.cycleOrder.length;
    const nextMemberId = state.cycleOrder[nextIndex];
    const nextUser = await User.findById(nextMemberId);

    broadcastNotification({
      title: 'New Payout Issued!',
      message: `${user.name} has received their payout! Next in line: ${nextUser ? nextUser.name : 'TBD'}`,
      type: 'payout'
    });

    // Update state for next cycle
    state.currentIndex = nextIndex;
    state.cycleDay = 1;
  }
};
