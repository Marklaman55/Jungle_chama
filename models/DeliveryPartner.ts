import mongoose, { Schema, Document } from "mongoose";

export interface IDeliveryPartner extends Document {
  name: string;
  phone: string;
  location: string;
  deliveryFee: number;
  status: "active" | "inactive";
}

const DeliveryPartnerSchema: Schema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  location: { type: String, required: true },
  deliveryFee: { type: Number, default: 190 },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
});

export default mongoose.model<IDeliveryPartner>("DeliveryPartner", DeliveryPartnerSchema);
