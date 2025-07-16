/**
 * Daily Reports Utility Functions - Core Business Logic and Data Processing
 * Extracted from DailyReportsPanel for better modularity and testability
 * Production-ready utilities with comprehensive error handling and logging
 */

import { DailyReport, DailyReportStatus, SecurityCode } from '../../../types/reports';
import {
  DAY_PARSING_PATTERNS,
  SUMMARY_PARSING_PATTERNS,
  VALIDATION_RULES,
  LOGGING_CONFIG,
  ParsedReport,
  getWordCount,
  formatBulkImportSuccess
} from '../constants';

// ===== BULK PARSING UTILITIES =====

/**
 * Enhanced bulk import parsing function with comprehensive logging
 * Parses weekly report text into individual daily reports
 * @param text - Raw bulk import text
 * @param onSummaryChange - Callback to update summary when found
 * @returns Array of parsed daily reports
 */
export const parseBulkReport = (
  text: string, 
  onSummaryChange: (summary: string) => void
): ParsedReport[] => {
  if (LOGGING_CONFIG.ENABLED) {
    console.log(`${LOGGING_CONFIG.PREFIXES.PARSING} Starting bulk report parsing...`);
    console.log(`${LOGGING_CONFIG.PREFIXES.PARSING} Input text length:`, text.length);
  }
  
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const reports: ParsedReport[] = [];
  let currentDay = '';
  let currentContent: string[] = [];
  let summaryContent = '';
  let foundSummary = false;

  if (LOGGING_CONFIG.ENABLED) {
    console.log(`${LOGGING_CONFIG.PREFIXES.PARSING} Total non-empty lines:`, lines.length);
  }

  // Use imported parsing patterns
  const dayPatterns = DAY_PARSING_PATTERNS;
  const summaryPatterns = SUMMARY_PARSING_PATTERNS;

  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (LOGGING_CONFIG.ENABLED) {
      console.log(`${LOGGING_CONFIG.PREFIXES.CONTENT} Processing line ${i + 1}: "${line}"`);
    }
    
    // Check if this line starts a summary section
    const isSummaryLine = summaryPatterns.some(pattern => {
      const match = pattern.test(line);
      if (match && LOGGING_CONFIG.ENABLED) {
        console.log(`${LOGGING_CONFIG.PREFIXES.SUMMARY} Found summary pattern: ${pattern}`);
      }
      return match;
    });
    
    if (isSummaryLine) {
      if (LOGGING_CONFIG.ENABLED) {
        console.log(`${LOGGING_CONFIG.PREFIXES.SUMMARY} Starting summary section`);
      }
      // Save previous day if we were building one
      if (currentDay && currentContent.length > 0) {
        const dayContent = currentContent.join('\n').trim();
        if (LOGGING_CONFIG.ENABLED) {
          console.log(`${LOGGING_CONFIG.PREFIXES.SAVE} Saving day "${currentDay}" with content length: ${dayContent.length}`);
        }
        reports.push({
          day: currentDay,
          content: dayContent
        });
      }
      
      foundSummary = true;
      summaryContent = line.replace(/^\s*(Summary|Conclusion|Additional\s+Notes|Week\s+Summary|Weekly\s+Summary|Notes|Overall)\s*:?\s*/i, '').trim();
      continue;
    }

    // If we're in summary mode, collect summary content
    if (foundSummary) {
      if (summaryContent) {
        summaryContent += '\n' + line;
      } else {
        summaryContent = line;
      }
      if (LOGGING_CONFIG.ENABLED) {
        console.log(`${LOGGING_CONFIG.PREFIXES.SUMMARY} Adding to summary:`, line.substring(0, 50) + '...');
      }
      continue;
    }

    // Check if this line starts a new day
    let foundDayMatch = false;
    for (const pattern of dayPatterns) {
      const match = line.match(pattern);
      if (match) {
        if (LOGGING_CONFIG.ENABLED) {
          console.log(`${LOGGING_CONFIG.PREFIXES.DAY_DETECTION} Found day pattern: ${pattern} -> ${match[0]}`);
        }
        
        // Save previous day if we were building one
        if (currentDay && currentContent.length > 0) {
          const dayContent = currentContent.join('\n').trim();
          if (LOGGING_CONFIG.ENABLED) {
            console.log(`${LOGGING_CONFIG.PREFIXES.SAVE} Saving previous day "${currentDay}" with content length: ${dayContent.length}`);
          }
          reports.push({
            day: currentDay,
            content: dayContent
          });
        }

        // Extract day name
        const dayMatch = line.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i);
        if (dayMatch) {
          currentDay = dayMatch[1].charAt(0).toUpperCase() + dayMatch[1].slice(1).toLowerCase();
          currentContent = [];
          foundDayMatch = true;
          if (LOGGING_CONFIG.ENABLED) {
            console.log(`${LOGGING_CONFIG.PREFIXES.DAY_DETECTION} New day detected: ${currentDay}`);
          }
          
          // Check if there's content on the same line after the day pattern
          const contentAfterDay = line.replace(pattern, '').trim();
          if (contentAfterDay && contentAfterDay.length > 2) {
            currentContent.push(contentAfterDay);
            if (LOGGING_CONFIG.ENABLED) {
              console.log(`${LOGGING_CONFIG.PREFIXES.CONTENT} Content on same line: ${contentAfterDay.substring(0, 50)}...`);
            }
          }
        }
        break;
      }
    }
    
    // If not a day line and we have a current day, add to content
    if (!foundDayMatch && currentDay) {
      currentContent.push(line);
      if (LOGGING_CONFIG.ENABLED) {
        console.log(`${LOGGING_CONFIG.PREFIXES.CONTENT} Adding content to ${currentDay}: ${line.substring(0, 50)}...`);
      }
    } else if (!foundDayMatch && !currentDay) {
      if (LOGGING_CONFIG.ENABLED) {
        console.log(`${LOGGING_CONFIG.PREFIXES.ERROR} Orphaned content (no current day): ${line.substring(0, 50)}...`);
      }
    }
  }

  // Don't forget the last day
  if (currentDay && currentContent.length > 0) {
    const dayContent = currentContent.join('\n').trim();
    if (LOGGING_CONFIG.ENABLED) {
      console.log(`${LOGGING_CONFIG.PREFIXES.SAVE} Saving final day "${currentDay}" with content length: ${dayContent.length}`);
    }
    reports.push({
      day: currentDay,
      content: dayContent
    });
  }

  // Set summary if found
  if (foundSummary && summaryContent.trim()) {
    if (LOGGING_CONFIG.ENABLED) {
      console.log(`${LOGGING_CONFIG.PREFIXES.SUMMARY} Setting summary content, length:`, summaryContent.trim().length);
    }
    onSummaryChange(summaryContent.trim());
  }

  if (LOGGING_CONFIG.ENABLED) {
    console.log(`${LOGGING_CONFIG.PREFIXES.SUCCESS} Parsing complete. Found`, reports.length, 'daily reports');
    reports.forEach((report, index) => {
      console.log(`  ${index + 1}. ${report.day}: ${report.content.length} characters`);
    });
  }

  return reports;
};

