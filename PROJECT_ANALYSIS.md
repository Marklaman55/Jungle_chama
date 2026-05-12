# Project Structure Analysis

## Overview
This is a full-stack React/Node.js application for Jungle Chama - a WhatsApp-integrated savings and rewards platform.

## Current Structure

### Backend (`backend/`)
- **Type**: Express.js REST API with TypeScript
- **Database**: MongoDB with Mongoose
- **Port**: 3000 (configurable via PORT env var)
- **Key Features**:
  - Authentication (JWT-based)
  - M-Pesa payment integration
  - WhatsApp integration via whatsapp-web.js
  - File uploads (multer + Cloudinary)
  - Email notifications (nodemailer)
  - Cron jobs for daily tasks

### Frontend (`frontend/`)
- **Type**: React 19 with TypeScript + Vite
- **Routing**: react-router-dom v7
- **State**: React Context (Auth, Cart)
- **UI**: Tailwind CSS + lucide-react icons
- **PWA**: vite-plugin-pwa enabled

## Deployment Configuration

### Backend (Render.com)
- Ready for deployment via `backend/render.yaml`
- Requires environment secrets (MongoDB, M-Pesa, Email, Cloudinary)
- Node.js build with TypeScript compilation

### Frontend (Vercel)
- Ready for deployment via `frontend/vercel.json`
- Requires `VITE_APP_BASE_URL` environment variable pointing to backend
- Vite build with PWA support

## Key Files Created/Updated
- `frontend/package.json` - Dependencies for Vercel deployment
- `frontend/vercel.json` - Vercel configuration
- `frontend/src/context/CartContext.tsx` - Added missing context file
- `frontend/src/App.tsx` - Added CartProvider wrapper
- `backend/render.yaml` - Updated with secret references
- `backend/tsconfig.json` - Updated for NodeNext module resolution

## API Routes
- `/api/auth` - Authentication (register, login, verify OTP)
- `/api/member` - Member operations
- `/api/admin` - Admin operations
- `/api/payment/mpesa` & `/api/mpesa` - M-Pesa payments
- `/api/webhook` - Webhook endpoints