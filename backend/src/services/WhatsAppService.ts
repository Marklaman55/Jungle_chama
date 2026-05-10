import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import QRCode from 'qrcode';
import path from 'path';
import os from 'os';

let qrCodeData: string | null = null;
let isReady = false;

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: path.join(os.tmpdir(), '.wwebjs_auth')
    }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
});

client.on('qr', (qr) => {
    console.log('QR RECEIVED (Check Admin Panel)');
    QRCode.toDataURL(qr, (err, url) => {
        qrCodeData = url;
    });
});

client.on('ready', () => {
    console.log('Client is ready!');
    isReady = true;
    qrCodeData = null;
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
    isReady = false;
});

export const initWhatsApp = async () => {
    try {
        await client.initialize();
    } catch (error: any) {
        if (error.message && error.message.includes('The browser is already running')) {
            console.warn('WhatsApp browser already running. Attempting to recover...');
        } else {
            console.error('Failed to initialize WhatsApp:', error);
        }
    }
};

export const getWhatsAppQR = () => {
    return { qr: qrCodeData, isReady };
};

export const sendWhatsAppMessage = async (phone: string, message: string) => {
    try {
        if (!isReady) {
            console.log('WhatsApp client not ready');
            return;
        }
        const formattedPhone = phone.replace('+', '').replace('whatsapp:', '') + '@c.us';
        await client.sendMessage(formattedPhone, message);
        console.log(`Message sent to ${phone}`);
    } catch (error) {
        console.error(`Error sending message to ${phone}:`, error);
    }
};

export { client };