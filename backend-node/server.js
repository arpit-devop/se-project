import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/database.js';

// Export for Vercel serverless


// Import routes
import authRoutes from './routes/auth.js';
import medicineRoutes from './routes/medicines.js';
import prescriptionRoutes from './routes/prescriptions.js';
import analyticsRoutes from './routes/analytics.js';
import reorderRoutes from './routes/reorders.js';
import chatRoutes from './routes/chat.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Railway provides PORT, use it
if (process.env.PORT) {
  console.log(`Using Railway provided PORT: ${PORT}`);
}

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

// Middleware
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

// Start server
const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Server running on http://0.0.0.0:${PORT}`);
      console.log(`✓ API available at http://0.0.0.0:${PORT}/api`);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      console.error('Server error:', error);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully...');
      server.close(() => {
        mongoose.connection.close();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    // Don't exit in serverless environments
    if (process.env.VERCEL) {
      console.error('Running in Vercel, will retry on next request');
    } else {
      process.exit(1);
    }
  }
};

// Export app for Vercel serverless
export default app;

// For regular Node.js server (Render, Railway, local)
if (!process.env.VERCEL) {
  startServer();
}



