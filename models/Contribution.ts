import mongoose, { Schema, Document } from 'mongoose';

export interface IContribution extends Document {
  memberId: mongoose.Types.ObjectId;
  amount: number;
  date: Date;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod: string;
}

const ContributionSchema: Schema = new Schema({
  memberId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  paymentMethod: { type: String, default: 'M-Pesa' }
});

export default mongoose.model<IContribution>('Contribution', ContributionSchema);