// ===== REPORT PROCESSING UTILITIES =====

/**
 * Apply bulk import results to daily reports
 * @param parsedReports - Parsed reports from bulk import
 * @param onReportChange - Callback to update individual reports
 * @param setActiveDay - Callback to set active day
 * @returns Applied count and success message
 */
export const applyBulkImportResults = (
  parsedReports: ParsedReport[],
  onReportChange: (day: string, content: string, status?: string, securityCode?: string) => void,
  setActiveDay: (day: string) => void
): { appliedCount: number; message: string } => {
  if (parsedReports.length === 0) {
    if (LOGGING_CONFIG.ENABLED) {
      console.warn(`${LOGGING_CONFIG.PREFIXES.ERROR} No parsed reports to apply`);
    }
    return { appliedCount: 0, message: 'No reports to apply' };
  }

  if (LOGGING_CONFIG.ENABLED) {
    console.log(`${LOGGING_CONFIG.PREFIXES.SUCCESS} Applying bulk import for`, parsedReports.length, 'reports');
  }
  
  // Apply each parsed report
  let appliedCount = 0;
  parsedReports.forEach(({ day, content }) => {
    if (content && content.trim().length > 0) {
      if (LOGGING_CONFIG.ENABLED) {
        console.log(`${LOGGING_CONFIG.PREFIXES.CONTENT} Applying report for ${day}:`, {
          contentLength: content.length,
          preview: content.substring(0, 50) + '...'
        });
      }
      
      onReportChange(day, content.trim(), 'In Progress', 'Code 4');
      appliedCount++;
    } else {
      if (LOGGING_CONFIG.ENABLED) {
        console.warn(`${LOGGING_CONFIG.PREFIXES.ERROR} Skipping ${day} - no content`);
      }
    }
  });

  // Switch to the first applied day
  if (parsedReports.length > 0) {
    setActiveDay(parsedReports[0].day);
    if (LOGGING_CONFIG.ENABLED) {
      console.log(`${LOGGING_CONFIG.PREFIXES.SUCCESS} Switched to day:`, parsedReports[0].day);
    }
  }

  // Generate success message
  const message = formatBulkImportSuccess(parsedReports);
  
  if (LOGGING_CONFIG.ENABLED) {
    console.log(`${LOGGING_CONFIG.PREFIXES.SUCCESS} Bulk import complete:`, {
      totalParsed: parsedReports.length,
      applied: appliedCount,
      activeDay: parsedReports[0]?.day
    });
  }

  return { appliedCount, message };
};

