// backend/routes/authRoutes.mjs
import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.mjs';
import { signToken, verifyToken } from '../utils/jwt.mjs';

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  const { username, password, email } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ 
      username, 
      password: hashedPassword, 
      email,
      role: 'user' // Default role
    });
    
    // Remove password from response
    const userResponse = { ...newUser.get() };
    delete userResponse.password;
    
    res.status(201).json({ message: 'User registered successfully.', user: userResponse });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Log in an existing user
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Create JWT token with consistent payload
    const token = signToken({ 
      userId: user.id, 
      role: user.role 
    });

    // Remove password from response
    const userResponse = { ...user.get() };
    delete userResponse.password;

    res.status(200).json({ 
      token, 
      user: userResponse,
      expiresIn: process.env.JWT_EXPIRES_IN || '3h'
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Validate token
router.get('/validate-token', async (req, res) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided.' });
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    
    // Handle both id and userId fields for compatibility
    const userId = decoded.userId || decoded.id;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    // Remove password from response
    const userResponse = { ...user.get() };
    delete userResponse.password;
    
    res.status(200).json({ user: userResponse });
  } catch (error) {
    console.error('Error validating token:', error);
    res.status(401).json({ message: 'Invalid token.' });
  }
});

export default router;