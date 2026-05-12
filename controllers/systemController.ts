import { Request, Response } from 'express';
import { SystemState } from '../models/SystemState.ts';
import { User } from '../models/User.ts';

export const getSystemState = async (req: Request, res: Response) => {
  try {
    let state = await SystemState.findOne().populate('cycleOrder', 'name userId _id');
    if (!state) {
      // Initialize if doesn't exist
      const users = await User.find({ role: 'user' }).sort({ createdAt: 1 });
      state = new SystemState({
        cycleDay: 1,
        currentIndex: 0,
        cycleOrder: users.map(u => u._id)
      });
      await state.save();
      state = await SystemState.findById(state._id).populate('cycleOrder', 'name userId _id');
    }
    res.json(state);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
