import { Request, Response } from 'express';
import Withdrawal from '../models/Withdrawal.ts';

export const requestWithdrawal = async (req: any, res: Response) => {
  try {
    const withdrawal = new Withdrawal({ ...req.body, memberId: req.user.id });
    await withdrawal.save();
    res.status(201).json(withdrawal);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getWithdrawalsByUserId = async (req: any, res: Response) => {
  try {
    const withdrawals = await Withdrawal.find({ memberId: req.user.id });
    res.json(withdrawals);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllWithdrawals = async (req: Request, res: Response) => {
  try {
    const withdrawals = await Withdrawal.find().populate('memberId', 'name');
    res.json(withdrawals);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateWithdrawalStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const withdrawal = await Withdrawal.findByIdAndUpdate(id, { status }, { new: true });
    res.json(withdrawal);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