// ===== REPORT VALIDATION UTILITIES =====

/**
 * Validate daily report content completeness
 * @param dailyReports - Array of daily reports
 * @param summaryNotes - Summary notes content
 * @returns Validation results
 */
export const validateReportsCompleteness = (
  dailyReports: DailyReport[],
  summaryNotes: string
) => {
  const reportsWithContent = dailyReports?.filter(r => r.content && r.content.trim()).length || 0;
  const completedReports = dailyReports?.filter(r => r.status === 'Completed').length || 0;
  const totalReports = dailyReports?.length || 0;
  
  const isDataComplete = reportsWithContent > 0 && summaryNotes && summaryNotes.trim();
  const completionPercentage = totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0;
  const isFullyComplete = completionPercentage === 100;

  return {
    reportsWithContent,
    completedReports,
    totalReports,
    isDataComplete,
    completionPercentage,
    isFullyComplete,
    hasInsufficientContent: dailyReports?.some(r => r.content && getWordCount(r.content) < VALIDATION_RULES.MINIMUM_WORD_COUNT)
  };
};

/**
 * Get content quality assessment for a report
 * @param content - Report content
 * @returns Quality assessment with suggestions
 */
export const assessContentQuality = (content: string) => {
  const wordCount = getWordCount(content);
  const characterCount = content.length;
  
  let quality: 'excellent' | 'good' | 'adequate' | 'insufficient';
  let suggestions: string[] = [];
  
  if (wordCount >= 200) {
    quality = 'excellent';
  } else if (wordCount >= 100) {
    quality = 'good';
  } else if (wordCount >= VALIDATION_RULES.MINIMUM_WORD_COUNT) {
    quality = 'adequate';
    suggestions = [
      'Consider adding more specific details about security observations',
      'Include timing information for any incidents',
      'Mention specific areas that were monitored'
    ];
  } else {
    quality = 'insufficient';
    suggestions = [
      `Report must contain at least ${VALIDATION_RULES.MINIMUM_WORD_COUNT} words`,
      'Add specific details about security observations',
      'Include timing information for any incidents',
      'Describe any notable activities or lack thereof'
    ];
  }

  return {
    wordCount,
    characterCount,
    quality,
    isValid: wordCount >= VALIDATION_RULES.MINIMUM_WORD_COUNT,
    isExcellent: quality === 'excellent',
    suggestions: suggestions.length > 0 ? suggestions : undefined
  };
};

