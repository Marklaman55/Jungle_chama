import axios from 'axios';
import { config } from '../config/env.js';

const consumerKey = config.mpesa.consumerKey;
const consumerSecret = config.mpesa.consumerSecret;
const shortcode = config.mpesa.shortcode;
const passkey = config.mpesa.passkey;
const baseUrl = config.baseUrl;
const callbackUrlEnv = config.mpesa.callbackUrl;

export const getAccessToken = async () => {
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    try {
        const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
            headers: {
                Authorization: `Basic ${auth}`,
            },
        });
        return response.data.access_token;
    } catch (error: any) {
        console.error('Error getting M-Pesa token:', error.response?.data || error.message);
        throw error;
    }
};

export const getTimestamp = () => {
    const date = new Date();
    return date.getFullYear() +
        ('0' + (date.getMonth() + 1)).slice(-2) +
        ('0' + date.getDate()).slice(-2) +
        ('0' + date.getHours()).slice(-2) +
        ('0' + date.getMinutes()).slice(-2) +
        ('0' + date.getSeconds()).slice(-2);
};

export const formatPhone = (phone: string) => {
    let formatted = phone.replace('+', '').replace(/\s/g, '');
    if (formatted.startsWith('0')) {
        formatted = '254' + formatted.slice(1);
    } else if (formatted.startsWith('7') || formatted.startsWith('1')) {
        formatted = '254' + formatted;
    }
    return formatted;
};

export const initiateStkPush = async (phone: string, amount: number, accountReference: string, baseUrlOverride?: string) => {
    const token = await getAccessToken();
    const timestamp = getTimestamp();

    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
    const formattedPhone = formatPhone(phone);

    // Prioritize MPESA_CALLBACK_URL from env, but validate it's not for a different deployment
    let finalCallbackUrl = callbackUrlEnv;

    // If the callback URL is from a different environment, auto-detect instead
    if (finalCallbackUrl && finalCallbackUrl.includes('run.app') && baseUrlOverride && !finalCallbackUrl.includes(baseUrlOverride.split('//')[1].split('.')[0])) {
        console.warn(`Provided MPESA_CALLBACK_URL seems to belong to another app. Overriding with current base.`);
        finalCallbackUrl = null;
    }

    if (!finalCallbackUrl) {
        let base = baseUrlOverride || baseUrl || 'https://junglechama.com';
        if (!base.startsWith('http')) base = `https://${base}`;
        base = base.replace(/\/+$/, '');
        finalCallbackUrl = `${base}/api/mpesa/callback`;
    }

    if (finalCallbackUrl.includes('localhost') || finalCallbackUrl.includes('127.0.0.1')) {
        console.warn('CRITICAL: M-Pesa CallBackURL contains localhost. Safaricom will reject this.');
    }

    console.log(`Using M-Pesa CallBackURL: ${finalCallbackUrl}`);

    const data: any = {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        PartyA: formattedPhone,
        PartyB: shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: finalCallbackUrl,
        AccountReference: accountReference.substring(0, 12),
        TransactionDesc: 'Savings Deposit',
    };

    console.log('Sending STK Push Data to Safaricom:', JSON.stringify({ ...data, Password: '***' }, null, 2));

    try {
        const response = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            data, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error: any) {
        console.error('Error initiating STK push:', error.response?.data || error.message);
        throw error;
    }
};

export const initiateB2BPayout = async (phone: string, amount: number, remarks: string) => {
    const token = await getAccessToken();
    const formattedPhone = formatPhone(phone);

    const data = {
        InitiatorName: config.mpesa.initiatorName || "testapi",
        SecurityCredential: config.mpesa.securityCredential || "your_encoded_credential",
        CommandID: "BusinessPayment",
        Amount: amount,
        PartyA: shortcode,
        PartyB: formattedPhone,
        Remarks: remarks,
        QueueTimeOutURL: `${baseUrl}/api/payment/b2b-timeout`,
        ResultURL: `${baseUrl}/api/payment/b2b-result`,
        Occasion: "Payout"
    };

    try {
        const response = await axios.post('https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest',
            data, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error: any) {
        console.error('Error initiating B2B payout:', error.response?.data || error.message);
        throw error;
    }
};