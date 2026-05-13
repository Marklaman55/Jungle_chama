import { Request, Response } from 'express';
import { initiateStkPush, initiateB2BPayout } from '../services/MpesaService.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import SystemConfig from '../models/SystemConfig.js';
import { v4 as uuidv4 } from 'uuid';
import { sendPaymentConfirmation } from '../services/NotificationService.js';

export const triggerStkPush = async (req: Request, res: Response) => {
    const { phone, amount, userId } = req.body;

    if (!phone || !amount || !userId) {
        return res.status(400).json({ error: 'Phone, amount, and userId are required.' });
    }

    const amt = Number(amount);
    if (amt <= 0) {
        return res.status(400).json({ error: 'Savings amount must be greater than 0 KES.' });
    }

    try {
        console.log('Request Headers for STK Push (Member):', JSON.stringify(req.headers, null, 2));
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const currentBaseUrl = `${protocol}://${host}`;

        const response = await initiateStkPush(phone, amount, userId, currentBaseUrl);

        const transaction = new Transaction({
            userId: userId,
            amount: amount,
            transactionId: response.CheckoutRequestID || `MEM-${Date.now()}`,
            mpesa_checkout_id: response.CheckoutRequestID,
            type: 'deposit',
            status: 'pending',
            description: 'Member initiated STK Push',
            date: new Date()
        });
        await transaction.save();

        res.status(200).json(response);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const processB2BPayout = async (req: Request, res: Response) => {
    try {
        const config = await SystemConfig.findOne();
        if (!config || config.cycleOrder.length === 0) {
            return res.status(400).json({ error: 'No cycle order defined.' });
        }

        const nextUserId = config.cycleOrder[config.currentIndex];
        const user = await User.findOne({ userId: nextUserId });

        if (!user) {
            return res.status(404).json({ error: 'User not found in cycle.' });
        }

        const payoutAmount = 5000;

        const response = await initiateB2BPayout(user.phone, payoutAmount, `Cycle Payout for ${user.name}`);

        res.status(200).json({ message: 'B2B Payout initiated', response });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const handleB2BResult = async (req: Request, res: Response) => {
    console.log('B2B Result Received:', JSON.stringify(req.body));
    const result = req.body.Result;

    if (result.ResultCode === 0) {
        const config = await SystemConfig.findOne();
        if (config) {
            config.currentIndex = (config.currentIndex + 1) % config.cycleOrder.length;
            await config.save();
        }
    }

    res.status(200).send('OK');
};

export const handleB2BTimeout = async (req: Request, res: Response) => {
    console.warn('B2B Timeout Received:', JSON.stringify(req.body));
    res.status(200).send('OK');
};

export const handleMpesaCallback = async (req: Request, res: Response) => {
    const callbackData = req.body.Body.stkCallback;
    console.log('M-Pesa Callback Received:', JSON.stringify(callbackData));

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callbackData;

    try {
        const transaction = await Transaction.findOne({ mpesa_checkout_id: CheckoutRequestID });

        if (ResultCode === 0) {
            const metadata = CallbackMetadata?.Item || [];
            const amountItem = metadata.find((item: any) => item.Name === 'Amount');
            const receiptItem = metadata.find((item: any) => item.Name === 'MpesaReceiptNumber');
            const phoneItem = metadata.find((item: any) => item.Name === 'PhoneNumber');

            const amount = amountItem ? amountItem.Value : 0;
            const mpesaReceiptNumber = receiptItem ? receiptItem.Value : `AUTO-${Date.now()}`;
            const phone = phoneItem ? phoneItem.Value : '';

            let user;
            if (transaction) {
                user = await User.findOne({ userId: transaction.userId });
            } else if (phone) {
                user = await User.findOne({ phone: new RegExp(phone.toString().slice(-9)) });
            }

            if (user) {
                const numAmount = Number(amount);
                user.balance += numAmount;
                user.carryForward += numAmount;
                await user.save();

                if (transaction) {
                    transaction.status = 'completed';
                    transaction.transactionId = mpesaReceiptNumber;
                    transaction.amount = numAmount;
                    transaction.date = new Date();
                    await transaction.save();
                } else {
                    const newTransaction = new Transaction({
                        userId: user.userId,
                        amount: numAmount,
                        transactionId: mpesaReceiptNumber,
                        type: 'deposit',
                        status: 'completed',
                        date: new Date(),
                        description: 'M-Pesa Deposit (Auto-recovered)'
                    });
                    await newTransaction.save();
                }

                await sendPaymentConfirmation(user.email, user.phone, user.name, numAmount, user.balance);
            }
        } else {
            console.log(`Payment failed: ${ResultDesc}`);
            if (transaction) {
                transaction.status = 'failed';
                transaction.description = ResultDesc;
                await transaction.save();
            }
        }
    } catch (error) {
        console.error('Error in M-Pesa callback handling:', error);
    }

    res.status(200).send('OK');
};