/**
 * APEX AI SECURITY PLATFORM - RATE LIMITING MIDDLEWARE
 * ===================================================
 * Production-grade rate limiting for API protection
 */

import rateLimit from 'express-rate-limit';

/**
 * General API Rate Limiter
 * Protects against DDoS and API abuse
 * UPDATED: Increased for normal dashboard operation
 */
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 100, // Increased for dashboard operation - 100 requests per minute
  message: {
    error: 'Too many requests from this IP',
    retryAfter: '1 minute',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`Rate limit exceeded for IP: ${req.ip} at ${new Date().toISOString()}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.round(req.rateLimit.resetTime.getTime() / 1000)
    });
  }
});

/**
 * Authentication Rate Limiter
 * Stricter limits for login attempts
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Reasonable limit for auth attempts
  message: {
    error: 'Too many authentication attempts',
    retryAfter: '15 minutes',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    console.warn(`Auth rate limit exceeded for IP: ${req.ip} at ${new Date().toISOString()}`);
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Account temporarily locked. Please try again later.',
      retryAfter: Math.round(req.rateLimit.resetTime.getTime() / 1000)
    });
  }
});

/**
 * AI Alert Creation Rate Limiter
 * Prevents AI alert spam
 */
export const aiAlertLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 10, // Increased for normal operation
  message: {
    error: 'Too many AI alerts created',
    retryAfter: '30 seconds',
    code: 'AI_ALERT_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Dispatch Rate Limiter
 * Prevents dispatch spam
 */
export const dispatchLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // Increased for normal operation
  message: {
    error: 'Too many dispatch requests',
    retryAfter: '5 minutes',
    code: 'DISPATCH_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Critical Operations Rate Limiter
 * For sensitive operations like user management
 */
export const criticalOpsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 25, // Slightly increased for normal admin operations
  message: {
    error: 'Critical operation rate limit exceeded',
    retryAfter: '1 hour',
    code: 'CRITICAL_OPS_RATE_LIMIT_EXCEEDED'
  },
  handler: (req, res) => {
    // Log critical operations attempts
    console.error(`Critical ops rate limit exceeded for IP: ${req.ip}, User: ${req.user?.user_id || 'unknown'} at ${new Date().toISOString()}`);
    res.status(429).json({
      error: 'Critical operation rate limit exceeded',
      message: 'Too many sensitive operations attempted. Contact administrator.',
      retryAfter: Math.round(req.rateLimit.resetTime.getTime() / 1000)
    });
  }
});

/**
 * Dynamic Rate Limiter Factory
 * Creates custom rate limiters based on user role
 */
export const createRoleBasedLimiter = (limits) => {
  return (req, res, next) => {
    const userRole = req.user?.role || 'guest';
    const limit = limits[userRole] || limits.default;
    
    if (!limit) {
      return next();
    }
    
    const dynamicLimiter = rateLimit({
      windowMs: limit.windowMs,
      max: limit.max,
      message: {
        error: `Rate limit exceeded for role: ${userRole}`,
        retryAfter: `${limit.windowMs / 60000} minutes`,
        code: 'ROLE_BASED_RATE_LIMIT_EXCEEDED'
      }
    });
    
    return dynamicLimiter(req, res, next);
  };
};

/**
 * IP Whitelist Bypass
 * Allow certain IPs to bypass rate limiting
 */
export const createWhitelistBypass = (whitelist = []) => {
  return (req, res, next) => {
    if (whitelist.includes(req.ip) || whitelist.includes(req.headers['x-forwarded-for'])) {
      return next();
    }
    return apiLimiter(req, res, next);
  };
};

export default {
  apiLimiter,
  authLimiter,
  aiAlertLimiter,
  dispatchLimiter,
  criticalOpsLimiter,
  createRoleBasedLimiter,
  createWhitelistBypass
};