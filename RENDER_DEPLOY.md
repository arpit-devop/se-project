# Render Deployment Guide

## ⚠️ IMPORTANT: Root Directory Setting

**The error shows Render is looking in wrong directory!**

### Error Analysis:
```
npm error path /opt/render/project/src/package.json
```
This means Render is NOT using `backend-node` as root directory.

## ✅ Fix in Render Dashboard:

1. **Go to your Render service**
2. **Click "Settings" tab**
3. **Find "Root Directory" field**
4. **Set it to:** `backend-node`
   - NOT: `src`
   - NOT: `.` (root)
   - NOT: `frontend`
   - **YES:** `backend-node`

5. **Build Command:** `npm install`
6. **Start Command:** `npm start`
7. **Environment:** `Node`

## Environment Variables:

Add these in Render Dashboard → Environment:

```
MONGO_URL=mongodb+srv://arpitsingh:arpit@cluster0.9alz22c.mongodb.net/
DB_NAME=pharmaventory
JWT_SECRET=pharma-secret-key-2025
CORS_ORIGINS=*
NODE_ENV=production
```

## After Setting Root Directory:

1. Click "Manual Deploy" → "Deploy latest commit"
2. Build should now find `backend-node/package.json`
3. Server will start successfully

## If Still Not Working:

1. Delete the service in Render
2. Create new Web Service
3. Connect GitHub repo
4. **IMMEDIATELY set Root Directory to `backend-node`**
5. Set build/start commands
6. Deploy

