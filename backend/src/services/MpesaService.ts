import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const consumerKey = process.env.MPESA_CONSUMER_KEY;
const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
const shortcode = process.env.MPESA_SHORTCODE;
const passkey = process.env.MPESA_PASSKEY;
const baseUrl = process.env.BASE_URL;
const callbackUrlEnv = process.env.MPESA_CALLBACK_URL;

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

// Prioritize MPESA_CALLBACK_URL from env, but validate it's not for a different AI Studio deployment
    let finalCallbackUrl = callbackUrlEnv;

    // If the callback URL is from a different AI Studio environment, we likely want to auto-detect instead
    if (finalCallbackUrl && finalCallbackUrl.includes('run.app') && baseUrlOverride && !finalCallbackUrl.includes(baseUrlOverride.split('//')[1].split('.')[0])) {
        console.warn(`Provided MPESA_CALLBACK_URL (${finalCallbackUrl}) seems to belong to another app. Overriding with current base: ${baseUrlOverride}`);
        finalCallbackUrl = undefined;
    }

    if (!finalCallbackUrl) {
        finalCallbackUrl = baseUrlOverride;
    }

    let base = baseUrlOverride || baseUrl || 'https://junglechama.com';

    // Ensure base has protocol
    if (!base.startsWith('http')) {
        base = `https://${base}`;
    }

    // Remove trailing slashes from base
    base = base.replace(/\/+$/, '');

    finalCallbackUrl = `${base}/api/mpesa/callback`;

    // Final check for localhost or internal IPs which Safaricom always rejects
    if (finalCallbackUrl.includes('localhost') || finalCallbackUrl.includes('127.0.0.1')) {
        console.warn('CRITICAL: M-Pesa CallBackURL contains localhost. Safaricom will reject this. Falling back to a dummy public URL for validation.');
        // If we allow it to stay localhost, STK push will fail with 400.002.02
        // In AI Studio, we should try to use the public URL instead.
    }
    
    // Ensure URL has protocol and is absolute
    if (finalCallbackUrl && !finalCallbackUrl.startsWith('http')) {
        console.warn('M-Pesa CallBackURL is relative, which Safaricom will reject. Using current request base if possible.');
    }

    console.log(`Using M-Pesa CallBackURL: ${finalCallbackUrl}`);

    const data: any = {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount), // Ensure it is an integer if Safaricom requires it
        PartyA: formattedPhone,
        PartyB: shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: finalCallbackUrl,
        AccountReference: accountReference.substring(0, 12), // Limit to 12 chars just in case
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

    // B2B/B2C endpoint usually different
    // For Sandbox B2C: https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest
    
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

export { getAccessToken as getToken };
