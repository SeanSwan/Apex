/**
 * APEX AI FACE MANAGEMENT COMPONENTS INDEX
 * ========================================
 * Central export file for all face management components
 */

// Main Dashboard Component
export { default as FaceManagementDashboard } from './FaceManagementDashboard';

// Core Face Management Components
export { default as FaceEnrollment } from './FaceEnrollment';
export { default as FaceProfileList } from './FaceProfileList';
export { default as FaceProfileCard } from './FaceProfileCard';
export { default as FaceDetectionLog } from './FaceDetectionLog';
export { default as FaceAnalytics } from './FaceAnalytics';
export { default as BulkFaceUpload } from './BulkFaceUpload';

// Export component types for TypeScript support
export type { FaceManagementDashboardProps } from './FaceManagementDashboard';
export type { FaceEnrollmentProps } from './FaceEnrollment';
export type { FaceProfileListProps } from './FaceProfileList';
export type { FaceProfileCardProps } from './FaceProfileCard';
export type { FaceDetectionLogProps } from './FaceDetectionLog';
export type { FaceAnalyticsProps } from './FaceAnalytics';
export type { BulkFaceUploadProps } from './BulkFaceUpload';
