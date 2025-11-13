// Vercel serverless function entry point
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from '../config/database.js';

// Import routes
import authRoutes from '../routes/auth.js';
import medicineRoutes from '../routes/medicines.js';
import prescriptionRoutes from '../routes/prescriptions.js';
import analyticsRoutes from '../routes/analytics.js';
import reorderRoutes from '../routes/reorders.js';
import chatRoutes from '../routes/chat.js';

// Load environment variables
dotenv.config();

const app = express();

// Handle preflight requests FIRST (before CORS middleware)
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS, PUT');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.sendStatus(204);
});

// CORS configuration for Vercel
let corsOrigins = '*'; // Default to allow all

if (process.env.CORS_ORIGINS) {
  if (process.env.CORS_ORIGINS === '*') {
    corsOrigins = '*';
  } else {
    corsOrigins = process.env.CORS_ORIGINS.split(',').map(origin => origin.trim());
    // Always include localhost for development
    if (!corsOrigins.includes('http://localhost:3000')) {
      corsOrigins.push('http://localhost:3000');
    }
    if (!corsOrigins.includes('http://127.0.0.1:3000')) {
      corsOrigins.push('http://127.0.0.1:3000');
    }
  }
} else {
  // Default origins for development
  corsOrigins = [
    'https://se-frontend-lyart.vercel.app',
    'http://localhost:3000', 
    'http://127.0.0.1:3000'
  ];
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (corsOrigins === '*' || corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root route
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Pharmaventory API is running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      medicines: '/api/medicines',
      prescriptions: '/api/prescriptions',
      analytics: '/api/analytics',
      reorders: '/api/reorders',
      chat: '/api/chat'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Pharmaventory API is running' });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Pharmaventory API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      medicines: '/api/medicines',
      prescriptions: '/api/prescriptions',
      analytics: '/api/analytics',
      reorders: '/api/reorders',
      chat: '/api/chat'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
console.log('✓ Auth routes registered: /api/auth/register, /api/auth/login, /api/auth/me');
app.use('/api/medicines', medicineRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reorders', reorderRoutes);
app.use('/api/chat', chatRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  
  res.status(status).json({
    detail: process.env.NODE_ENV === 'production' && status === 500 
      ? 'Internal server error' 
      : message
  });
});

// 404 handler (must be last)
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    detail: 'Route not found',
    method: req.method,
    path: req.path
  });
});

// Connect to MongoDB on cold start
let isConnected = false;
let connectionPromise = null;

async function ensureConnection() {
  // Check if already connected
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }
  
  // If connection is in progress, wait for it
  if (connectionPromise) {
    return connectionPromise;
  }
  
  // Start new connection
  connectionPromise = connectDB()
    .then(() => {
      isConnected = true;
      console.log('MongoDB connected (serverless)');
      return true;
    })
    .catch((error) => {
      console.error('MongoDB connection error:', error);
      connectionPromise = null;
      isConnected = false;
      // Don't throw, let requests continue (might retry later)
      return false;
    });
  
  return connectionPromise;
}

// Vercel serverless handler
// For Vercel, we need to properly handle the Express app
export default async function handler(req, res) {
  // Ensure MongoDB connection (non-blocking, don't await)
  ensureConnection().catch(err => {
    console.error('MongoDB connection error in handler:', err);
  });
  
  // Return a promise that resolves when Express finishes
  return new Promise((resolve) => {
    // Express will handle req/res
    app(req, res);
    
    // Wait for response to finish
    res.on('finish', () => {
      resolve();
    });
    
    // Also resolve on close (in case finish doesn't fire)
    res.on('close', () => {
      resolve();
    });
  });
}

