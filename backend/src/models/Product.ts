import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  image_url: { type: String },
  video_url: { type: String },
  media: [{
    url: { type: String },
    type: { type: String, enum: ['image', 'video'] }
  }],
  stock: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  creatorId: { type: String, ref: 'User' },
  isGlobal: { type: Boolean, default: true },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc: any, ret: any) => {
      ret.id = ret._id.toString();
      return ret;
    }
  }
});

export default mongoose.model('Product', ProductSchema);