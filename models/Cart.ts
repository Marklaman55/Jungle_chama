import mongoose, { Schema, Document } from "mongoose";

export interface ICart extends Document {
  memberId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  createdAt: Date;
}

const CartSchema: Schema = new Schema({
  memberId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<ICart>("Cart", CartSchema);
