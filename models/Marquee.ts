import mongoose from 'mongoose';

const marqueeSchema = new mongoose.Schema({
  text: { type: String, required: true },
  active: { type: Boolean, default: true },
  priority: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export const Marquee = mongoose.model('Marquee', marqueeSchema);
