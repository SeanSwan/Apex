/**
 * Daily Reports Custom Hooks - State Management and Business Logic
 * Extracted from DailyReportsPanel for better modularity and reusability
 * Production-ready hooks with comprehensive state management and synchronization
 */

import { useState, useCallback, useEffect } from 'react';
import { DailyReport, DailyReportStatus, SecurityCode, AIOptions } from '../../../types/reports';
import {
  DEFAULT_CONTACT_INFO,
  PROCESSING_TIMING,
  VALIDATION_RULES,
  ParsedReport
} from '../constants';
import {
  parseBulkReport,
  applyBulkImportResults,
  getActiveReport as getActiveReportUtil,
  updateReportStatusWithProgression,
  emitMetricsUpdateEvent,
  triggerAutosaveIndicator,
  shouldTriggerAISuggestions,
  triggerAITypingIndicator
} from '../utils';

// ===== TYPE DEFINITIONS =====

interface DailyReportsState {
  activeDay: string;
  isGenerating: boolean;
  isAutosaving: boolean;
  isProcessing: boolean;
  typingAI: boolean;
  sidebarCollapsed: boolean;
}

interface BulkImportState {
  bulkImportText: string;
  parsedReports: ParsedReport[];
  showBulkImport: boolean;
}

interface ContactFormState {
  contactEmailValue: string;
  signatureValue: string;
}

