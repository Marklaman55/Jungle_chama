# Jungle Chama - Backend Deployment (Render)

## Prerequisites
- Render account
- MongoDB Atlas database
- Environment secrets configured in Render

## Setup Instructions

1. **Create new Web Service on Render**
   - Connect your Git repository
   - Select the `backend` folder as root directory

2. **Configure Build Settings**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: Node.js

3. **Required Environment Secrets**
   Add these in Render Dashboard > Environment > Add Environment Secret:
   
   | Key | Description |
   |-----|-------------|
   | `MONGO_URI` | MongoDB connection string |
   | `JWT_SECRET` | JWT signing secret (use strong random string) |
   | `MPESA_CONSUMER_KEY` | M-Pesa Daraja consumer key |
   | `MPESA_CONSUMER_SECRET` | M-Pesa Daraja consumer secret |
   | `MPESA_SHORTCODE` | M-Pesa business shortcode |
   | `MPESA_PASSKEY` | M-Pesa passkey |
   | `MPESA_CALLBACK_URL` | Your Render URL + `/api/mpesa/callback` |
   | `EMAIL_USER` | Gmail address for SMTP |
   | `EMAIL_PASS` | Gmail app password |
   | `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
   | `CLOUDINARY_API_KEY` | Cloudinary API key |
   | `CLOUDINARY_API_SECRET` | Cloudinary API secret |

4. **After Deployment**
   - Default admin user created: `admin@junglechama.com` / `Admin@Jungle2024`
   - Change password immediately after first login