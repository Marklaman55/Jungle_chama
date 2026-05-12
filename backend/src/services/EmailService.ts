import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { config } from '../config/env.js';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

export const sendOTPEmail = async (email: string, otp: string) => {
  const mailOptions = {
    from: `"Jungle Chama" <${config.email.user}>`,
    to: email,
    subject: 'Your Login Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00D100;">Your Verification Code</h2>
        <p>Your verification code is: <strong style="font-size: 24px;">${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
        <p><a href="https://jungle-chama.vercel.app/login" style="background: #00D100; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Go to Login</a></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send verification email.');
  }
};

export const sendResetEmail = async (email: string, otp: string) => {
  const mailOptions = {
    from: `"Jungle Chama" <${config.email.user}>`,
    to: email,
    subject: 'Your Password Reset Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00D100;">Password Reset Code</h2>
        <p>Your reset code is: <strong style="font-size: 24px;">${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
        <p><a href="https://jungle-chama.vercel.app/login" style="background: #00D100; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Go to Login</a></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending reset email:', error);
    throw new Error('Failed to send reset email.');
  }
};

export const sendWelcomeEmail = async (email: string, name: string) => {
  const mailOptions = {
    from: `"Jungle Chama" <${config.email.user}>`,
    to: email,
    subject: 'Welcome to Jungle Chama!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00D100;">Welcome ${name}!</h2>
        <p>Thank you for joining Jungle Chama. Start saving and earning rewards today!</p>
        <p><a href="https://jungle-chama.vercel.app/dashboard" style="background: #00D100; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Go to Dashboard</a></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};