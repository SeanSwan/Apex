// backend/routes/authRoutes.mjs
import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/user.mjs'; // Matches the actual filename (lowercase)
import { signToken, verifyToken } from '../utils/jwt.mjs';

const router = express.Router();

// Enhanced debugging function - helps identify issues
const debug = (message, data = null) => {
  console.log(`[AUTH ${new Date().toISOString()}] ${message}`, data ? data : '');
};

// Register a new user
router.post('/register', async (req, res) => {
  debug('Register request received', { body: req.body });
  const { username, password, email, first_name, last_name } = req.body;

  try {
    // Validate required fields
    if (!username || !password || !first_name || !last_name) {
      debug('Registration failed - missing required fields', { 
        username: !!username, 
        password: !!password, 
        first_name: !!first_name, 
        last_name: !!last_name 
      });
      return res.status(400).json({ message: 'Username, password, first name and last name are required.' });
    }

    // Check if username already exists
    debug('Checking if username exists', { username });
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      debug('Registration failed - username exists', { username });
      return res.status(409).json({ message: 'Username already exists.' });
    }

    // Email validation if provided
    if (email) {
      debug('Checking if email exists', { email });
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        debug('Registration failed - email exists', { email });
        return res.status(409).json({ message: 'Email already in use.' });
      }
    }

    // Create new user
    debug('Creating new user', { username, email, first_name, last_name });
    const newUser = await User.create({ 
      username, 
      password, // Model hook will handle hashing
      email,
      first_name,
      last_name,
      role: 'user', // Default role
      is_active: true, // Ensure the account is active
      status: 'active'
    });
    
    debug('User created successfully', { id: newUser.id, username: newUser.username });
    
    // Remove sensitive data from response
    const userResponse = newUser.toJSON();
    
    res.status(201).json({ 
      message: 'User registered successfully.', 
      user: userResponse 
    });
  } catch (error) {
    console.error('Error registering user:', error);
    debug('Registration error', { 
      message: error.message, 
      stack: error.stack,
      name: error.name
    });

    // More detailed error response for debugging
    res.status(500).json({ 
      message: 'Server error during registration.',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : undefined
    });
  }
});

