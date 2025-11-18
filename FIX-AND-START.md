# How to Start Pharmaventory on Localhost

## Quick Start (Easiest Method)

**Double-click:** `start-localhost.bat`

This will open 2 CMD windows - one for backend, one for frontend.

## Manual Start (If batch file doesn't work)

### Terminal 1 - Backend:
```powershell
cd backend-node
npm start
```

### Terminal 2 - Frontend:
```powershell
cd frontend
npm start
```

## What to Expect

1. **Backend Window:**
   - Should show: "✓ Server running on http://0.0.0.0:8000"
   - If you see MongoDB connection error, you need MongoDB running

2. **Frontend Window:**
   - Will show compilation progress
   - Wait for: "Compiled successfully!" or "webpack compiled"
   - First compile takes 30-60 seconds

3. **Open Browser:**
   - Go to: http://localhost:3000
   - You should see the login page

## Troubleshooting

### If frontend shows compilation errors:
- Check that all dependencies are installed: `cd frontend && npm install --legacy-peer-deps`
- Clear cache: Delete `frontend/node_modules/.cache` folder
- Restart the frontend server

### If backend shows MongoDB errors:
- Install MongoDB locally, OR
- Set `MONGO_URL` in `backend-node/.env` to your MongoDB Atlas connection string

### If ports are already in use:
- Close other applications using ports 8000 or 3000
- Or change ports in the configuration files

## Dependencies Status

All required packages are installed:
- ✓ sonner@2.0.3
- ✓ lucide-react@0.507.0
- ✓ recharts@3.4.1
- ✓ react-router-dom@6.30.1
- ✓ axios@1.13.2

