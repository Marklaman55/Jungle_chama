# Jungle Chama Deployment Guide

## Folder Structure
```
.
├── .git/
├── .kilo/
├── backend/          # Express.js API for Render
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   └── .gitignore
├── frontend/         # React Vite app for Vercel
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── vercel.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── render.yaml       # Render deployment config (at root)
```

## Backend (Render.com)

1. Create Web Service in Render
2. Set **Root Directory**: `backend` in Render settings
3. Add environment secrets in Render Dashboard:
   - `MONGO_URI`, `JWT_SECRET`, `MPESA_*`, `EMAIL_*`, `CLOUDINARY_*`
4. Build Command: `npm install && npm run build`
5. Start Command: `npm start`
6. Port: Render auto-sets `PORT` env variable

**Note:** WhatsApp service is disabled by default on Render (`ENABLE_WHATSAPP=false`)

## Frontend (Vercel)

1. Create Project in Vercel
2. Set **Root Directory**: `frontend`
3. Add environment variable:
   - `VITE_APP_BASE_URL` = Your Render backend URL (e.g., `https://jungle-chama-backend.onrender.com`)
4. Framework: Vite (auto-detected)
5. Build: `npm run build`
6. Output: `dist`

## Default Credentials
- Email: `admin@junglechama.com`
- Password: `Admin@Jungle2024`

## Troubleshooting

**Render Build Issues:**
- Ensure all required secrets are set in Render dashboard
- Check that MongoDB connection string is correct
- If TypeScript fails, check `tsconfig.json` is valid

**Vercel Issues:**
- Verify `VITE_APP_BASE_URL` is set correctly
- Check browser dev tools for CORS errors
- Ensure backend allows your Vercel domain in CORS