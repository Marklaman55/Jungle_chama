import axios from 'axios';
import dotenv from 'dotenv';
import { config } from '../config/env';

dotenv.config();

const consumerKey = config.mpesa.consumerKey;
const consumerSecret = config.mpesa.consumerSecret;
const shortcode = config.mpesa.shortcode;
const passkey = config.mpesa.passkey;
const baseUrl = config.baseUrl;

const useSandbox = config.mpesa.env !== 'production';

const MPESA_BASE = useSandbox
  ? 'https://sandbox.safaricom.co.ke'
  : 'https://api.safaricom.co.ke';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url: string, reqConfig: any, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.get(url, reqConfig);
    } catch (error: any) {
      if (i === retries - 1) throw error;
      console.warn(`M-Pesa request failed (attempt ${i + 1}/${retries}), retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  throw new Error('All retries failed');
};

const postWithRetry = async (url: string, data: any, reqConfig: any, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.post(url, data, reqConfig);
    } catch (error: any) {
      if (i === retries - 1) throw error;
      console.warn(`M-Pesa POST request failed (attempt ${i + 1}/${retries}), retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  throw new Error('All retries failed');
};

export const getAccessToken = async (): Promise<string> => {
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    try {
        const response = await fetchWithRetry(`${MPESA_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
            headers: {
                Authorization: `Basic ${auth}`,
            },
        });
        return response!.data.access_token;
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

    let finalCallbackUrl = config.mpesa.callbackUrl || '';
    
    if (finalCallbackUrl && finalCallbackUrl.includes('run.app') && baseUrlOverride && !finalCallbackUrl.includes(baseUrlOverride.split('//')[1].split('.')[0])) {
        console.warn(`Provided MPESA_CALLBACK_URL (${finalCallbackUrl}) seems to belong to another app. Overriding with current base: ${baseUrlOverride}`);
        finalCallbackUrl = '';
    }

    if (!finalCallbackUrl) {
        let base = baseUrlOverride || baseUrl || 'https://junglechama.com';
        if (!base.startsWith('http')) {
            base = `https://${base}`;
        }
        base = base.replace(/\/+$/, '');
        finalCallbackUrl = `${base}/api/mpesa/callback`;
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
        const response = await postWithRetry(`${MPESA_BASE}/mpesa/stkpush/v1/processrequest`, 
            data, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return response?.data || { error: 'No response' };
    } catch (error: any) {
        console.error('Error initiating STK push:', error.response?.data || error.message);
        throw error;
    }
};

export const initiateB2BPayout = async (phone: string, amount: number, remarks: string) => {
    const token = await getAccessToken();
    const formattedPhone = formatPhone(phone);

    const data = {
        InitiatorName: process.env.MPESA_INITIATOR_NAME || "testapi", 
        SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL || "your_encoded_credential",
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
        const response = await postWithRetry(`${MPESA_BASE}/mpesa/b2c/v1/paymentrequest`, 
            data, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response?.data || { error: 'No response' };
    } catch (error: any) {
        console.error('Error initiating B2B payout:', error.response?.data || error.message);
        throw error;
    }
};

export { getAccessToken as getToken };