import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/user.mjs';
import { signToken, verifyToken } from '../utils/jwt.mjs';
// --- Architectural Suggestion ---
// Consider moving the core logic (database interactions, password checks)
// into a dedicated `authController.mjs` or `authService.mjs`
// to keep this route file focused on request handling and routing.
// Example: import * as authController from '../controllers/authController.mjs';
// router.post('/login', authController.login);

const router = express.Router();
const BCRYPT_SALT_ROUNDS = 10; // Define salt rounds centrally if not already in config
const FAILED_LOGIN_LIMIT = 5; // Max failed attempts before lock
const ACCOUNT_LOCK_MINUTES = 30; // Duration of account lock

// Enhanced debugging function - checks NODE_ENV
const debug = (message, data = null) => {
  // Only log detailed data in development
  const logData = process.env.NODE_ENV === 'development' ? data : '';
  console.log(`[AUTH ${new Date().toISOString()}] ${message}`, logData);
};

// --- Middleware (Example - can be moved to dedicated middleware file) ---
// Basic validation middleware for request bodies
const validateRequest = (schema) => async (req, res, next) => {
  try {
    // Replace with a proper validation library like Joi or Zod for robust validation
    // This is a placeholder example
    if (schema.required) {
      for (const field of schema.required) {
        if (!req.body[field]) {
          debug(`Validation failed - missing field: ${field}`, { body: req.body });
          return res.status(400).json({ message: `Missing required field: ${field}` });
        }
      }
    }
    if (schema.emailField && req.body[schema.emailField]) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body[schema.emailField])) {
        debug(`Validation failed - invalid email format: ${req.body[schema.emailField]}`);
        return res.status(400).json({ message: 'Invalid email format.' });
      }
    }
    if (schema.passwordField && req.body[schema.passwordField] && req.body[schema.passwordField].length < 6) {
        debug('Validation failed - password too short');
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }
    next();
  } catch (error) {
    debug('Validation middleware error', { error: error.message });
    res.status(500).json({ message: 'Server error during request validation.' });
  }
};

// Basic Auth Middleware (can be expanded and moved)
const authenticateToken = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.split(' ')[1]; // Format: Bearer TOKEN

  if (!token) {
    debug('Authentication failed - no token provided');
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    debug('Verifying token in middleware');
    const decoded = verifyToken(token); // Uses the utility from jwt.mjs

    // --- Consistency: Use userId ---
    if (!decoded || !decoded.userId) {
        debug('Authentication failed - invalid token payload', decoded);
        return res.status(401).json({ message: 'Invalid token payload.' });
    }

    debug('Token verified, fetching user', { userId: decoded.userId });
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      debug('Authentication failed - user not found', { userId: decoded.userId });
      return res.status(401).json({ message: 'Invalid token. User not found.' });
    }

    if (!user.is_active) {
      debug('Authentication failed - inactive user', { userId: decoded.userId });
      return res.status(403).json({ message: 'Account is inactive.' });
    }

    // Attach user object (excluding password) to the request for later use
    req.user = user.toJSON();
    debug('Authentication successful, user attached to request', { userId: req.user.id });
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Token verification error in middleware:', error);
    debug('Authentication error', { message: error.message, name: error.name });

    let status = 401; // Default to Unauthorized
    let message = 'Invalid token.';
    if (error.name === 'TokenExpiredError') {
      message = 'Token has expired.';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Token is malformed.';
    } else {
      // For unexpected errors during verification
      status = 500;
      message = 'Server error during token validation.';
    }

    return res.status(status).json({
      message: message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// --- Routes ---

// Register a new user
router.post('/register', validateRequest({
  required: ['username', 'password', 'first_name', 'last_name'],
  emailField: 'email',
  passwordField: 'password'
}), async (req, res) => {
  debug('Register request processing', { body: req.body });
  const { username, password, email, first_name, last_name } = req.body;

  try {
    // Check if username already exists
    debug('Checking username existence', { username });
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      debug('Registration failed - username exists', { username });
      return res.status(409).json({ message: 'Username already exists.' }); // 409 Conflict
    }

    // Email validation if provided
    if (email) {
      debug('Checking email existence', { email });
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        debug('Registration failed - email exists', { email });
        return res.status(409).json({ message: 'Email already in use.' }); // 409 Conflict
      }
    }

    // Create new user
    // Password hashing is handled by the Sequelize model's beforeCreate hook (assumption)
    debug('Creating new user in DB', { username, email: email || 'N/A' });
    const newUser = await User.create({
      username,
      password, // Hook should hash this
      email: email || null, // Ensure null if not provided
      first_name,
      last_name,
      role: 'user', // --- Security: Sensible default role ---
      is_active: true, // New users are active by default
      status: 'active'
    });

    debug('User created successfully', { id: newUser.id, username: newUser.username });

    // Return user data (password should be excluded by model's toJSON)
    res.status(201).json({
      message: 'User registered successfully.',
      user: newUser.toJSON()
    });
  } catch (error) {
    console.error('Error registering user:', error);
    debug('Registration server error', { message: error.message, name: error.name });
    res.status(500).json({
      message: 'Server error during registration.',
      error: process.env.NODE_ENV === 'development' ? { message: error.message, name: error.name, stack: error.stack } : undefined
    });
  }
});

