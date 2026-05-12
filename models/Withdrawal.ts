import mongoose, { Schema, Document } from "mongoose";

export interface IWithdrawal extends Document {
  memberId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  amount: number;
  status: "pending" | "approved" | "rejected" | "paid";
  reason?: string;
  createdAt: Date;
}

const WithdrawalSchema: Schema = new Schema({
  memberId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  groupId: { type: Schema.Types.ObjectId, ref: "ChamaGroup" },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected", "paid"], default: "pending" },
  reason: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IWithdrawal>("Withdrawal", WithdrawalSchema);
