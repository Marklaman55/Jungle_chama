import mongoose, { Schema, Document } from "mongoose";

export interface IChamaGroup extends Document {
  groupName: string;
  description: string;
  contributionAmount: number;
  members: mongoose.Types.ObjectId[];
  membersCount: number;
  maxMembers: number;
  status: "Recruiting" | "Active";
  createdAt: Date;
}

const ChamaGroupSchema: Schema = new Schema({
  groupName: { type: String, required: true },
  description: { type: String },
  contributionAmount: { type: Number, required: true },
  members: [{ type: Schema.Types.ObjectId, ref: "User" }],
  membersCount: { type: Number, default: 0 },
  maxMembers: { type: Number, default: 30 },
  status: { type: String, enum: ["Recruiting", "Active"], default: "Recruiting" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IChamaGroup>("ChamaGroup", ChamaGroupSchema);