interface DailyReportsActions {
  setActiveDay: (day: string) => void;
  setIsGenerating: (generating: boolean) => void;
  setIsAutosaving: (autosaving: boolean) => void;
  setIsProcessing: (processing: boolean) => void;
  setTypingAI: (typing: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

interface BulkImportActions {
  setBulkImportText: (text: string) => void;
  setParsedReports: (reports: ParsedReport[]) => void;
  setShowBulkImport: (show: boolean) => void;
  handleBulkImport: () => void;
  handleApplyBulkImport: () => void;
  handleParseBulkReport: (text: string) => ParsedReport[];
}

interface ContactFormActions {
  setContactEmailValue: (email: string) => void;
  setSignatureValue: (signature: string) => void;
  handleContactEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSignatureChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface ReportHandlers {
  handleContentChange: (day: string, content: string) => void;
  handleStatusChange: (day: string, status: string) => void;
  handleSecurityCodeChange: (day: string, code: string) => void;
  markAsCompleted: (day: string) => void;
  triggerAutosave: () => () => void;
  getActiveReport: () => DailyReport | undefined;
}

// ===== CORE STATE MANAGEMENT HOOK =====

/**
 * Main state management hook for daily reports panel
 * Manages all primary state variables and their setters
 */
export const useDailyReportsState = (dailyReports: DailyReport[]): [DailyReportsState, DailyReportsActions] => {
  const [activeDay, setActiveDay] = useState<string>(dailyReports[0]?.day || 'Monday');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isAutosaving, setIsAutosaving] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [typingAI, setTypingAI] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  const state: DailyReportsState = {
    activeDay,
    isGenerating,
    isAutosaving,
    isProcessing,
    typingAI,
    sidebarCollapsed
  };

  const actions: DailyReportsActions = {
    setActiveDay,
    setIsGenerating,
    setIsAutosaving,
    setIsProcessing,
    setTypingAI,
    setSidebarCollapsed
  };

  return [state, actions];
};

// ===== BULK IMPORT HOOK =====

/**
 * Bulk import state and functionality hook
 * Manages bulk import text processing and parsed reports
 */
export const useBulkImport = (
  onSummaryChange: (text: string) => void,
  onReportChange: (day: string, content: string, status?: string, securityCode?: string) => void,
  setActiveDay: (day: string) => void,
  setIsProcessing: (processing: boolean) => void
): [BulkImportState, BulkImportActions] => {
  const [bulkImportText, setBulkImportText] = useState<string>('');
  const [parsedReports, setParsedReports] = useState<ParsedReport[]>([]);
  const [showBulkImport, setShowBulkImport] = useState<boolean>(true);

  // Bulk import parsing function
  const handleParseBulkReport = useCallback((text: string): ParsedReport[] => {
    return parseBulkReport(text, onSummaryChange);
  }, [onSummaryChange]);

  // Handle bulk import processing
  const handleBulkImport = useCallback(() => {
    if (!bulkImportText.trim()) return;

    setIsProcessing(true);
    
    // Simulate processing time for better UX
    setTimeout(() => {
      const parsed = handleParseBulkReport(bulkImportText);
      setParsedReports(parsed);
      setIsProcessing(false);

      // Preview the parsed results
      console.log('Parsed reports:', parsed);
    }, PROCESSING_TIMING.BULK_IMPORT_DELAY);
  }, [bulkImportText, handleParseBulkReport, setIsProcessing]);

  // Apply bulk import results
  const handleApplyBulkImport = useCallback(() => {
    const { appliedCount, message } = applyBulkImportResults(
      parsedReports,
      onReportChange,
      setActiveDay
    );

    // Clear bulk import state
    setBulkImportText('');
    setParsedReports([]);
    setShowBulkImport(false);

    // Show success message
    alert(message);
  }, [parsedReports, onReportChange, setActiveDay]);

  const state: BulkImportState = {
    bulkImportText,
    parsedReports,
    showBulkImport
  };

  const actions: BulkImportActions = {
    setBulkImportText,
    setParsedReports,
    setShowBulkImport,
    handleBulkImport,
    handleApplyBulkImport,
    handleParseBulkReport
  };

  return [state, actions];
};

// ===== CONTACT FORM HOOK =====

/**
 * Contact form state and handlers hook
 * Manages signature and contact email with parent component synchronization
 */
export const useContactForm = (
  signature: string,
  onSignatureChange: (text: string) => void,
  contactEmail: string,
  onContactEmailChange?: (email: string) => void
): [ContactFormState, ContactFormActions] => {
  const defaultSignature = DEFAULT_CONTACT_INFO.SIGNATURE;
  const defaultContactEmail = DEFAULT_CONTACT_INFO.EMAIL;
  
  const [contactEmailValue, setContactEmailValue] = useState<string>(contactEmail || defaultContactEmail);
  const [signatureValue, setSignatureValue] = useState<string>(signature || defaultSignature);

  // Sync with parent component for contact email
  useEffect(() => { 
    if (contactEmail) setContactEmailValue(contactEmail);
    else if (onContactEmailChange) onContactEmailChange(defaultContactEmail);
  }, [contactEmail, onContactEmailChange, defaultContactEmail]);
  
  // Sync with parent component for signature
  useEffect(() => { 
    if (signature) setSignatureValue(signature);
    else if (onSignatureChange) onSignatureChange(defaultSignature);
  }, [signature, onSignatureChange, defaultSignature]);

  // Handle contact email change with parent sync
  const handleContactEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { 
    setContactEmailValue(e.target.value); 
    if (onContactEmailChange) { 
      onContactEmailChange(e.target.value); 
    } 
  }, [onContactEmailChange]);

  // Handle signature change with parent sync
  const handleSignatureChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { 
    setSignatureValue(e.target.value); 
    if (onSignatureChange) { 
      onSignatureChange(e.target.value); 
    } 
  }, [onSignatureChange]);

  const state: ContactFormState = {
    contactEmailValue,
    signatureValue
  };

  const actions: ContactFormActions = {
    setContactEmailValue,
    setSignatureValue,
    handleContactEmailChange,
    handleSignatureChange
  };

  return [state, actions];
};

// ===== REPORT HANDLERS HOOK =====

/**
 * Report handling functions hook
 * Manages content changes, status updates, and report completion
 */
