import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { config } from '../config/env.js';
import { sendWhatsAppMessage } from './WhatsAppService.js';

// Lazy email transporter — only created when credentials are available
const getTransporter = () => {
  if (!config.email.user || !config.email.pass) {
    console.warn('[NotificationService] Email credentials missing. Skipping email.');
    return null;
  }
  return nodemailer.createTransport({
    service: config.email.service || 'gmail',
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });
};

// Twilio Configuration
const twilioClient = config.twilio?.accountSid && config.twilio?.authToken
  ? twilio(config.twilio.accountSid, config.twilio.authToken)
  : null;

export const sendEmailNotification = async (to: string, subject: string, text: string, html?: string) => {
  const transporter = getTransporter();
  if (!transporter) return;

  try {
    const mailOptions = {
      from: `"Jungle Chama" <${config.email.user}>`,
      to,
      subject,
      text,
      html: html || text,
    };
    await transporter.sendMail(mailOptions);
    console.log(`[NotificationService] Email sent to ${to}`);
  } catch (error) {
    console.error('[NotificationService] Error sending email:', error);
  }
};

export const sendSMSNotification = async (to: string, message: string) => {
  if (!twilioClient || !config.twilio?.phoneNumber) {
    console.warn('[NotificationService] Twilio credentials missing. Skipping SMS.');
    return;
  }

  try {
    const response = await twilioClient.messages.create({
      body: message,
      from: config.twilio.phoneNumber,
      to,
    });
    console.log('[NotificationService] SMS sent:', response.sid);
  } catch (error) {
    console.error('[NotificationService] Error sending SMS:', error);
  }
};

// --- Specialized Notification Wrappers ---

export const sendWelcomeNotifications = async (email: string, phone: string, name: string) => {
  const subject = 'Welcome to Jungle Chama!';
  const message = `Hello ${name}, welcome to the tribe! Your account has been successfully created. Start saving today and grow with your community.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #00D100; text-align: center;">Welcome to the Tribe!</h2>
      <p style="font-size: 16px; color: #555;">Hello ${name},</p>
      <p style="font-size: 16px; color: #555;">We are thrilled to have you join Jungle Chama. Your account has been successfully created.</p>
      <p style="font-size: 16px; color: #555;">Start saving today and grow with your community.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${config.baseUrl || 'https://junglechama.com'}/login" style="background-color: #00D100; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Your Dashboard</a>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #aaa; text-align: center;">
        &copy; ${new Date().getFullYear()} Jungle Chama. Modern Tribes.
      </p>
    </div>
  `;

  await sendEmailNotification(email, subject, message, html);
  await sendSMSNotification(phone, message);
  await sendWhatsAppMessage(phone, message);
};

export const sendPaymentConfirmation = async (email: string, phone: string, name: string, amount: number, newBalance: number) => {
  const subject = 'Payment Confirmation - Jungle Chama';
  const message = `Hello ${name}, your payment of ${amount} KES has been confirmed. Your new balance is ${newBalance} KES. Thank you for saving!`;

  await sendEmailNotification(email, subject, message);
  await sendSMSNotification(phone, message);
  await sendWhatsAppMessage(phone, message);
};

export const sendPayoutAlert = async (email: string, phone: string, name: string, amount: number) => {
  const subject = 'Congratulations! You Received a Payout';
  const message = `Hello ${name}, congratulations! You have received your cycle payout of ${amount} KES. The funds have been credited to your account/M-Pesa.`;

  await sendEmailNotification(email, subject, message);
  await sendSMSNotification(phone, message);
  await sendWhatsAppMessage(phone, message);
};

export const sendVerificationOTP = async (email: string, phone: string, otp: string) => {
  const subject = 'Your Jungle Chama Verification Code';
  const message = `Your verification code is: ${otp}. Valid for 10 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #333; text-align: center;">Security Verification</h2>
      <p style="font-size: 16px; color: #555;">Hello,</p>
      <p style="font-size: 16px; color: #555;">Your one-time password (OTP) for secure login/registration is:</p>
      <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000; border-radius: 5px; margin: 20px 0;">
        ${otp}
      </div>
      <p style="font-size: 14px; color: #888; text-align: center;">
        This code will expire in <strong>10 minutes</strong>.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #aaa; text-align: center;">
        &copy; ${new Date().getFullYear()} Jungle Chama. Securely Powered.
      </p>
    </div>
  `;

  await sendEmailNotification(email, subject, message, html);
  await sendSMSNotification(phone, message);
  await sendWhatsAppMessage(phone, message);
};