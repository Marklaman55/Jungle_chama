import mongoose from 'mongoose';

const VisitorSchema = new mongoose.Schema({
  count: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.model('Visitor', VisitorSchema);