// Log in an existing user
router.post('/login', validateRequest({
  required: ['username', 'password']
}), async (req, res) => {
  debug('Login request processing', { body: req.body });
  const { username, password } = req.body;

  try {
    // Determine search type (username or email)
    const isEmail = username.includes('@');
    const searchQuery = isEmail ? { email: username } : { username };
    debug('Searching for user', searchQuery);

    // Find user (ensure sensitive fields are handled correctly by model)
    const user = await User.findOne({ where: searchQuery });

    if (!user) {
      debug('Login failed - user not found', { searchQuery });
      // --- Security: Generic error message ---
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    debug('User found', { id: user.id, username: user.username, role: user.role, is_active: user.is_active });

    // Check account status
    if (!user.is_active) {
      debug('Login failed - inactive account', { username: user.username });
      return res.status(403).json({ message: 'Account is inactive. Please contact support.' }); // 403 Forbidden
    }

    // Check if account is currently locked
    if (user.account_locked && user.account_locked_until && new Date() < new Date(user.account_locked_until)) {
      debug('Login failed - account locked', { username: user.username, locked_until: user.account_locked_until });
      const minutesRemaining = Math.ceil((new Date(user.account_locked_until) - new Date()) / 60000);
      return res.status(403).json({ // 403 Forbidden
        message: `Account is temporarily locked due to too many failed login attempts. Please try again in ${minutesRemaining} minute(s) or reset your password.`
      });
    }

    // Verify password
    debug('Comparing passwords', { userId: user.id });
    let isMatch = false;
    try {
      // Prefer model method if it exists (might handle different hashing strategies)
      if (typeof user.comparePassword === 'function') {
        isMatch = await user.comparePassword(password);
      } else {
        // Fallback if comparePassword method is missing
        debug('comparePassword method not found on user model, using direct bcrypt.compare');
        isMatch = await bcrypt.compare(password, user.password);
      }
      debug('Password match result', { isMatch });
    } catch (passwordError) {
      // Handle errors during the comparison itself (e.g., bcrypt issues)
      console.error('Error during password comparison:', passwordError);
      debug('Password comparison error', { userId: user.id, message: passwordError.message });
      // Don't expose internal errors, treat as a server error
      return res.status(500).json({ message: 'Server error during login process.' });
    }


    if (!isMatch) {
      debug('Login failed - invalid password', { userId: user.id });
      // --- Security: Handle failed login attempts ---
      const failedAttempts = (user.failed_login_attempts || 0) + 1;
      const updates = { failed_login_attempts: failedAttempts };

      if (failedAttempts >= FAILED_LOGIN_LIMIT) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + ACCOUNT_LOCK_MINUTES);
        updates.account_locked = true;
        updates.account_locked_until = lockUntil;
        debug('Locking account', { userId: user.id, failedAttempts, lockUntil });
      } else {
        debug('Incrementing failed attempts', { userId: user.id, failedAttempts });
      }

      await user.update(updates); // Update the user record
      // --- Security: Generic error message ---
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // --- Success Path ---
    // Reset failed attempts and unlock if necessary on successful login
    const successUpdates = {};
    if (user.failed_login_attempts > 0) successUpdates.failed_login_attempts = 0;
    if (user.account_locked) successUpdates.account_locked = false;
    if (user.account_locked_until) successUpdates.account_locked_until = null;
    successUpdates.last_login = new Date(); // Update last login time
    successUpdates.last_active = new Date(); // Also update last active time

    if (Object.keys(successUpdates).length > 0) {
        debug('Updating user record on successful login', { userId: user.id, updates: Object.keys(successUpdates) });
        await user.update(successUpdates);
    }


    // Create JWT token
    // --- Consistency & Security: Use userId, ensure role is included ---
    const tokenPayload = {
      userId: user.id,
      role: user.role // Include role for frontend authorization checks
    };
    debug('Generating token with payload', tokenPayload);
    let token;
    try {
        token = signToken(tokenPayload); // Uses the utility from jwt.mjs
    } catch (tokenError) {
        console.error('Error signing token:', tokenError);
        debug('Token signing error', { userId: user.id, message: tokenError.message });
        return res.status(500).json({ message: 'Server error creating session.' });
    }


    debug('Login successful', { userId: user.id });
    // Return token and user data (password excluded by model's toJSON)
    res.status(200).json({
      token,
      user: user.toJSON(),
      expiresIn: process.env.JWT_EXPIRES_IN || '3h' // Inform client about expiry (optional)
    });

  } catch (error) {
    // Catch unexpected errors during the process
    console.error('Unexpected error during login:', error);
    debug('Login server error', { message: error.message, name: error.name });
    res.status(500).json({
      message: 'Server error during login.',
      error: process.env.NODE_ENV === 'development' ? { message: error.message, name: error.name, stack: error.stack } : undefined
    });
  }
});

