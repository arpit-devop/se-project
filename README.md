# Pharmaventory

Full-stack pharmacy inventory management system built with **MERN Stack** (MongoDB, Express, React, Node.js).

## Requirements

- **Node.js 18+** (for both backend and frontend)
- **npm 10+**
- **MongoDB Atlas account** (or local MongoDB instance)

> **Note**: This is now a pure MERN stack application (MongoDB, Express, React, Node.js)

## Backend (Node.js + MongoDB)

```powershell
cd backend-node
npm install
npm start
```

**Requirements:**
- Node.js 18+
- MongoDB running on localhost:27017

Environment variables (see `backend-node/.env`):

- `MONGO_URL`: MongoDB connection string (default: `mongodb://localhost:27017`)
- `DB_NAME`: database name (default: `pharmaventory`)
- `JWT_SECRET`: JWT signing key (default provided)
- `CORS_ORIGINS`: allowed CORS origins (default: `http://localhost:3000`)

The API will be available at http://localhost:8000.

> **Old Python Backend**: The previous Python/FastAPI backend is still in the `backend/` folder but is no longer used.

## Frontend (React)

```powershell
cd frontend
npm install
npm start
```

This launches CRA dev server at http://localhost:3000 and proxies API calls to
`REACT_APP_BACKEND_URL` (defaults to http://localhost:8000). For production:

```powershell
npm run build
```

Outputs static assets to `frontend/build`.

## Running tests

- Backend tests: configure your preferred framework (pytest is installed, but
  there are no sample suites yet).
- Frontend tests: `npm test`

## Quick Start

1. **Update MongoDB password** in `backend-node/.env`
2. **Start backend**: `cd backend-node && npm start`
3. **Start frontend**: `cd frontend && npm start`

## Railway Deployment

1. Connect your GitHub repo to Railway
2. Set environment variables in Railway dashboard:
   - `MONGO_URL` - Your MongoDB Atlas connection string
   - `DB_NAME` - Database name (default: pharmaventory)
   - `JWT_SECRET` - Secret key for JWT tokens
   - `CORS_ORIGINS` - Allowed origins (e.g., your Railway frontend URL)
3. Railway will automatically detect and deploy the backend

## Notes

- Backend runs on port 8000 (or Railway assigned port)
- Frontend should be deployed separately or use Railway's static file serving
- MongoDB Atlas connection required

