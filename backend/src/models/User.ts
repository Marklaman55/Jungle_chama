import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  phone: string;
  userId: string;
  balance: number;
  carryForward: number;
  expectedDaily: number;
  lastPaymentDate?: Date;
  role: 'member' | 'admin';
  isVerified: boolean;
  payout_number?: number;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  phone: { type: String, required: true },
  userId: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 },
  carryForward: { type: Number, default: 0 },
  expectedDaily: { type: Number, default: 20 },
  lastPaymentDate: { type: Date },
  role: { type: String, enum: ['member', 'admin'], default: 'member' },
  isVerified: { type: Boolean, default: false },
  payout_number: { type: Number },
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: {
    virtuals: true,
    transform: (doc, ret: any) => {
      ret.id = ret._id.toString();
      return ret;
    }
  }
});

export default mongoose.model<IUser>('User', UserSchema);