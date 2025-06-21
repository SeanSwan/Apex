// Generators utility for creating unique IDs, codes, and tokens
import crypto from 'crypto';

/**
 * Generate a unique report number based on report type
 * @param {string} reportType - Type of report (incident, patrol, monthly, etc.)
 * @returns {string} - Unique report number
 */
export const generateReportNumber = (reportType = 'general') => {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(3).toString('hex');
  const typePrefix = reportType.substring(0, 3).toUpperCase();
  return `${typePrefix}-${timestamp}-${randomPart}`.toUpperCase();
};

/**
 * Generate a unique report ID
 * @returns {string} - Unique report ID
 */
export const generateReportId = () => {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(4).toString('hex');
  return `RPT-${timestamp}-${randomPart}`.toUpperCase();
};

/**
 * Generate a unique client ID
 * @returns {string} - Unique client ID
 */
export const generateClientId = () => {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(3).toString('hex');
  return `CLI-${timestamp}-${randomPart}`.toUpperCase();
};

/**
 * Generate a security incident ID
 * @returns {string} - Unique incident ID
 */
export const generateIncidentId = () => {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(3).toString('hex');
  return `INC-${timestamp}-${randomPart}`.toUpperCase();
};

/**
 * Generate a secure token for file access
 * @param {number} length - Token length (default: 32)
 * @returns {string} - Secure random token
 */
export const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a temporary access code
 * @param {number} length - Code length (default: 8)
 * @returns {string} - Temporary access code
 */
export const generateAccessCode = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate a hash for data integrity
 * @param {string} data - Data to hash
 * @returns {string} - SHA256 hash
 */
export const generateDataHash = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate a UUID v4
 * @returns {string} - UUID v4
 */
export const generateUUID = () => {
  return crypto.randomUUID();
};

/**
 * Generate a filename-safe timestamp
 * @returns {string} - Timestamp suitable for filenames
 */
export const generateTimestamp = () => {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
};

/**
 * Generate a session ID
 * @returns {string} - Session ID
 */
export const generateSessionId = () => {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(8).toString('hex');
  return `sess_${timestamp}_${randomPart}`;
};

/**
 * Generate a media file ID
 * @returns {string} - Media file ID
 */
export const generateMediaId = () => {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(3).toString('hex');
  return `MED-${timestamp}-${randomPart}`.toUpperCase();
};

/**
 * Generate a batch ID for bulk operations
 * @returns {string} - Batch ID
 */
export const generateBatchId = () => {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(2).toString('hex');
  return `BATCH-${timestamp}-${randomPart}`.toUpperCase();
};

export default {
  generateReportNumber,
  generateReportId,
  generateClientId,
  generateIncidentId,
  generateSecureToken,
  generateAccessCode,
  generateDataHash,
  generateUUID,
  generateTimestamp,
  generateSessionId,
  generateMediaId,
  generateBatchId
};
