import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemConfig extends Document {
  cycleOrder: string[];
  currentIndex: number;
  cycleDay: number;
  systemState: 'RECRUITMENT' | 'SAVING' | 'BREAK';
  lastCycleUpdate: Date;
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
  lastCycleUpdate: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema);