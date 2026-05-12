import { Request, Response } from "express";
import { whatsappService } from "../services/whatsapp.ts";
import { User } from "../models/User.ts";

export const getStatus = (req: Request, res: Response) => {
  try {
    const status = whatsappService.getStatus();
    const qr = whatsappService.getQRCode();
    res.json({ status, qr });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const restartClient = async (req: Request, res: Response) => {
  try {
    await whatsappService.logout();
    await whatsappService.connectWhatsApp();
    res.json({ message: "WhatsApp client re-initialization triggered" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const broadcast = async (req: Request, res: Response) => {
  const { message } = req.body;
  try {
    const users = await User.find({ role: "user" });
    for (const user of users) {
      if (user.phone) {
        await whatsappService.sendMessage(user.phone, message);
      }
    }
    res.json({ message: "Broadcast sent successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getWhatsappMembers = async (req: Request, res: Response) => {
  try {
    const members = await User.find({ role: "user" }).select("name phone whatsappGroupStatus whatsappJoinDate whatsappInviteSent");
    res.json(members);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const resendInvite = async (req: Request, res: Response) => {
  const { userId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const WHATSAPP_GROUP_INVITE_LINK = process.env.WHATSAPP_GROUP_INVITE_LINK || "https://chat.whatsapp.com/example";
    const message = `Hi ${user.name}, here is the link to join our official WhatsApp group: ${WHATSAPP_GROUP_INVITE_LINK}`;
    
    await whatsappService.sendMessage(user.phone, message);
    user.whatsappInviteSent = true;
    await user.save();
    res.json({ message: "Invite link resent successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
