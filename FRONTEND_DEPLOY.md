# Jungle Chama - Frontend Deployment (Vercel)

## Prerequisites
- Vercel account
- Backend deployed and accessible

## Setup Instructions

1. **Create new Project on Vercel**
   - Import your Git repository
   - Select the `frontend` folder as root directory

2. **Configure Environment Variables**
   Add in Vercel Dashboard > Settings > Environment Variables:
   
   | Name | Value |
   |------|-------|
   | `VITE_APP_BASE_URL` | Your backend URL (e.g., `https://jungle-chama-backend.onrender.com`) |

   Required for both Production and Preview: `true`

3. **Build Settings (Auto-detected)**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Deploy**
   - Vercel will automatically deploy on push to main branch

## Notes
- The frontend uses `VITE_APP_BASE_URL` for API calls
- Ensure backend CORS is configured to allow your Vercel domain
- Update `MPESA_CALLBACK_URL` in backend to use your Render URL