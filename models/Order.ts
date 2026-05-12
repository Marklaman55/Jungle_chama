import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  memberId: mongoose.Types.ObjectId;
  items: any[];
  productTotal: number;
  deliveryFee: number;
  total: number;
  paymentStatus: "pending" | "paid" | "failed";
  orderStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  deliveryStatus: "processing" | "in_transit" | "delivered";
  deliveryPartner: string;
  trackingNumber: string;
  deliveryAddress: string;
  mode: "normal" | "redemption";
  createdAt: Date;
}

const OrderSchema: Schema = new Schema({
  memberId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      productId: { type: Schema.Types.ObjectId, ref: "Product" },
      name: String,
      price: Number,
      quantity: Number,
    },
  ],
  productTotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 190 },
  total: { type: Number, required: true },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  orderStatus: { type: String, enum: ["pending", "processing", "shipped", "delivered", "cancelled"], default: "pending" },
  deliveryStatus: { type: String, enum: ["processing", "in_transit", "delivered"], default: "processing" },
  deliveryPartner: { type: String, default: "ParcelGrid" },
  trackingNumber: { type: String },
  deliveryAddress: { type: String },
  mode: { type: String, enum: ["normal", "redemption"], default: "normal" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IOrder>("Order", OrderSchema);
