// Sanitizer utilities for data validation and cleaning
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create a JSDOM window for server-side DOMPurify
const window = new JSDOM('').window;
const createDOMPurify = DOMPurify(window);

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} html - Raw HTML content
 * @returns {string} - Sanitized HTML
 */
export const sanitizeHtml = (html) => {
  if (!html || typeof html !== 'string') return '';
  
  return createDOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'span', 'div'],
    ALLOWED_ATTR: ['class', 'style'],
    KEEP_CONTENT: true
  });
};

/**
 * Sanitize plain text input
 * @param {string} text - Raw text input
 * @returns {string} - Sanitized text
 */
export const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .substring(0, 1000); // Limit length
};

/**
 * Sanitize email addresses
 * @param {string} email - Email address
 * @returns {string} - Sanitized email
 */
export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = email.toLowerCase().trim();
  
  return emailRegex.test(sanitized) ? sanitized : '';
};

/**
 * Sanitize file names
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
export const sanitizeFilename = (filename) => {
  if (!filename || typeof filename !== 'string') return '';
  
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars
    .replace(/_{2,}/g, '_') // Remove multiple underscores
    .substring(0, 255); // Limit length
};

/**
 * Sanitize database input to prevent SQL injection
 * @param {any} input - Database input
 * @returns {any} - Sanitized input
 */
export const sanitizeDbInput = (input) => {
  if (typeof input === 'string') {
    return input
      .replace(/['";\\]/g, '') // Remove SQL injection chars
      .trim();
  }
  
  if (typeof input === 'number') {
    return isNaN(input) ? 0 : input;
  }
  
  if (typeof input === 'boolean') {
    return Boolean(input);
  }
  
  return input;
};

/**
 * Sanitize report data
 * @param {object} reportData - Report data object
 * @returns {object} - Sanitized report data
 */
export const sanitizeReportData = (reportData) => {
  if (!reportData || typeof reportData !== 'object') return {};
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(reportData)) {
    if (typeof value === 'string') {
      if (key.toLowerCase().includes('email')) {
        sanitized[key] = sanitizeEmail(value);
      } else if (key.toLowerCase().includes('html') || key.toLowerCase().includes('content')) {
        sanitized[key] = sanitizeHtml(value);
      } else {
        sanitized[key] = sanitizeText(value);
      }
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeReportData(value); // Recursive sanitization
    } else {
      sanitized[key] = sanitizeDbInput(value);
    }
  }
  
  return sanitized;
};

/**
 * Validate and sanitize security codes
 * @param {string} code - Security code
 * @returns {string} - Valid security code or default
 */
export const sanitizeSecurityCode = (code) => {
  const validCodes = ['Code 1', 'Code 2', 'Code 3', 'Code 4'];
  return validCodes.includes(code) ? code : 'Code 4';
};

export default {
  sanitizeHtml,
  sanitizeText,
  sanitizeEmail,
  sanitizeFilename,
  sanitizeDbInput,
  sanitizeReportData,
  sanitizeSecurityCode
};
