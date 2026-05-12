import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
  memberId: mongoose.Types.ObjectId;
  amount: number;
  reference: string;
  mpesaReceiptNumber?: string;
  phoneNumber?: string;
  status: "pending" | "completed" | "failed";
  metadata?: any;
  createdAt: Date;
}

const PaymentSchema: Schema = new Schema({
  memberId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  reference: { type: String },
  mpesaReceiptNumber: { type: String },
  phoneNumber: { type: String },
  status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IPayment>("Payment", PaymentSchema);
