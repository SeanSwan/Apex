/**
 * Daily Reports Constants - Configuration and Default Values
 * Extracted from DailyReportsPanel for better modularity and maintainability
 * Production-ready constants with comprehensive type safety
 */

import { DailyReportStatus, SecurityCode, AIOptions } from '../../../types/reports';

// ===== BULK IMPORT PARSING CONSTANTS =====

/**
 * Enhanced day patterns to match various formats in bulk import text
 * Supports multiple common formats for day headers
 */
export const DAY_PARSING_PATTERNS = [
  // Monday (6/9), Monday (6 / 9), Monday(6/9)
  /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*\([^)]+\)/i,
  // Monday - content, Monday: content
  /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*[-:]/i,
  // Just the day name by itself
  /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*$/i,
  // Day with numbers like "Monday 6/9"
  /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+\d/i
] as const;

/**
 * Enhanced summary patterns for detecting summary sections
 * Supports various summary section headers
 */
export const SUMMARY_PARSING_PATTERNS = [
  /^\s*Summary\s*:?/i,
  /^\s*Conclusion\s*:?/i,
  /^\s*Additional\s+Notes\s*:?/i,
  /^\s*Week\s+Summary\s*:?/i,
  /^\s*Weekly\s+Summary\s*:?/i,
  /^\s*Notes\s*:?/i,
  /^\s*Overall\s*:?/i
] as const;

// ===== DROPDOWN OPTIONS =====

/**
 * Available report status options
 */
