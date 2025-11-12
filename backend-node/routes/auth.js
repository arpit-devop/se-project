import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, role = 'supplier' } = req.body;

    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ detail: 'Email already registered' });
    }

    // Create user
    const user = new User({
      email,
      password, // Will be hashed by pre-save hook
      full_name,
      role
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { sub: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user without password
    const userObj = user.toJSON();

    res.json({
      access_token: token,
      token_type: 'bearer',
      user: userObj
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { sub: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userObj = user.toJSON();

    res.json({
      access_token: token,
      token_type: 'bearer',
      user: userObj
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ detail: error.message });
  }
});

// Get current user
router.get('/me', async (req, res) => {
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

export default router;

