# Complete MERN Stack Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- Your MongoDB password

### Step 1: Update MongoDB Password

Edit `backend-node/.env` and replace `<db_password>` with your actual MongoDB Atlas password:

```env
MONGO_URL=mongodb+srv://arpitalwar:YOUR_PASSWORD_HERE@cluster0.9alz22c.mongodb.net/
```

### Step 2: Install Backend Dependencies

```powershell
cd backend-node
npm install
```

### Step 3: Install Frontend Dependencies

```powershell
cd ../frontend
npm install
```

### Step 4: Start Backend Server

```powershell
cd backend-node
npm start
```

The backend will run on `http://localhost:8000`

### Step 5: Start Frontend Server

Open a new terminal:

```powershell
cd frontend
npm start
```

The frontend will run on `http://localhost:3000` and open automatically in your browser.

## 📁 Project Structure

```
pharmaventory/
├── backend-node/          # Node.js + Express + MongoDB Backend
│   ├── config/           # Database configuration
│   ├── models/           # MongoDB models (User, Medicine, etc.)
│   ├── routes/           # API routes
│   ├── middleware/       # Authentication middleware
│   ├── server.js         # Main server file
│   └── .env              # Environment variables
├── frontend/              # React Frontend
│   ├── src/
│   ├── public/
│   └── .env              # Frontend environment variables
└── README.md
```

## 🔧 Configuration

### Backend (.env)
```env
PORT=8000
MONGO_URL=mongodb+srv://arpitalwar:YOUR_PASSWORD@cluster0.9alz22c.mongodb.net/
DB_NAME=pharmaventory
JWT_SECRET=pharma-secret-key-2025
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=http://localhost:8000
WDS_SOCKET_PORT=3000
```

## 🧪 Testing

1. **Backend Health Check:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Test Registration:**
   - Open http://localhost:3000
   - Click "Switch to register"
   - Fill in the form and create an account

3. **Test Login:**
   - Use the credentials you just created
   - You should be redirected to the dashboard

## 🐛 Troubleshooting

### MongoDB Connection Error
- Verify your password in `backend-node/.env`
- Check MongoDB Atlas Network Access (whitelist your IP or use 0.0.0.0/0)
- Ensure database user has proper permissions

### CORS Errors
- Make sure backend is running on port 8000
- Check `CORS_ORIGINS` in backend `.env` includes `http://localhost:3000`

### Frontend Not Connecting
- Verify `REACT_APP_BACKEND_URL=http://localhost:8000` in frontend `.env`
- Restart frontend server after changing `.env`

## 📝 API Endpoints

All endpoints are prefixed with `/api`:

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `GET /api/medicines` - Get all medicines
- `POST /api/medicines` - Create medicine
- `PATCH /api/medicines/:id` - Update medicine
- `DELETE /api/medicines/:id` - Delete medicine
- `GET /api/analytics/dashboard` - Get dashboard analytics
- `POST /api/prescriptions` - Create prescription
- `GET /api/prescriptions` - Get all prescriptions
- `POST /api/reorders` - Create reorder request

## ✅ Everything Should Work Now!

The MERN stack is fully configured and ready to use.

