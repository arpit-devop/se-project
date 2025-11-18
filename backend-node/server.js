import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from './config/database.js';
import User from './models/User.js';

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

// Use FRONTEND_ORIGIN if set, otherwise use CORS_ORIGINS
if (process.env.FRONTEND_ORIGIN) {
  const frontendOrigin = process.env.FRONTEND_ORIGIN.replace(/\/+$/, ''); // Remove trailing slashes
  corsOrigins = [
    frontendOrigin,
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];
  console.log('✅ Using FRONTEND_ORIGIN:', frontendOrigin);
} else if (process.env.CORS_ORIGINS) {
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

// CORS middleware
const corsMiddleware = cors({
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
});

app.use(corsMiddleware);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path} - Body:`, req.body ? 'present' : 'empty');
  next();
});

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

// Direct auth endpoints (FIX for route not found) - MUST be before router
console.log('🔵 Registering POST /api/auth/login route...');
app.post('/api/auth/login', async (req, res) => {
  console.log('🟢 === LOGIN ROUTE HIT ===');
  console.log('🟢 Request body:', JSON.stringify(req.body));
  console.log('🟢 Request path:', req.path);
  console.log('🟢 Request method:', req.method);
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ detail: 'Email and password required' });
    }
    
    console.log('🔍 Looking for user:', email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ detail: 'Invalid credentials' });
    }
    
    console.log('🔍 Validating password...');
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log('❌ Invalid password');
      return res.status(401).json({ detail: 'Invalid credentials' });
    }
    
    console.log('✅ Password valid, generating token...');
    const token = jwt.sign(
      { sub: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('✅ Login successful');
    res.json({
      access_token: token,
      token_type: 'bearer',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ detail: error.message });
  }
});
console.log('✅ POST /api/auth/login route registered');

console.log('🔵 Registering POST /api/auth/register route...');
app.post('/api/auth/register', async (req, res) => {
  console.log('🟢 === REGISTER ROUTE HIT ===');
  console.log('🟢 Request body:', JSON.stringify(req.body));
  try {
    const { email, password, full_name, role = 'supplier' } = req.body;
    
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ detail: 'Email already registered' });
    }
    
    const user = new User({
      email,
      password,
      full_name,
      role
    });
    
    await user.save();
    
    const token = jwt.sign(
      { sub: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('✅ Registration successful');
    res.json({
      access_token: token,
      token_type: 'bearer',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({ detail: error.message });
  }
});
console.log('✅ POST /api/auth/register route registered');

// API Routes - Register /me endpoint from router
console.log('Registering API routes...');
// Only register /me endpoint from router, login/register are direct routes
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ detail: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.sub });
    
    if (!user) {
      return res.status(401).json({ detail: 'User not found' });
    }
    
    res.json(user.toJSON());
  } catch (error) {
    res.status(401).json({ detail: 'Invalid token' });
  }
});
console.log('✓ Direct auth routes: POST /api/auth/login, POST /api/auth/register, GET /api/auth/me');

app.use('/api/medicines', medicineRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reorders', reorderRoutes);
app.use('/api/chat', chatRoutes);
console.log('✓ All API routes registered');

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

// Debug: Log all unmatched routes before 404
app.use((req, res, next) => {
  console.log(`⚠️  Unmatched route: ${req.method} ${req.path}`);
  console.log(`⚠️  Original URL: ${req.originalUrl}`);
  console.log(`⚠️  Query:`, req.query);
  next();
});

// 404 handler (must be last)
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  console.log(`❌ Full URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
  res.status(404).json({ 
    detail: 'Route not found',
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl
  });
});

// Start server
const startServer = async () => {
  try {
    // Try to connect to DB, but don't block server startup
    connectDB().catch(err => {
      console.error('Initial DB connection failed, will retry:', err.message);
    });
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Server running on http://0.0.0.0:${PORT}`);
      console.log(`✓ API available at http://0.0.0.0:${PORT}/api`);
      console.log(`✓ Health check: http://0.0.0.0:${PORT}/health`);
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
    // Don't exit in production/Railway, let it retry
    if (process.env.RAILWAY || process.env.NODE_ENV === 'production') {
      console.error('Will retry in 5 seconds...');
      setTimeout(() => startServer(), 5000);
    } else if (process.env.VERCEL) {
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



