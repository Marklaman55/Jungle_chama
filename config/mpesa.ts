import dotenv from "dotenv";

dotenv.config();

export const mpesaConfig = {
  env: process.env.MPESA_ENV || "sandbox",
  consumerKey: process.env.MPESA_CONSUMER_KEY || "",
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || "",
  shortCode: process.env.MPESA_SHORTCODE || "174379",
  passKey: process.env.MPESA_PASSKEY || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
  callbackUrl: process.env.MPESA_CALLBACK_URL || "https://your-ngrok-url.ngrok-free.app/api/payments/mpesa/callback",
  baseUrl: process.env.MPESA_ENV === "production" 
    ? "https://api.safaricom.co.ke" 
    : "https://sandbox.safaricom.co.ke"
};
