import { Request, Response } from "express";
import { initiateSTKPush } from "../services/mpesaService.ts";
import Payment from "../models/Payment.ts";
import Contribution from "../models/Contribution.ts";
import { User } from "../models/User.ts";
import { whatsappService } from "../services/whatsapp.ts";
import { sendNotification, sendPaymentSuccess } from "../services/socketService.ts";

export const stkPush = async (req: any, res: Response) => {
  const { amount, phoneNumber, product } = req.body;
  const userId = req.user.id;

  if (!amount || !phoneNumber) {
    return res.status(400).json({ error: "Amount and phone number are required" });
  }

  // Format phone number to 254XXXXXXXXX
  const formattedPhone = phoneNumber.startsWith('0') ? '254' + phoneNumber.slice(1) : phoneNumber;
  if (!formattedPhone) {
    return res.status(400).json({ error: "Invalid phone number format. Use 07XXXXXXXX or 254XXXXXXXXX" });
  }

  try {
    const response = await initiateSTKPush(
      amount,
      formattedPhone,
      product || "JungleChama",
      `Payment for ${product || "Contribution"}`
    );

    // Record pending payment
    const payment = new Payment({
      memberId: userId,
      amount,
      reference: response.CheckoutRequestID,
      status: "pending",
      phoneNumber: formattedPhone,
      metadata: { product, userId }
    });
    await payment.save();

    res.json({ message: "STK Push sent. Please check your phone.", data: response });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const mpesaCallback = async (req: Request, res: Response) => {
  const { Body } = req.body;
  const { stkCallback } = Body;

  console.log("M-Pesa Callback Received:", JSON.stringify(stkCallback));

  if (stkCallback.ResultCode === 0) {
    const checkoutRequestID = stkCallback.CheckoutRequestID;
    const amount = stkCallback.CallbackMetadata.Item.find((item: any) => item.Name === "Amount").Value;
    const mpesaReceiptNumber = stkCallback.CallbackMetadata.Item.find((item: any) => item.Name === "MpesaReceiptNumber").Value;

    // Find pending payment
    const payment = await Payment.findOne({ reference: checkoutRequestID, status: "pending" });
    if (payment) {
      payment.status = "completed";
      payment.mpesaReceiptNumber = mpesaReceiptNumber;
      await payment.save();

      // Create contribution record
      const contribution = new Contribution({
        memberId: payment.memberId,
        amount: payment.amount,
        status: "completed",
        paymentReference: mpesaReceiptNumber,
      });
      await contribution.save();

      // Update user points
      const user = await User.findById(payment.memberId);
      if (user) {
        const pointsEarned = Math.floor(payment.amount / 10);
        user.points += pointsEarned;
        await user.save();

        const message = `Hello ${user.name},\n\nYour payment of KES ${payment.amount} has been received.\n\nM-Pesa Receipt: ${mpesaReceiptNumber}\nPoints Earned: ${pointsEarned}\nTotal Points: ${user.points}\n\nThank you for supporting your Chama.`;
        try {
          await whatsappService.sendMessage(user.phone, message);
        } catch (e) {
          console.error("Failed to send payment WhatsApp message:", e);
        }

        // Notify Admin
        await whatsappService.notifyAdminsViaWhatsApp(`Payment received from ${user.name}: KES ${payment.amount}\nReceipt: ${mpesaReceiptNumber}`);

        // Send real-time notifications
        sendNotification(user._id.toString(), {
          title: "Payment Successful",
          message: `Your payment of KES ${payment.amount} was received. Receipt: ${mpesaReceiptNumber}`,
          type: "success"
        });

        sendNotification(user._id.toString(), {
          title: "New Reward!",
          message: `You've earned ${pointsEarned} points! Total points: ${user.points}`,
          type: "reward"
        });

        sendPaymentSuccess(user._id.toString(), {
          amount: payment.amount,
          totalPoints: user.points,
          pointsEarned: pointsEarned
        });
      }
    }
  } else {
    console.log(`M-Pesa Payment Failed: ${stkCallback.ResultDesc}`);
    const checkoutRequestID = stkCallback.CheckoutRequestID;
    const payment = await Payment.findOne({ reference: checkoutRequestID });
    if (payment) {
      payment.status = "failed";
      await payment.save();
      
      sendNotification(payment.memberId.toString(), {
        title: "Payment Failed",
        message: `Your payment request was cancelled or failed: ${stkCallback.ResultDesc}`,
        type: "error"
      });
    }
  }

  res.json({ ResultCode: 0, ResultDesc: "Success" });
};
