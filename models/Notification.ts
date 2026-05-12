import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  message: string;
  type: string;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
  message: { type: String, required: true },
  type: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<INotification>("Notification", NotificationSchema);