export const REPORT_STATUS_OPTIONS = [
  { value: 'To update', label: 'To update' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Needs review', label: 'Needs review' }
] as const;

/**
 * Security code options with descriptions
 */
export const SECURITY_CODE_OPTIONS = [
  { value: 'Code 4', label: 'Code 4 (All Clear)' },
  { value: 'Code 3', label: 'Code 3 (Attention Required)' },
  { value: 'Code 2', label: 'Code 2 (Minor Incident)' },
  { value: 'Code 1', label: 'Code 1 (Serious Incident)' }
] as const;

// ===== VALIDATION CONSTANTS =====

/**
 * Word count thresholds for content validation
 */
export const VALIDATION_RULES = {
  MINIMUM_WORD_COUNT: 50,
  SUMMARY_MINIMUM_WORD_COUNT: 25,
  LOW_WORD_COUNT_THRESHOLD: 50,
  MAXIMUM_CHARACTER_COUNT: 5000,
  AI_TRIGGER_MINIMUM_LENGTH: 100,
  AI_SUGGESTION_DELAY: 5000
} as const;

/**
 * Content quality thresholds
 */
export const CONTENT_QUALITY_THRESHOLDS = {
  EXCELLENT: 200,  // words
  GOOD: 100,       // words
  ADEQUATE: 50,    // words
  INSUFFICIENT: 25 // words
} as const;

// ===== DEFAULT VALUES =====

/**
 * Default contact information values
 */
export const DEFAULT_CONTACT_INFO = {
  SIGNATURE: 'Sean Swan',
  EMAIL: 'it@defenseic.com'
} as const;

/**
 * Default AI options configuration
 */
export const DEFAULT_AI_OPTIONS: AIOptions = {
  enabled: false,
  autoCorrect: true,
  enhanceWriting: true,
  suggestContent: true,
  generateSummary: true,
  suggestImprovements: true,
  analyzeThreats: false,
  highlightPatterns: true
} as const;

/**
 * Default processing timing values
 */
export const PROCESSING_TIMING = {
  BULK_IMPORT_DELAY: 1000,      // ms - simulated processing time
  AUTOSAVE_INDICATOR_DELAY: 1500, // ms - how long to show autosave indicator
  AI_GENERATION_DELAY: 1500,    // ms - simulated AI generation time
  TYPING_AI_DELAY: 5000         // ms - how long to show AI typing indicator
} as const;

// ===== PLACEHOLDER TEXT =====

/**
 * Placeholder text for various input fields
 */
export const PLACEHOLDER_TEXT = {
  DAILY_REPORT: (day: string) => `Enter security report for ${day}...`,
  BULK_IMPORT: 'Paste your weekly report here in this format:',
  SUMMARY_NOTES: 'Enter weekly summary, additional notes, or overall observations...',
  CONTACT_NAME: 'Sean Swan',
  CONTACT_EMAIL: 'it@defenseic.com'
} as const;

// ===== SAMPLE BULK IMPORT TEXT =====

/**
 * Sample text for demonstrating bulk import functionality
 */
export const SAMPLE_BULK_IMPORT_TEXT = `Monday (6/9)
Remote camera surveillance commenced the week with diligent observation focused on the external parking areas situated near the leasing office, as well as the visible front-unit garages. Vehicle traffic remained normal throughout the shift.

Tuesday (6/10)
Live monitoring continued with focused attention on vehicle traffic at the main entrance and exit points, consistently utilizing LPR data for routine security logging. No unusual activity observed.

Wednesday (6/11)
Mid-week camera sweeps included general observation of common pathways and resident access points within the system's field of view. Routine maintenance personnel observed working on landscaping.

Thursday (6/12)
Security cameras maintained diligent and uninterrupted oversight of all visible areas of the property. Delivery trucks noted at multiple units throughout the day.

Friday (6/13)
Remote surveillance continued with standard operational awareness around property entry and exit points. Increased visitor traffic noted in evening hours.

Saturday (6/14)
Weekend monitoring included observation of recreational areas and common spaces. Several residents observed using pool and fitness facilities.

Sunday (6/15)
Final day of monitoring week maintained consistent surveillance protocols. Quiet day with minimal activity observed.

Summary: This was an uneventful week with no specific incidents reported. Continuous camera monitoring focused on visible parking areas, access points, and LPR data logging. All security protocols maintained successfully.` as const;

/**
 * Test format examples for bulk import
 */
export const TEST_FORMAT_EXAMPLES = {
  COLON_FORMAT: `Monday:
Test content for Monday with colon format.

Tuesday
Test content for Tuesday with just day name.

Wednesday (3/15)
Test content for Wednesday with parentheses.

Notes: This is a test summary.`,

  DASH_FORMAT: `Monday - 6/10
Test content with dash format.

Tuesday - 6/11
More test content.

Summary: Test summary section.`,

  PARENTHESES_FORMAT: `Monday (6/10)
Test content with parentheses.

Tuesday (6/11)
More test content.

Conclusion: Test conclusion section.`
} as const;

// ===== UI MESSAGES =====

/**
 * User interface messages and notifications
 */
export const UI_MESSAGES = {
  BULK_IMPORT: {
    DESCRIPTION: `🚀 **Automation Mode**: Paste your complete weekly report below and we'll automatically split it into individual days.<br/><br/>
    <strong>Supported formats:</strong><br/>
    • "Monday (6/9)" or "Monday (6 / 9)"<br/>
    • "Monday:" or "Monday -"<br/>
    • Just "Monday" on its own line<br/>
    • "Monday 6/9" (without parentheses)<br/><br/>
    Summary sections starting with "Summary:", "Notes:", or "Conclusion:" will be automatically detected.`,
    
    PARSING_TIPS: `⚠️ <strong>Parsing Tips:</strong> Make sure each day starts with the day name (Monday, Tuesday, etc.) followed by optional date info. Check the browser console (F12) for detailed parsing logs.`,
    
    SUCCESS: (count: number) => `✅ Successfully imported ${count} daily reports!`,
    
    NO_CONTENT_WARNING: 'No parsed reports to apply',
    
    PROCESSING: 'Parsing your weekly report...',
    
    AI_SUGGESTING: 'AI suggesting improvements...'
  },
  
  AUTOSAVE: 'Saving...',
  
  GENERATION: {
    AI_GENERATE: 'AI Generate',
    GENERATING: 'Generating...',
    GENERATE_SUMMARY: 'Generate Summary with AI'
  },
  
  COMPLETION: {
    MARK_COMPLETED: 'Mark as Completed',
    COMPLETED: 'Completed'
  },
  
  PROGRESS: {
    COMPLETION_PROGRESS: 'Completion Progress:',
    OF_DAYS: (completed: number, total: number) => `${completed} of ${total} days`
  },
  
  ERRORS: {
    INSUFFICIENT_CONTENT: 'Report must contain at least 50 words to mark as completed',
    PARSING_FAILED: 'No daily reports found in the provided text. Try checking the format.',
    AI_DISABLED: 'AI features are currently disabled'
  }
} as const;

// ===== BUTTON TEXT =====

/**
 * Button labels and text
 */
export const BUTTON_TEXT = {
  BULK_IMPORT: {
    PARSE_REPORT: 'Parse Report',
    PROCESSING: 'Processing...',
    LOAD_SAMPLE: 'Load Sample',
    TEST_FORMAT: 'Test Format',
    HIDE_BULK_IMPORT: 'Hide Bulk Import',
    SHOW_BULK_IMPORT: 'Show Bulk Import',
    APPLY_ALL_REPORTS: 'Apply All Reports'
  },
  
  NAVIGATION: {
    SHOW_ALL_DAYS: 'Show All Days',
    HIDE_DAYS: 'Hide Days'
  },
  
  AI: {
    ENABLE_AI: 'Enable AI',
    GENERATE: 'AI Generate',
    GENERATING: 'Generating...'
  }
} as const;

// ===== ANIMATION CONSTANTS =====

/**
 * Animation durations and easing functions
 */
export const ANIMATION_CONFIG = {
  DURATIONS: {
    FAST: '0.2s',
    NORMAL: '0.3s',
    SLOW: '0.5s',
    AI_PULSE: '2s'
  },
  
  EASING: {
    EASE_IN_OUT: 'ease-in-out',
    EASE_OUT: 'ease',
    BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  }
} as const;

// ===== RESPONSIVE BREAKPOINTS =====

/**
 * Responsive design breakpoints specific to daily reports
 */
export const DAILY_REPORTS_BREAKPOINTS = {
  MOBILE: '480px',
  TABLET: '640px',
  DESKTOP: '768px',
  LARGE_DESKTOP: '1024px'
} as const;

// ===== LOGGING CONFIGURATION =====

/**
 * Console logging configuration for development
 */
export const LOGGING_CONFIG = {
  ENABLED: process.env.NODE_ENV === 'development',
  PREFIXES: {
    PARSING: '📄',
    DAY_DETECTION: '📅',
    CONTENT: '📝',
    SUMMARY: '📋',
    SAVE: '💾',
    ERROR: '⚠️',
    SUCCESS: '✅',
    AI: '🤖'
  }
} as const;

// ===== TYPE EXPORTS =====

/**
 * Type definitions for daily reports constants
 */
export type DayParsingPattern = typeof DAY_PARSING_PATTERNS[number];
export type SummaryParsingPattern = typeof SUMMARY_PARSING_PATTERNS[number];
export type ReportStatusOption = typeof REPORT_STATUS_OPTIONS[number];
export type SecurityCodeOption = typeof SECURITY_CODE_OPTIONS[number];
export type TestFormatExample = keyof typeof TEST_FORMAT_EXAMPLES;

/**
 * Parsed report interface for bulk import
 */
export interface ParsedReport {
  day: string;
  content: string;
}

/**
 * Bulk import state interface
 */
export interface BulkImportState {
  text: string;
  isProcessing: boolean;
  parsedReports: ParsedReport[];
  showPreview: boolean;
}

/**
 * Content quality assessment interface
 */
export interface ContentQuality {
  wordCount: number;
  quality: 'excellent' | 'good' | 'adequate' | 'insufficient';
  isValid: boolean;
  suggestions?: string[];
}

// ===== UTILITY FUNCTIONS =====

/**
 * Get content quality assessment based on word count
 */
export const getContentQuality = (content: string): ContentQuality => {
  const wordCount = content.trim().split(/\s+/).length;
  
  let quality: ContentQuality['quality'];
  if (wordCount >= CONTENT_QUALITY_THRESHOLDS.EXCELLENT) {
    quality = 'excellent';
  } else if (wordCount >= CONTENT_QUALITY_THRESHOLDS.GOOD) {
    quality = 'good';
  } else if (wordCount >= CONTENT_QUALITY_THRESHOLDS.ADEQUATE) {
    quality = 'adequate';
  } else {
    quality = 'insufficient';
  }
  
  return {
    wordCount,
    quality,
    isValid: wordCount >= VALIDATION_RULES.MINIMUM_WORD_COUNT,
    suggestions: quality === 'insufficient' ? [
      'Add more specific details about security observations',
      'Include timing information for any incidents',
      'Mention specific areas that were monitored'
    ] : undefined
  };
};

/**
 * Check if content meets minimum requirements
 */
export const isContentSufficient = (content: string | undefined): boolean => {
  if (!content) return false;
  const wordCount = content.trim().split(/\s+/).length;
  return wordCount >= VALIDATION_RULES.MINIMUM_WORD_COUNT;
};

/**
 * Get word count from text content
 */
export const getWordCount = (text: string | undefined): number => {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
};

/**
 * Format success message for bulk import
 */
export const formatBulkImportSuccess = (reports: ParsedReport[]): string => {
  const appliedCount = reports.filter(r => r.content.trim().length > 0).length;
  return `${UI_MESSAGES.BULK_IMPORT.SUCCESS(appliedCount)}\n\nReports applied:\n${reports.map(r => `• ${r.day}: ${getWordCount(r.content)} words`).join('\n')}`;
};
