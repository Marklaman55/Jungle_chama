import mongoose from 'mongoose';

const systemStateSchema = new mongoose.Schema({
  mode: { type: String, enum: ['SAVING', 'MAINTENANCE'], default: 'SAVING' },
  cycleDay: { type: Number, default: 1 },
  currentIndex: { type: Number, default: 0 },
  cycleOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastUpdated: { type: Date, default: Date.now }
});

export const SystemState = mongoose.model('SystemState', systemStateSchema);
export default SystemState;