// Validate token - Protected by authenticateToken middleware
// The middleware handles token extraction, verification, and user lookup.
// If it passes, req.user contains the valid user data.
router.get('/validate-token', authenticateToken, async (req, res) => {
  // If authenticateToken middleware succeeds, req.user is populated and valid.
  debug('Token validation endpoint reached (already validated by middleware)', { userId: req.user.id });
  try {
    // Update last_active timestamp (optional, depends if activity tracking is needed here)
    // The middleware could potentially do this, or maybe only login/other actions update it.
    // For simplicity, let's assume the middleware confirming validity is enough activity signal.
    // await User.update({ last_active: new Date() }, { where: { id: req.user.id } });

    // Return the user data attached by the middleware
    res.status(200).json({ user: req.user });
  } catch (error) {
      // Handle potential errors if extending functionality here (e.g., DB error on update)
      console.error('Error in /validate-token after middleware:', error);
      debug('Error after token validation middleware', { userId: req.user?.id, message: error.message });
      res.status(500).json({ message: 'Server error processing validated token.' });
  }
});


// Get user profile - Protected by authenticateToken middleware
router.get('/profile', authenticateToken, (req, res) => {
  // authenticateToken ensures req.user is valid and populated (excluding password)
  debug('Profile request successful (user from middleware)', { userId: req.user.id });
  res.status(200).json({ user: req.user });
});

