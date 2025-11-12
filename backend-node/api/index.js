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

// CORS configuration for Vercel
const corsOrigins = process.env.CORS_ORIGINS === '*' 
  ? '*' 
  : (process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://127.0.0.1:3000']);

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
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

// API Routes
app.use('/api/auth', authRoutes);
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ detail: 'Route not found' });
});

// Connect to MongoDB on cold start
let isConnected = false;
let connectionPromise = null;

async function ensureConnection() {
  if (isConnected) {
    return;
  }
  
  if (connectionPromise) {
    return connectionPromise;
  }
  
  connectionPromise = connectDB()
    .then(() => {
      isConnected = true;
      console.log('MongoDB connected (serverless)');
    })
    .catch((error) => {
      console.error('MongoDB connection error:', error);
      connectionPromise = null;
      throw error;
    });
  
  return connectionPromise;
}

// Vercel serverless handler
export default async function handler(req, res) {
  try {
    // Ensure MongoDB connection
    await ensureConnection();
    
    // Handle the request
    return app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ 
      detail: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

