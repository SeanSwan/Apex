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
export { default as TimeOffRequestForm } from './TimeOffRequestForm/time-off-request-form.component';
export { default as DARForm } from './DARForm/dar-form.component';

// === CARD COMPONENTS ===
export { default as ClockInOutCard } from './ClockInOutCard/clock-in-out-card.component';
export { default as CommunicationCard } from './CommunicationCard/communication-card.component';
export { default as PerformanceCard } from './PerformanceCard/performance-card.component';
export { default as GamificationCard } from './GamificationCard/gamification-card.component';
export { default as TimeOffRequestsCard } from './TimeOffRequestsCard/time-off-requests-card.component';
export { default as WorkSummaryCard } from './WorkSummaryCard/Work-Summary-card.component';
export { default as DARCard } from './DARCard/dar-card.component';

// === UI COMPONENTS ===
// Note: Button is exported from Reports, so we exclude it from ui re-exports
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
export { Input } from './ui/input';
export { Badge } from './ui/badge';
export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
export { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
export { Textarea } from './ui/textarea';
export { DatePicker } from './ui/date-picker';
export { default as Title } from './Title/Title.component';
export { default as ImageSlider } from './ImageSlider/ImageSlider.component';

// === UTILITY COMPONENTS ===
export { default as Bot } from './Bot/createbot-component';
export { default as ObjectDetection } from './ObjectDetection/ObjectDetection.component';
export { default as PermissionEditor } from './PermissionEditor/PermissionEditor';
export { default as ProtectedRoutes } from './ProtectedRoutes/protected-routes.component';
export { default as UserList } from './UserList/UserList.component';

// === ICONS ===
export * from './icons';