// Update user profile - Protected by authenticateToken middleware
router.put('/profile', authenticateToken, validateRequest({
  // Define allowed updatable fields (example)
  // Add other fields like phone_number etc. as needed
  allowedFields: ['first_name', 'last_name', 'email']
  // Using a middleware for validation would be cleaner
}), async (req, res) => {
  const userId = req.user.id; // User ID from authenticated user
  debug('Profile update request processing', { userId, body: req.body });

  try {
    // Get the user instance to update (already fetched by middleware, but safer to re-fetch for update)
    const user = await User.findByPk(userId);
     if (!user) {
       // Should not happen if middleware is correct, but good failsafe
       debug('Profile update failed - user not found after middleware', { userId });
       return res.status(404).json({ message: 'User not found.' });
     }

    // --- Security: Explicitly pick allowed fields to update ---
    // Avoid mass assignment vulnerabilities
    const allowedUpdates = {};
    const potentiallyAllowed = ['first_name', 'last_name', 'email', 'phone_number' /* add other safe fields */];
    for (const key of potentiallyAllowed) {
        if (req.body[key] !== undefined) { // Check if the field is present in the request
            // Additional validation per field can go here (e.g., email format)
            if (key === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(req.body.email)) {
                    debug('Profile update failed - invalid email format', { email: req.body.email });
                    return res.status(400).json({ message: 'Invalid email format.' });
                }
                // Check if new email is already taken by another user
                const existingEmail = await User.findOne({ where: { email: req.body.email } });
                if (existingEmail && existingEmail.id !== userId) {
                    debug('Profile update failed - email already in use', { email: req.body.email });
                    return res.status(409).json({ message: 'Email already in use by another account.' });
                }
            }
            allowedUpdates[key] = req.body[key];
        }
    }


    if (Object.keys(allowedUpdates).length === 0) {
        debug('Profile update - no valid fields provided', { userId });
        return res.status(400).json({ message: 'No valid fields provided for update.' });
    }

    debug('Applying profile updates', { userId, fields: Object.keys(allowedUpdates) });
    await user.update(allowedUpdates);

    debug('Profile update successful', { userId });
    res.status(200).json({
      message: 'Profile updated successfully',
      user: user.toJSON() // Return updated user data (password excluded)
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    debug('Profile update server error', { userId, message: error.message, name: error.name });
    // Handle potential validation errors from Sequelize (like unique constraint on email)
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ message: 'Update failed. Email might already be in use.' });
    }
    res.status(500).json({
      message: 'Server error during profile update.',
      error: process.env.NODE_ENV === 'development' ? { message: error.message, name: error.name } : undefined
    });
  }
});

// Change password - Protected by authenticateToken middleware
router.post('/change-password', authenticateToken, validateRequest({
  required: ['currentPassword', 'newPassword'],
  passwordField: 'newPassword' // Validate minimum length of new password
}), async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;
  debug('Password change request processing', { userId });

  try {
     // Fetch the full user model instance to access the password field/methods
     // req.user is just the JSON representation
     const user = await User.findByPk(userId);
     if (!user) {
       // Should not happen
       debug('Password change failed - user not found after middleware', { userId });
       return res.status(404).json({ message: 'User not found.' });
     }

    // Verify current password
    debug('Verifying current password', { userId });
    let isMatch = false;
    try {
        if (typeof user.comparePassword === 'function') {
            isMatch = await user.comparePassword(currentPassword);
        } else {
            debug('comparePassword method missing, using bcrypt.compare');
            isMatch = await bcrypt.compare(currentPassword, user.password);
        }
    } catch (passwordError) {
        console.error('Error comparing passwords during change:', passwordError);
        debug('Password comparison error', { userId, message: passwordError.message });
        return res.status(500).json({ message: 'Server error verifying current password.' });
    }


    if (!isMatch) {
      debug('Password change failed - current password incorrect', { userId });
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    // --- Security: Check if new password is same as old ---
    if (currentPassword === newPassword) {
        debug('Password change failed - new password is same as old', { userId });
        return res.status(400).json({ message: 'New password cannot be the same as the current password.' });
    }

    // Update password (model hook should handle hashing)
    debug('Updating password in DB', { userId });
    await user.update({ password: newPassword });

    debug('Password change successful', { userId });
    res.status(200).json({ message: 'Password updated successfully.' });

  } catch (error) {
    console.error('Error changing password:', error);
    debug('Password change server error', { userId, message: error.message, name: error.name });
    res.status(500).json({
      message: 'Server error during password change.',
      error: process.env.NODE_ENV === 'development' ? { message: error.message, name: error.name } : undefined
    });
  }
});

export default router;