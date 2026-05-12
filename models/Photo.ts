import mongoose from 'mongoose';

const photoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

export const Photo = mongoose.model('Photo', photoSchema);
export default Photo;
