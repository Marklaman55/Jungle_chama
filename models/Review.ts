import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  image?: string;
  video?: string;
  createdAt: Date;
}

const ReviewSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  image: { type: String },
  video: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IReview>("Review", ReviewSchema);
