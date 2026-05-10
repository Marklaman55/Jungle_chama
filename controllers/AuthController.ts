import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import OTP from '../models/OTP';
import { sendOTPEmail, sendWelcomeEmail } from '../services/EmailService';
import { sendWhatsAppMessage } from '../services/WhatsAppService';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.password) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).json({ error: 'Invalid email or password.' });
        }
    } else {
        // Fallback for initial setup if no password set? 
        // Or handle it differently. Let's assume passwords are required.
        return res.status(401).json({ error: 'Login method not properly configured.' });
    }

    // Generate JWT directly
    const token = jwt.sign(
      { id: user._id, userId: user.userId, email: user.email, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '1d' }
    );

    res.json({ 
      message: 'Login successful', 
      token,
      user: {
        name: user.name,
        email: user.email,
        userId: user.userId,
        balance: user.balance,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  try {
    const otpRecord = await OTP.findOne({ email, isUsed: false });

    if (!otpRecord) {
      return res.status(400).json({ error: 'No active verification code found.' });
    }

    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({ error: 'Verification code expired.' });
    }

    if (otpRecord.attempts >= 5) {
      return res.status(403).json({ error: 'Too many attempts. Please request a new code.' });
    }

    const isMatch = await bcrypt.compare(otp, otpRecord.otp);
    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    // OTP valid
    otpRecord.isUsed = true;
    await otpRecord.save();

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Mark as verified
    user.isVerified = true;
    await user.save();

    // Generate JWT
    const token = jwt.sign({ id: user._id, userId: user.userId, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        name: user.name,
        email: user.email,
        userId: user.userId,
        balance: user.balance,
        role: user.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const register = async (req: Request, res: Response) => {
    const { name, email, password, phone } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'Email already registered.' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4().slice(0, 8).toUpperCase();

        const user = new User({
            name,
            email,
            password: hashedPassword,
            phone,
            userId,
        });

        await user.save();

        // Generate 6-digit OTP for registration verification
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otpCode, 10);
        const expiresAt = new Date(Date.now() + 10 * 60000); // 10 mins
        await new OTP({ email, otp: hashedOtp, expiresAt }).save();

        // Send OTP via WhatsApp
        if (phone) {
          await sendWhatsAppMessage(phone, `Welcome to Jungle Chama! Your verification code is: ${otpCode}`);
        }

        // Send Welcome Email
        await sendWelcomeEmail(email, name);

        res.status(201).json({ message: 'Registration initiated. Please verify your phone number.', email });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security, but in this app let's be descriptive
      return res.status(404).json({ error: 'User with this email does not exist.' });
    }

    // Generate 6-digit Reset OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otpCode, 10);

    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 mins for reset
    await OTP.deleteMany({ email });
    await new OTP({ email, otp: hashedOtp, expiresAt }).save();
 
    // Send via WhatsApp
    if (user.phone) {
      await sendWhatsAppMessage(user.phone, `Your Jungle Chama password reset code is: ${otpCode}. Valid for 10 minutes.`);
    }

    res.json({ message: 'Password reset code sent to your email.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  try {
    const otpRecord = await OTP.findOne({ email, isUsed: false });

    if (!otpRecord) {
      return res.status(400).json({ error: 'No active reset code found.' });
    }

    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({ error: 'Reset code expired.' });
    }

    const isMatch = await bcrypt.compare(otp, otpRecord.otp);
    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ error: 'Invalid reset code.' });
    }

    // Code valid, update password
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    otpRecord.isUsed = true;
    await otpRecord.save();

    res.json({ message: 'Password has been reset successfully. Please login with your new password.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
