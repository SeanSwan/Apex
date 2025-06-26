// Components Index - Centralized Exports
// Created for proper import/export standardization

// === REPORT BUILDER MODULE ===
export * from './Reports';
export { default as EnhancedReportBuilder } from './Reports/EnhancedReportBuilder';

// === DASHBOARD MODULES ===
export { default as CompanyAdminDashboard } from './AdminDashboard/CompanyAdminDashboard';
export { default as AIConsoleDashboard } from './AIConsole/AIConsoleDashboard';
export { default as LiveMonitoringDashboard } from './LiveMonitoring/LiveMonitoringDashboard';
export { default as EnhancedLiveMonitoring } from './LiveMonitoring/EnhancedLiveMonitoring';
export { default as GuardOperationsDashboard } from './GuardOperations/GuardOperationsDashboard';

// === GUARD MOBILE ===
export { default as GuardMobileApp } from './GuardMobile/GuardMobileApp';

// === CORE COMPONENTS ===
export { default as Header } from './Header/header.component';
export { default as IntegratedHomePage } from './HomePage';
export { default as TestHomePage } from './TestHomePage';
export { default as ErrorBoundary } from './ErrorBoundary/error-boundry.component';

// === FORM COMPONENTS ===
export { default as SignupForm } from './SignupForm/SignUpForm.component';
export { default as UniversalAuthForm } from './UniversalAuthForm/UniversalAuthForm.component';
export { default as TimeOffRequestForm } from './TimeOffRequestForm';
export { default as DARForm } from './DARForm';

// === CARD COMPONENTS ===
export { default as ClockInOutCard } from './ClockInOutCard';
export { default as CommunicationCard } from './CommunicationCard';
export { default as PerformanceCard } from './PerformanceCard';
export { default as GamificationCard } from './GamificationCard';
export { default as TimeOffRequestsCard } from './TimeOffRequestsCard';
export { default as WorkSummaryCard } from './WorkSummaryCard';
export { default as DARCard } from './DARCard';

// === UI COMPONENTS ===
export * from './ui';
export { default as DialogD } from './DialogD';
export { default as Title } from './Title';
export { default as ImageSlider } from './ImageSlider';
export { default as ResizeImage } from './ResizeImage';

// === UTILITY COMPONENTS ===
export { default as Bot } from './Bot';
export { default as ObjectDetection } from './ObjectDetection';
export { default as PermissionEditor } from './PermissionEditor';
export { default as ProtectedRoutes } from './ProtectedRoutes';
export { default as UserList } from './UserList';

// === TESTING & DEBUG ===
export { default as BugFixVerification } from './BugFixVerification';
export { default as connectionTest } from './connectionTest';

// === ICONS ===
export * from './icons';
