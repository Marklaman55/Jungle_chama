import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  userId: string;
  user?: string;
  amount: number;
  transactionId: string;
  type: 'deposit' | 'payout' | 'purchase' | 'manual_deposit';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  date: Date;
  description?: string;
  manualMessage?: string;
  mpesa_checkout_id?: string;
  chargeAmount?: number;
  netAmount?: number;
  processedAt?: Date;
  payoutProcessed?: boolean;
  payoutTransactionId?: string;
  relatedTransaction?: string;
  rejectionReason?: string;
  completedAt?: Date;
  failureReason?: string;
  accountReference?: string;
}

const TransactionSchema: Schema = new Schema({
  userId: { type: String, required: true, ref: 'User' },
  amount: { type: Number, required: true },
  transactionId: { type: String, required: true, unique: true },
  type: { type: String, enum: ['deposit', 'payout', 'purchase', 'manual_deposit'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
  date: { type: Date, default: Date.now },
  description: { type: String },
  manualMessage: { type: String },
  mpesa_checkout_id: { type: String },
  chargeAmount: { type: Number },
  netAmount: { type: Number },
  processedAt: { type: Date },
  payoutProcessed: { type: Boolean },
  payoutTransactionId: { type: String },
  relatedTransaction: { type: String, ref: 'Transaction' },
  rejectionReason: { type: String },
  completedAt: { type: Date },
  failureReason: { type: String },
  accountReference: { type: String },
}, {
  toJSON: {
    virtuals: true,
    transform: (doc, ret: any) => {
      ret.id = ret._id.toString();
      return ret;
    }
  }
});

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