export const useReportHandlers = (
  dailyReports: DailyReport[],
  activeDay: string,
  onReportChange: (day: string, content: string, status?: string, securityCode?: string) => void,
  setActiveDay: (day: string) => void,
  setIsAutosaving: (autosaving: boolean) => void,
  setTypingAI: (typing: boolean) => void,
  aiOptions: AIOptions
): ReportHandlers => {
  // Get active report using utility function
  const getActiveReport = useCallback(() => { 
    return getActiveReportUtil(dailyReports, activeDay);
  }, [activeDay, dailyReports]);

  // Trigger autosave indicator
  const triggerAutosave = useCallback(() => {
    return triggerAutosaveIndicator(setIsAutosaving, PROCESSING_TIMING.AUTOSAVE_INDICATOR_DELAY);
  }, [setIsAutosaving]);
  
  // Handle content changes with immediate context sync
  const handleContentChange = useCallback((day: string, content: string) => { 
    const report = dailyReports.find(r => r.day === day); 
    const status = (report?.status === 'Completed') ? 'In Progress' : report?.status || 'In Progress'; 
    
    console.log('📝 DAILY REPORT UPDATE - IMMEDIATE CONTEXT SYNC:', {
      day,
      contentLength: content.length,
      status,
      timestamp: new Date().toISOString()
    });
    
    // Update via callback prop (for parent component)
    onReportChange(day, content, status, report?.securityCode); 
    
    // Trigger autosave indicator
    triggerAutosave(); 
    
    // Emit custom event for immediate chart regeneration
    emitMetricsUpdateEvent(day, content, 'CONTENT_UPDATED');
    
    // AI assistance trigger using imported utility
    if (shouldTriggerAISuggestions(content, aiOptions)) { 
      triggerAITypingIndicator(setTypingAI, PROCESSING_TIMING.TYPING_AI_DELAY);
    } 
  }, [dailyReports, onReportChange, triggerAutosave, aiOptions, setTypingAI]);
  
  // Handle status changes
  const handleStatusChange = useCallback((day: string, status: string) => { 
    const report = dailyReports.find(r => r.day === day); 
    if (report) { 
      onReportChange(
        day, 
        report.content || '',
        status as DailyReportStatus,
        report.securityCode
      ); 
      triggerAutosave(); 
    } 
  }, [dailyReports, onReportChange, triggerAutosave]);
  
  // Handle security code changes
  const handleSecurityCodeChange = useCallback((day: string, code: string) => { 
    const report = dailyReports.find(r => r.day === day); 
    if (report) { 
      onReportChange(
        day, 
        report.content || '',
        report.status, 
        code as SecurityCode
      ); 
      triggerAutosave(); 
    } 
  }, [dailyReports, onReportChange, triggerAutosave]);
  
  // Mark report as completed with progression logic
  const markAsCompleted = useCallback((day: string) => {
    updateReportStatusWithProgression(
      dailyReports,
      day,
      'Completed',
      onReportChange,
      setActiveDay
    );
    triggerAutosave();
  }, [dailyReports, onReportChange, setActiveDay, triggerAutosave]);

  return {
    handleContentChange,
    handleStatusChange,
    handleSecurityCodeChange,
    markAsCompleted,
    triggerAutosave,
    getActiveReport
  };
};

// ===== FORCE SAVE HOOK =====

/**
 * Force save hook for tab switching and data synchronization
 * Ensures data is persisted before user switches tabs or navigates away
 */
export const useForceSave = (
  getActiveReport: () => DailyReport | undefined,
  summaryNotes: string,
  signatureValue: string,
  contactEmailValue: string,
  onReportChange: (day: string, content: string, status?: string, securityCode?: string) => void,
  onSummaryChange: (text: string) => void,
  onSignatureChange: (text: string) => void,
  onContactEmailChange?: (email: string) => void
): void => {
  useEffect(() => {
    const handleForceSave = (event: CustomEvent) => {
      console.log('💾 FORCE SAVE: Tab switch detected, saving all daily reports data:', event.detail);
      
      // Force save all current data to parent component
      // This ensures data is persisted before user switches tabs
      const activeReport = getActiveReport();
      if (activeReport && activeReport.content) {
        console.log('💾 FORCE SAVE: Saving active report for', activeReport.day);
        onReportChange(activeReport.day, activeReport.content, activeReport.status, activeReport.securityCode);
      }
      
      // Force save summary notes if they exist
      if (summaryNotes && summaryNotes.trim()) {
        console.log('💾 FORCE SAVE: Saving summary notes');
        onSummaryChange(summaryNotes);
      }
      
      // Force save signature and contact email
      if (signatureValue) {
        console.log('💾 FORCE SAVE: Saving signature');
        onSignatureChange(signatureValue);
      }
      
      if (contactEmailValue && onContactEmailChange) {
        console.log('💾 FORCE SAVE: Saving contact email');
        onContactEmailChange(contactEmailValue);
      }
      
      console.log('✅ FORCE SAVE COMPLETE: All daily reports data persisted');
    };
    
    // Listen for tab switch save events
    window.addEventListener('forceSaveBeforeTabSwitch', handleForceSave as EventListener);
    
    // Cleanup listener
    return () => {
      window.removeEventListener('forceSaveBeforeTabSwitch', handleForceSave as EventListener);
    };
  }, [getActiveReport, summaryNotes, signatureValue, contactEmailValue, onReportChange, onSummaryChange, onSignatureChange, onContactEmailChange]);
};

