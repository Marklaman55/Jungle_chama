# Jungle Chama Deployment Guide

## Folder Structure
```
.
├── .git/
├── .kilo/
├── backend/          # Express.js API for Render
│   ├── src/
│   ├── package.json
│   ├── render.yaml
│   └── tsconfig.json
└── frontend/         # React Vite app for Vercel
    ├── src/
    ├── package.json
    ├── vercel.json
    └── vite.config.ts
```

## Backend (Render.com)

1. Create Web Service in Render
2. Set root directory: `backend`
3. Add environment secrets:
   - `MONGO_URI`, `JWT_SECRET`, `MPESA_*`, `EMAIL_*`, `CLOUDINARY_*`
4. Build: `npm install && npm run build`
5. Start: `npm start`

## Frontend (Vercel)

1. Create Project in Vercel
2. Set root directory: `frontend`
3. Add environment variable:
   - `VITE_APP_BASE_URL` = Your Render backend URL
4. Build: `npm run build`
5. Output: `dist`

## Default Credentials
- Email: `admin@junglechama.com`
- Password: `Admin@Jungle2024`