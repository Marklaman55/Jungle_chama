import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { config } from '../config/env';

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
    from: `"Security Verification" <${config.email.user}>`,
    to: email,
    subject: 'Your Login Verification Code',
    html: `...`, // Email template preserved from original
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
    from: `"Security Verification" <${config.email.user}>`,
    to: email,
    subject: 'Your Password Reset Code',
    html: `...`,
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
    html: `...`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};