// ===== REPORT STATE MANAGEMENT UTILITIES =====

/**
 * Find the active report from daily reports array
 * @param dailyReports - Array of daily reports
 * @param activeDay - Currently active day
 * @returns Active report or first report if not found
 */
export const getActiveReport = (
  dailyReports: DailyReport[],
  activeDay: string
): DailyReport | undefined => {
  return dailyReports.find(report => report.day === activeDay) || dailyReports[0];
};

/**
 * Find the next incomplete report for navigation
 * @param dailyReports - Array of daily reports
 * @param currentDay - Current day to start search from
 * @returns Next incomplete report or undefined
 */
export const findNextIncompleteReport = (
  dailyReports: DailyReport[],
  currentDay: string
): DailyReport | undefined => {
  const currentIndex = dailyReports.findIndex(r => r.day === currentDay);
  if (currentIndex === -1) return undefined;
  
  return dailyReports.slice(currentIndex + 1).find(r => r.status !== 'Completed');
};

/**
 * Update report status with automatic progression logic
 * @param dailyReports - Array of daily reports
 * @param day - Day to update
 * @param newStatus - New status to set
 * @param onReportChange - Callback to update report
 * @param setActiveDay - Callback to set active day
 */
export const updateReportStatusWithProgression = (
  dailyReports: DailyReport[],
  day: string,
  newStatus: DailyReportStatus,
  onReportChange: (day: string, content: string, status?: string, securityCode?: string) => void,
  setActiveDay: (day: string) => void
): void => {
  const report = dailyReports.find(r => r.day === day);
  if (!report) return;

  // Update the report status
  onReportChange(
    day,
    report.content || '',
    newStatus,
    report.securityCode
  );

  // If marking as completed, try to move to next incomplete report
  if (newStatus === 'Completed') {
    const nextIncomplete = findNextIncompleteReport(dailyReports, day);
    if (nextIncomplete) {
      setActiveDay(nextIncomplete.day);
      if (LOGGING_CONFIG.ENABLED) {
        console.log(`${LOGGING_CONFIG.PREFIXES.SUCCESS} Auto-navigated to next incomplete report:`, nextIncomplete.day);
      }
    }
  }
};

// ===== EVENT HANDLING UTILITIES =====

/**
 * Create a metrics update event for chart synchronization
 * @param day - Day that was updated
 * @param content - Updated content
 * @param action - Type of action performed
 */
export const emitMetricsUpdateEvent = (
  day: string,
  content: string,
  action: string = 'CONTENT_UPDATED'
): void => {
  const metricsUpdateEvent = new CustomEvent('dailyReportsUpdated', {
    detail: {
      day,
      content,
      action,
      timestamp: new Date().toISOString()
    }
  });
  window.dispatchEvent(metricsUpdateEvent);
  
  if (LOGGING_CONFIG.ENABLED) {
    console.log(`${LOGGING_CONFIG.PREFIXES.SUCCESS} Emitted metrics update event for ${day}:`, action);
  }
};

/**
 * Trigger autosave indicator with cleanup
 * @param setIsAutosaving - State setter for autosave indicator
 * @param delay - Delay before hiding indicator (optional)
 * @returns Cleanup function
 */
