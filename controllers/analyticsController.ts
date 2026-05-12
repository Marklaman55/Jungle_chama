import { Request, Response } from "express";
import { User } from "../models/User.ts";
import Contribution from "../models/Contribution.ts";
import Withdrawal from "../models/Withdrawal.ts";
import Product from "../models/Product.ts";

export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments({ role: "member" });
    const totalProducts = await Product.countDocuments();
    
    const contributions = await Contribution.find({ status: "completed" });
    const totalSavings = contributions.reduce((sum, c) => sum + c.amount, 0);
    
    const withdrawals = await Withdrawal.find({ status: "paid" });
    const totalPayouts = withdrawals.reduce((sum, w) => sum + w.amount, 0);

    // Monthly data for charts
    const monthlySavings = await Contribution.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.json({
      totalUsers,
      totalProducts,
      totalSavings,
      totalPayouts,
      monthlySavings
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