// Log in an existing user
router.post('/login', async (req, res) => {
  debug('Login request received', { body: req.body });
  const { username, password } = req.body;

  try {
    // Input validation
    if (!username || !password) {
      debug('Login failed - missing credentials', { 
        username: !!username, 
        password: !!password 
      });
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    // Determine search type (username or email)
    const isEmail = username.includes('@');
    const searchQuery = isEmail ? { email: username } : { username };
    
    debug('Searching for user', searchQuery);
    
    // Try to find the user
    let user;
    try {
      user = await User.findOne({ where: searchQuery });
      debug('Database query completed', { found: !!user });
    } catch (dbError) {
      debug('Database error during user lookup', { 
        error: dbError.message, 
        stack: dbError.stack 
      });
      throw dbError; // Re-throw to be caught by outer try/catch
    }
    
    if (!user) {
      debug('Login failed - user not found', { searchQuery });
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    debug('User found', { 
      id: user.id, 
      username: user.username, 
      role: user.role,
      is_active: user.is_active,
      account_locked: user.account_locked
    });

    // Check account status
    if (!user.is_active) {
      debug('Login failed - inactive account', { username: user.username });
      return res.status(403).json({ message: 'Account is inactive. Please contact support.' });
    }

    // Check if account is locked
    if (user.account_locked) {
      // Check if lock period has expired
      if (user.account_locked_until && new Date() < new Date(user.account_locked_until)) {
        debug('Login failed - account locked', { 
          username: user.username, 
          locked_until: user.account_locked_until 
        });
        return res.status(403).json({ 
          message: 'Account is temporarily locked. Please try again later or reset your password.' 
        });
      } else {
        // Unlock account if lock period has passed
        debug('Unlocking previously locked account', { username: user.username });
        await user.update({ 
          account_locked: false, 
          account_locked_until: null,
          failed_login_attempts: 0
        });
      }
    }

    // Verify password - wrap in try/catch to handle potential bcrypt errors
    let isMatch = false;
    try {
      debug('Comparing passwords');
      // First check if user.comparePassword method exists
      if (typeof user.comparePassword === 'function') {
        isMatch = await user.comparePassword(password);
      } else {
        // Fallback to direct bcrypt comparison if method doesn't exist
        debug('comparePassword method not found, using direct bcrypt comparison');
        isMatch = await bcrypt.compare(password, user.password);
      }
      debug('Password match result', isMatch);
    } catch (passwordError) {
      debug('Error during password comparison', { 
        error: passwordError.message, 
        stack: passwordError.stack 
      });
      throw passwordError; // Re-throw to be caught by outer try/catch
    }
    
    if (!isMatch) {
      debug('Login failed - invalid password', { username: user.username });
      
      // Increment failed login attempts
      const failedAttempts = (user.failed_login_attempts || 0) + 1;
      const updates = { failed_login_attempts: failedAttempts };
      
      // Lock account after 5 failed attempts
      if (failedAttempts >= 5) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + 30); // Lock for 30 minutes
        
        Object.assign(updates, {
          account_locked: true,
          account_locked_until: lockUntil
        });
        
        debug('Locking account due to too many failed attempts', { 
          username: user.username, 
          failedAttempts, 
          lockedUntil: lockUntil 
        });
      } else {
        debug('Incrementing failed login attempts', { 
          username: user.username, 
          failedAttempts 
        });
      }
      
      // Update the user record
      try {
        await user.update(updates);
      } catch (updateError) {
        debug('Error updating failed login attempts', { 
          error: updateError.message 
        });
        // Continue execution - this is not critical
      }
      
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Reset failed login attempts on successful login
    if (user.failed_login_attempts > 0) {
      debug('Resetting failed login attempts', { username: user.username });
      try {
        await user.update({ 
          failed_login_attempts: 0,
          account_locked: false,
          account_locked_until: null
        });
      } catch (resetError) {
        debug('Error resetting login attempts', { error: resetError.message });
        // Continue execution - this is not critical
      }
    }

    // Update last login time
    try {
      debug('Updating last login time', { username: user.username });
      await user.update({ 
        last_login: new Date(),
        last_active: new Date()
      });
    } catch (updateTimeError) {
      debug('Error updating last login time', { error: updateTimeError.message });
      // Continue execution - this is not critical
    }

    // Create JWT token with consistent payload
    debug('Generating token');
    const tokenPayload = { 
      userId: user.id, 
      role: user.role 
    };
    
    debug('Token payload', tokenPayload);
    let token;
    try {
      token = signToken(tokenPayload);
      debug('Token generated successfully');
    } catch (tokenError) {
      debug('Error generating token', { 
        error: tokenError.message,
        stack: tokenError.stack 
      });
      throw tokenError; // Re-throw to be caught by outer try/catch
    }

    // Final response
    const userResponse = user.toJSON(); // Password should be removed by toJSON method
    
    debug('Login successful', { 
      userId: user.id, 
      username: user.username 
    });

    res.status(200).json({ 
      token, 
      user: userResponse,
      expiresIn: process.env.JWT_EXPIRES_IN || '3h'
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    debug('Login error', { 
      message: error.message, 
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({ 
      message: 'Server error during login.',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : undefined
    });
  }
});

// Validate token
router.get('/validate-token', async (req, res) => {
  debug('Token validation request received');
  const token = req.header('Authorization')?.split(' ')[1];
  
  if (!token) {
    debug('Token validation failed - no token provided');
    return res.status(401).json({ message: 'No token provided.' });
  }

  try {
    debug('Verifying token');
    const decoded = verifyToken(token);
    if (!decoded) {
      debug('Token validation failed - invalid token');
      return res.status(401).json({ message: 'Invalid token.' });
    }
    
    debug('Token verified', decoded);
    
    // Handle both id and userId fields for compatibility
    const userId = decoded.userId || decoded.id;
    
    debug('Looking up user', { userId });
    const user = await User.findByPk(userId);
    
    if (!user) {
      debug('Token validation failed - user not found', { userId });
      return res.status(404).json({ message: 'User not found.' });
    }
    
    // Check if account is still active
    if (!user.is_active) {
      debug('Token validation failed - inactive account', { userId });
      return res.status(403).json({ message: 'Account is inactive.' });
    }
    
    // Update last active timestamp
    debug('Updating last active time', { userId });
    await user.update({ last_active: new Date() });
    
    // User data should already have password removed via toJSON
    const userResponse = user.toJSON();
    
    debug('Token validation successful', { userId });
    res.status(200).json({ user: userResponse });
  } catch (error) {
    console.error('Error validating token:', error);
    debug('Token validation error', { 
      message: error.message, 
      stack: error.stack 
    });
    
    res.status(401).json({ 
      message: 'Invalid token.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  debug('Profile request received');
  const token = req.header('Authorization')?.split(' ')[1];
  
  if (!token) {
    debug('Profile request failed - no token');
    return res.status(401).json({ message: 'No token provided.' });
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      debug('Profile request failed - invalid token');
      return res.status(401).json({ message: 'Invalid token.' });
    }
    
    const userId = decoded.userId || decoded.id;
    debug('Getting profile for user', { userId });
    
    const user = await User.findByPk(userId);
    if (!user) {
      debug('Profile request failed - user not found', { userId });
      return res.status(404).json({ message: 'User not found.' });
    }
    
    // User data should already have password removed via toJSON
    const userResponse = user.toJSON();
    
    debug('Profile request successful', { userId });
    res.status(200).json({ user: userResponse });
  } catch (error) {
    console.error('Error fetching profile:', error);
    debug('Profile request error', { 
      message: error.message, 
      stack: error.stack 
    });
    
    res.status(500).json({ 
      message: 'Server error.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  debug('Profile update request received', { body: req.body });
  const token = req.header('Authorization')?.split(' ')[1];
  
  if (!token) {
    debug('Profile update failed - no token');
    return res.status(401).json({ message: 'No token provided.' });
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      debug('Profile update failed - invalid token');
      return res.status(401).json({ message: 'Invalid token.' });
    }
    
    const userId = decoded.userId || decoded.id;
    debug('Updating profile for user', { userId });
    
    const user = await User.findByPk(userId);
    if (!user) {
      debug('Profile update failed - user not found', { userId });
      return res.status(404).json({ message: 'User not found.' });
    }
    
    // Prevent updating sensitive fields
    const { 
      password, role, is_active, status, account_locked, 
      failed_login_attempts, ...allowedUpdates 
    } = req.body;
    
    debug('Applying profile updates', { 
      userId, 
      fields: Object.keys(allowedUpdates) 
    });
    
    // Update user with allowed fields
    await user.update(allowedUpdates);
    
    // User data should already have password removed via toJSON
    const userResponse = user.toJSON();
    
    debug('Profile update successful', { userId });
    res.status(200).json({ 
      message: 'Profile updated successfully', 
      user: userResponse 
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    debug('Profile update error', { 
      message: error.message, 
      stack: error.stack 
    });
    
    res.status(500).json({ 
      message: 'Server error.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Change password
router.post('/change-password', async (req, res) => {
  debug('Password change request received');
  const { currentPassword, newPassword } = req.body;
  const token = req.header('Authorization')?.split(' ')[1];
  
  if (!token) {
    debug('Password change failed - no token');
    return res.status(401).json({ message: 'No token provided.' });
  }
  
  if (!currentPassword || !newPassword) {
    debug('Password change failed - missing passwords');
    return res.status(400).json({ message: 'Current password and new password are required.' });
  }
  
  if (newPassword.length < 6) {
    debug('Password change failed - new password too short');
    return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      debug('Password change failed - invalid token');
      return res.status(401).json({ message: 'Invalid token.' });
    }
    
    const userId = decoded.userId || decoded.id;
    debug('Changing password for user', { userId });
    
    const user = await User.findByPk(userId);
    if (!user) {
      debug('Password change failed - user not found', { userId });
      return res.status(404).json({ message: 'User not found.' });
    }
    
    // Verify current password
    let isMatch = false;
    try {
      if (typeof user.comparePassword === 'function') {
        isMatch = await user.comparePassword(currentPassword);
      } else {
        isMatch = await bcrypt.compare(currentPassword, user.password);
      }
    } catch (passwordError) {
      debug('Error comparing passwords', { 
        error: passwordError.message 
      });
      throw passwordError;
    }
    
    if (!isMatch) {
      debug('Password change failed - current password incorrect', { userId });
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }
    
    // Update password
    debug('Updating password', { userId });
    await user.update({ password: newPassword });
    
    debug('Password change successful', { userId });
    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Error changing password:', error);
    debug('Password change error', { 
      message: error.message, 
      stack: error.stack 
    });
    
    res.status(500).json({ 
      message: 'Server error.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;