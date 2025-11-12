# Pharmaventory

Demo full-stack pharmacy inventory management sample. The backend is a **Node.js + Express + MongoDB** service. The frontend is a React single page app bootstrapped with Create React App + CRACO.

> **Note**: The backend has been migrated from Python/FastAPI to Node.js. See `MIGRATION_GUIDE.md` for details.

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

1. **Update MongoDB password** in `backend-node/.env` (replace `<db_password>`)
2. **Start backend**: `cd backend-node && npm start`
3. **Start frontend**: `cd frontend && npm start`

See `SETUP.md` for detailed instructions.

## Notes

- MongoDB Atlas connection is configured - just update your password in `.env`
- All API endpoints match the original structure (no frontend changes needed)
- AI features (prescription validation & chat) are placeholders and can be integrated later

