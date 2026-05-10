import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  userId: string;
  amount: number;
  transactionId: string;
  type: 'deposit' | 'payout' | 'purchase';
  status: 'pending' | 'completed' | 'failed';
  date: Date;
  description?: string;
  mpesa_checkout_id?: string;
}

const TransactionSchema: Schema = new Schema({
  userId: { type: String, required: true, ref: 'User' },
  amount: { type: Number, required: true },
  transactionId: { type: String, required: true, unique: true },
  type: { type: String, enum: ['deposit', 'payout', 'purchase'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  date: { type: Date, default: Date.now },
  description: { type: String },
  mpesa_checkout_id: { type: String }
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
