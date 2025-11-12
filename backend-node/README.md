# Pharmaventory Backend - Node.js + MongoDB

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
PORT=8000
MONGO_URL=mongodb://localhost:27017
DB_NAME=pharmaventory
JWT_SECRET=pharma-secret-key-2025
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

3. Make sure MongoDB is running

4. Start the server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `GET /api/medicines` - Get all medicines
- `POST /api/medicines` - Create medicine
- `GET /api/medicines/:id` - Get medicine by ID
- `PATCH /api/medicines/:id` - Update medicine
- `DELETE /api/medicines/:id` - Delete medicine
- `GET /api/analytics/dashboard` - Get dashboard analytics
- `POST /api/prescriptions` - Create prescription
- `GET /api/prescriptions` - Get all prescriptions
- `POST /api/reorders` - Create reorder request
- `GET /api/reorders` - Get all reorders
- `POST /api/chat` - AI chat (placeholder)

All routes except `/api/auth/register` and `/api/auth/login` require authentication via Bearer token.