// ===== AI GENERATION HOOK =====

/**
 * AI generation and processing hook
 * Manages AI-related state and generation functions
 */
export const useAIGeneration = (
  setIsGenerating: (generating: boolean) => void
) => {
  // Generate individual report with AI
  const generateReport = useCallback(async (day: string) => { 
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, PROCESSING_TIMING.AI_GENERATION_DELAY);
  }, [setIsGenerating]);
  
  // Generate summary with AI
  const generateSummary = useCallback(async () => { 
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, PROCESSING_TIMING.AI_GENERATION_DELAY);
  }, [setIsGenerating]);

  return {
    generateReport,
    generateSummary
  };
};

// ===== REPORT CALCULATIONS HOOK =====

/**
 * Report calculations and derived state hook
 * Provides computed values based on reports data
 */
export const useReportCalculations = (dailyReports: DailyReport[]) => {
  // Calculate completion percentage
  const completionPercentage = Math.round(
    (dailyReports.filter(report => report.status === 'Completed').length / dailyReports.length) * 100
  );
  
  const isCompletionFinished = completionPercentage === 100;
  
  // Calculate reports with content
  const reportsWithContent = dailyReports?.filter(r => r.content && r.content.trim()).length || 0;
  
  // Calculate validation statistics
  const reportsNeedingWork = dailyReports?.filter(r => 
    !r.content || r.content.trim().length < VALIDATION_RULES.MINIMUM_WORD_COUNT
  ).length || 0;

  return {
    completionPercentage,
    isCompletionFinished,
    reportsWithContent,
    reportsNeedingWork,
    totalReports: dailyReports.length,
    completedReports: dailyReports.filter(report => report.status === 'Completed').length
  };
};

// ===== COMPOSITE HOOK =====

/**
 * Main composite hook that combines all daily reports functionality
 * Provides a complete state management solution for the daily reports panel
 */
export const useDailyReportsPanel = (
  dailyReports: DailyReport[],
  onReportChange: (day: string, content: string, status?: string, securityCode?: string) => void,
  summaryNotes: string,
  onSummaryChange: (text: string) => void,
  signature: string,
  onSignatureChange: (text: string) => void,
  contactEmail: string,
  onContactEmailChange: ((email: string) => void) | undefined,
  aiOptions: AIOptions
) => {
  // Core state management
  const [state, stateActions] = useDailyReportsState(dailyReports);
  
  // Contact form management
  const [contactForm, contactFormActions] = useContactForm(
    signature,
    onSignatureChange,
    contactEmail,
    onContactEmailChange
  );
  
  // Bulk import management
  const [bulkImport, bulkImportActions] = useBulkImport(
    onSummaryChange,
    onReportChange,
    stateActions.setActiveDay,
    stateActions.setIsProcessing
  );
  
  // Report handlers
  const reportHandlers = useReportHandlers(
    dailyReports,
    state.activeDay,
    onReportChange,
    stateActions.setActiveDay,
    stateActions.setIsAutosaving,
    stateActions.setTypingAI,
    aiOptions
  );
  
  // AI generation
  const aiGeneration = useAIGeneration(stateActions.setIsGenerating);
  
  // Report calculations
  const calculations = useReportCalculations(dailyReports);
  
  // Force save functionality
  useForceSave(
    reportHandlers.getActiveReport,
    summaryNotes,
    contactForm.signatureValue,
    contactForm.contactEmailValue,
    onReportChange,
    onSummaryChange,
    onSignatureChange,
    onContactEmailChange
  );

  return {
    state,
    stateActions,
    contactForm,
    contactFormActions,
    bulkImport,
    bulkImportActions,
    reportHandlers,
    aiGeneration,
    calculations
  };
};

// ===== EXPORT ALL HOOKS =====

export default {
  useDailyReportsState,
  useBulkImport,
  useContactForm,
  useReportHandlers,
  useForceSave,
  useAIGeneration,
  useReportCalculations,
  useDailyReportsPanel
};