export const triggerAutosaveIndicator = (
  setIsAutosaving: (value: boolean) => void,
  delay?: number
): (() => void) => {
  setIsAutosaving(true);
  const autosaveDelay = delay || VALIDATION_RULES.AI_SUGGESTION_DELAY;
  const timer = setTimeout(() => setIsAutosaving(false), autosaveDelay);
  return () => clearTimeout(timer);
};

// ===== AI ASSISTANCE UTILITIES =====

/**
 * Check if AI suggestions should be triggered
 * @param content - Content to check
 * @param aiOptions - AI configuration options
 * @returns Whether to trigger AI suggestions
 */
export const shouldTriggerAISuggestions = (
  content: string,
  aiOptions: { enabled: boolean; suggestContent: boolean }
): boolean => {
  return (
    aiOptions.enabled &&
    aiOptions.suggestContent &&
    content.length > VALIDATION_RULES.AI_TRIGGER_MINIMUM_LENGTH
  );
};

/**
 * Trigger AI typing indicator with cleanup
 * @param setTypingAI - State setter for AI typing indicator
 * @param delay - Delay before hiding indicator (optional)
 * @returns Cleanup function
 */
export const triggerAITypingIndicator = (
  setTypingAI: (value: boolean) => void,
  delay?: number
): (() => void) => {
  setTypingAI(true);
  const typingDelay = delay || VALIDATION_RULES.AI_SUGGESTION_DELAY;
  const timer = setTimeout(() => setTypingAI(false), typingDelay);
  return () => clearTimeout(timer);
};

// ===== ERROR HANDLING UTILITIES =====

/**
 * Handle bulk import errors with user-friendly messages
 * @param error - Error that occurred
 * @param context - Context where error occurred
 * @returns User-friendly error message
 */
export const handleBulkImportError = (error: Error, context: string): string => {
  if (LOGGING_CONFIG.ENABLED) {
    console.error(`${LOGGING_CONFIG.PREFIXES.ERROR} Bulk import error in ${context}:`, error);
  }
  
  // Return user-friendly error messages based on error type
  if (error.message.includes('parsing')) {
    return 'Failed to parse the report format. Please check that each day starts with the day name (Monday, Tuesday, etc.).';
  }
  
  if (error.message.includes('network')) {
    return 'Network error occurred. Please check your connection and try again.';
  }
  
  return 'An unexpected error occurred while processing your report. Please try again or contact support.';
};

/**
 * Validate bulk import text before processing
 * @param text - Text to validate
 * @returns Validation result with errors if any
 */
export const validateBulkImportText = (text: string): { 
  isValid: boolean; 
  errors: string[]; 
  warnings: string[] 
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!text || text.trim().length === 0) {
    errors.push('Please enter some text to parse.');
    return { isValid: false, errors, warnings };
  }
  
  if (text.length < 50) {
    warnings.push('The text seems very short. Make sure you have pasted the complete report.');
  }
  
  // Check for day patterns
  const hasAnyDayPattern = DAY_PARSING_PATTERNS.some(pattern => pattern.test(text));
  if (!hasAnyDayPattern) {
    errors.push('No day names found in the text. Make sure each day starts with the day name (Monday, Tuesday, etc.).');
  }
  
  // Check for reasonable content
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  if (lines.length < 3) {
    warnings.push('The text has very few lines. Make sure you have included content for multiple days.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// ===== EXPORT UTILITY FUNCTIONS =====

/**
 * Export all utility functions for easy importing
 */
export default {
  // Bulk parsing
  parseBulkReport,
  applyBulkImportResults,
  validateBulkImportText,
  
  // Report validation
  validateReportsCompleteness,
  assessContentQuality,
  
  // State management
  getActiveReport,
  findNextIncompleteReport,
  updateReportStatusWithProgression,
  
  // Event handling
  emitMetricsUpdateEvent,
  triggerAutosaveIndicator,
  
  // AI assistance
  shouldTriggerAISuggestions,
  triggerAITypingIndicator,
  
  // Error handling
  handleBulkImportError
};
