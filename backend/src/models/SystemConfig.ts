import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemConfig extends Document {
  cycleOrder: string[];
  currentIndex: number;
  cycleDay: number;
  systemState: 'RECRUITMENT' | 'SAVING' | 'BREAK';
  paymentNumber: string;
  paymentType: 'Till' | 'Paybill' | 'Personal';
  manualPaymentDetails: string;
  lastCycleUpdate: Date;
  adminPhone?: string;
  depositChargePercentage?: number;
  cycleDuration?: number;
  sharePrice?: number;
  payoutPercentage?: number;
}

const SystemConfigSchema: Schema = new Schema({
  cycleOrder: { type: [String], default: [] },
  currentIndex: { type: Number, default: 0 },
  cycleDay: { type: Number, default: 1 },
  systemState: { 
    type: String, 
    enum: ['RECRUITMENT', 'SAVING', 'BREAK'], 
    default: 'RECRUITMENT' 
  },
  paymentNumber: { type: String, default: '' },
  paymentType: { type: String, enum: ['Till', 'Paybill', 'Personal'], default: 'Till' },
  manualPaymentDetails: { type: String, default: 'Pay to Cashier Number' },
  lastCycleUpdate: { type: Date, default: Date.now },
  adminPhone: { type: String },
  depositChargePercentage: { type: Number, default: 0 },
  cycleDuration: { type: Number, default: 30 },
  sharePrice: { type: Number, default: 100 },
  payoutPercentage: { type: Number, default: 80 },
}, { timestamps: true });

export default mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema);
