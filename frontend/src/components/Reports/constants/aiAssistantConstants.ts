/**
 * AI Assistant Constants - Configuration, Rules, and Static Data
 * Extracted from AIReportAssistant for better modularity
 * Production-ready constants for AI-powered security report analysis
 */

import { keyframes } from 'styled-components';

// === ANIMATION KEYFRAMES ===
export const aiAnimations = {
  spin: keyframes`
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  `,
  fadeIn: keyframes`
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  `,
  slideDown: keyframes`
    from { max-height: 0; opacity: 0; }
    to { max-height: 300px; opacity: 1; }
  `,
  pulse: keyframes`
    0% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(124, 58, 237, 0); }
    100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0); }
  `
};

// === SUGGESTION TYPES ===
export const SUGGESTION_TYPES = {
  GRAMMAR: 'grammar',
  CONTENT: 'content', 
  SECURITY: 'security',
  IMPROVEMENT: 'improvement'
} as const;

export type SuggestionType = typeof SUGGESTION_TYPES[keyof typeof SUGGESTION_TYPES];

// === AI OPTIONS INTERFACE ===
export interface AIOptions {
  enabled: boolean;
  autoCorrect?: boolean;
  enhanceWriting?: boolean;
  suggestImprovements?: boolean;
  suggestContent?: boolean;
  analyzeThreats?: boolean;
  generateSummary?: boolean;
}

// === SUGGESTION INTERFACE ===
export interface Suggestion {
  type: SuggestionType;
  title: string;
  issue?: string;
  suggestion: string;
  text: string;
  improvement: string;
  confidence?: number;
  priority?: 'low' | 'medium' | 'high';
}

// === GRAMMAR CHECKING PATTERNS ===
export const GRAMMAR_PATTERNS = [
  { regex: /\bthier\b/gi, correction: 'their', type: 'spelling' },
  { regex: /\byour\b([^a-zA-Z])(welcome|right)/gi, replacement: "you're$1$2", type: 'contraction' },
  { regex: /\bit's\b([^a-zA-Z])(time|getting|way)/gi, replacement: "its$1$2", type: 'possessive' },
  { regex: /\beffect\b([^a-zA-Z])(on|of)/gi, replacement: "affect$1$2", type: 'word_choice' },
  { regex: /\bteh\b/gi, correction: 'the', type: 'spelling' },
  { regex: /\bto (much|many)\b/gi, replacement: "too $1", type: 'word_choice' },
  { regex: /\balot\b/gi, correction: 'a lot', type: 'spelling' },
  { regex: /\bdefinately\b/gi, correction: 'definitely', type: 'spelling' },
  { regex: /\breceive\b/gi, correction: 'receive', type: 'spelling' },
  { regex: /\boccured\b/gi, correction: 'occurred', type: 'spelling' },
  { regex: /\bseperate\b/gi, correction: 'separate', type: 'spelling' },
  { regex: /\bthru\b/gi, correction: 'through', type: 'informal' },
  { regex: /\bwont\b/gi, correction: "won't", type: 'contraction' },
  { regex: /\bcant\b/gi, correction: "can't", type: 'contraction' },
  { regex: /\bdont\b/gi, correction: "don't", type: 'contraction' },
  { regex: /\s{2,}/g, correction: ' ', type: 'spacing' }
] as const;

// === CONTENT ENHANCEMENT PATTERNS ===
export const CONTENT_ENHANCEMENT_PATTERNS = {
  TIME_SPECIFIC: {
    regex: /\b([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]\b|\b([0-9]|0[0-9]|1[0-9]|2[0-3]) (am|pm|AM|PM)\b/,
    enhancement: 'Add time-specific information',
    description: 'Consider adding specific times for security activities to provide a more detailed chronological record.',
    template: 'Security monitoring began at 00:00 hours with all systems operational. Perimeter checks were conducted at 08:00, 12:00, 16:00, and 20:00 hours with all access points confirmed secure throughout the monitoring period.'
  },
  CAMERA_INFO: {
    regex: /\b(camera|surveillance|monitor|video|footage)\b/i,
    enhancement: 'Include surveillance system details',
    description: 'Add information about camera systems and surveillance monitoring to document security technology performance.',
    template: 'All surveillance cameras remained fully operational with 100% uptime throughout the monitoring period. Video quality was excellent with no technical issues detected. Recording systems functioning normally with all footage properly archived according to retention policies.'
  },
  ACCESS_INFO: {
    regex: /\b(access|entry|door|gate|credential|badge|key|lock)\b/i,
    enhancement: 'Add access control information',
    description: 'Include details about access points and credential verification procedures.',
    template: 'All access points were maintained in secure status with proper credential verification for all personnel. Access control systems functioned without technical issues and all entries were properly logged in the system. No unauthorized access attempts were detected.'
  },
  PATROL_INFO: {
    regex: /\b(patrol|walk|inspection|check|tour)\b/i,
    enhancement: 'Include patrol and inspection details',
    description: 'Add information about security patrols and site inspections conducted.',
    template: 'Regular security patrols were conducted throughout the monitoring period with comprehensive coverage of all designated areas. Physical inspections confirmed all access points, sensitive areas, and perimeter zones remained properly secured with no evidence of tampering or unauthorized access.'
  }
} as const;

// === SECURITY SUGGESTION PATTERNS ===
export const SECURITY_SUGGESTION_PATTERNS = {
  COMPLIANCE: {
    regex: /(compliance|compliant|regulation|requirement|standard)/i,
    title: 'Add compliance information',
    description: 'Include a statement about compliance with security standards and requirements.',
    template: 'All security operations were conducted in full compliance with established security protocols and regulatory requirements. Required documentation has been properly maintained and is available for audit purposes as needed.'
  },
  PERSONNEL: {
    regex: /(personnel|staff|employee|guard)/i,
    title: 'Add security personnel information',
    description: 'Include details about security personnel activities and staffing.',
    template: 'Security personnel maintained proper coverage of all assigned posts with no staffing gaps. All security staff demonstrated appropriate attention to detail and adherence to established protocols. Communication between security team members remained effective throughout the monitoring period.'
  }
} as const;

// === SECURITY TIPS BY DAY ===
export const SECURITY_TIPS_BY_DAY = {
  'Monday': [
    {
      title: 'Weekend Transition Security',
      content: 'Conduct thorough facility checks after weekend periods to ensure all systems remained secure and operational during reduced staffing periods.'
    },
    {
      title: 'Credential Verification',
      content: 'Increase attention to credential verification on Mondays as staff may be using backup access methods after weekend absences.'
    },
    {
      title: 'System Status Verification',
      content: 'Verify all security systems resumed normal operation after any weekend maintenance or power cycling activities.'
    },
    {
      title: 'Visitor Traffic Management',
      content: 'Prepare for increased visitor traffic on Mondays with contractors and vendors resuming business activities after the weekend.'
    }
  ],
  'Tuesday': [
    {
      title: 'Perimeter Assessment',
      content: 'Conduct detailed perimeter checks to identify any weekend security concerns that may have gone undetected.'
    },
    {
      title: 'Communication Protocols',
      content: 'Review and test communication protocols to ensure all team members are aligned after the weekend transition.'
    },
    {
      title: 'Equipment Functionality',
      content: 'Verify all security equipment is functioning at optimal levels and address any issues from weekend operations.'
    },
    {
      title: 'Documentation Review',
      content: 'Review weekend incident reports and security logs to identify any patterns or areas requiring increased attention.'
    }
  ],
  'Wednesday': [
    {
      title: 'Mid-Week Security Assessment',
      content: 'Conduct comprehensive mid-week security assessment to evaluate the effectiveness of current security measures.'
    },
    {
      title: 'Training Reinforcement',
      content: 'Use mid-week periods for security training reinforcement and procedure review with all team members.'
    },
    {
      title: 'Preventive Maintenance',
      content: 'Schedule and conduct preventive maintenance on security systems during typically lower-activity periods.'
    },
    {
      title: 'Policy Compliance Review',
      content: 'Review compliance with security policies and procedures, making adjustments as needed for optimal effectiveness.'
    }
  ],
  'Thursday': [
    {
      title: 'Pre-Weekend Preparation',
      content: 'Begin preparations for weekend security operations, ensuring all systems and personnel are ready for schedule changes.'
    },
    {
      title: 'Access Control Review',
      content: 'Review access control systems and credential status to prepare for any weekend access requirements.'
    },
    {
      title: 'Emergency Preparedness',
      content: 'Verify emergency response procedures and contact information are current and accessible for weekend operations.'
    },
    {
      title: 'Surveillance System Check',
      content: 'Conduct thorough surveillance system checks to ensure optimal performance during weekend monitoring periods.'
    }
  ],
  'Friday': [
    {
      title: 'Weekend Security Handoff',
      content: 'Ensure proper security handoff procedures for weekend operations, including detailed briefings on current security status.'
    },
    {
      title: 'Extended Access Management',
      content: 'Manage increased after-hours access requests typical of Friday evening business activities and social events.'
    },
    {
      title: 'Incident Documentation',
      content: 'Complete all weekly incident documentation and security reports to ensure proper records for weekend reference.'
    },
    {
      title: 'System Backup Verification',
      content: 'Verify all security system backups are current and functioning properly before reduced weekend staffing periods.'
    }
  ],
  'Saturday': [
    {
      title: 'Weekend Patrol Coverage',
      content: 'Maintain comprehensive patrol coverage with adjusted schedules to account for reduced regular staffing on weekends.'
    },
    {
      title: 'Visitor Access Control',
      content: 'Implement enhanced visitor access control procedures for weekend activities and special events.'
    },
    {
      title: 'System Monitoring',
      content: 'Increase attention to automated system monitoring during periods of reduced human oversight on weekends.'
    },
    {
      title: 'Emergency Response Readiness',
      content: 'Ensure emergency response capabilities remain fully operational with appropriate contact procedures for weekend situations.'
    }
  ],
  'Sunday': [
    {
      title: 'Pre-Monday Preparation',
      content: 'Conduct comprehensive facility preparation for Monday business resumption, including security system verification.'
    },
    {
      title: 'Weekly Summary Documentation',
      content: 'Prepare weekly security summary documentation highlighting key activities, incidents, and system performance.'
    },
    {
      title: 'Maintenance Window Utilization',
      content: 'Utilize Sunday periods for security system maintenance activities that require minimal operational disruption.'
    },
    {
      title: 'Staff Scheduling Coordination',
      content: 'Coordinate security staff scheduling and briefings for the upcoming week to ensure seamless operational transition.'
    }
  ]
} as const;

// === AI ANALYSIS CONFIGURATION ===
export const AI_ANALYSIS_CONFIG = {
  minContentLength: 50,
  processingDelay: 1500,
  maxSuggestions: 10,
  confidenceThreshold: 0.7,
  priorities: {
    high: ['security', 'compliance'],
    medium: ['grammar', 'improvement'],
    low: ['content', 'enhancement']
  }
} as const;

// === TIMING CONSTANTS ===
export const AI_TIMING_CONSTANTS = {
  animationDuration: 300,
  processingDelay: 1500,
  feedbackTimeout: 3000,
  autoAnalyzeDelay: 2000,
  debounceDelay: 500
} as const;

// === SUGGESTION BADGE COLORS ===
export const SUGGESTION_BADGE_COLORS = {
  [SUGGESTION_TYPES.GRAMMAR]: {
    background: '#d1fae5',
    color: '#047857'
  },
  [SUGGESTION_TYPES.SECURITY]: {
    background: '#dbeafe', 
    color: '#1e40af'
  },
  [SUGGESTION_TYPES.CONTENT]: {
    background: '#fef3c7',
    color: '#b45309'
  },
  [SUGGESTION_TYPES.IMPROVEMENT]: {
    background: '#e0e7ff',
    color: '#4338ca'
  }
} as const;

// === RESPONSIVE BREAKPOINTS ===
export const AI_RESPONSIVE_BREAKPOINTS = {
  mobile: '640px',
  tablet: '768px',
  desktop: '1024px'
} as const;

// === SECURITY CODE CONFIGURATIONS ===
export const SECURITY_CODE_CONFIG = {
  'Code 1': {
    level: 'critical',
    description: 'Emergency situation requiring immediate response',
    suggestions: ['incident_response', 'emergency_protocols', 'notification_procedures']
  },
  'Code 2': {
    level: 'high',
    description: 'Security breach or significant incident',
    suggestions: ['security_breach', 'investigation_procedures', 'containment_measures']
  },
  'Code 3': {
    level: 'medium', 
    description: 'Minor security concern or irregularity',
    suggestions: ['monitoring_enhancement', 'preventive_measures', 'documentation']
  },
  'Code 4': {
    level: 'normal',
    description: 'All clear - normal operations',
    suggestions: ['routine_operations', 'maintenance', 'training']
  }
} as const;

// === CONTENT ANALYSIS KEYWORDS ===
export const CONTENT_ANALYSIS_KEYWORDS = {
  security: ['security', 'secure', 'protection', 'surveillance', 'monitor', 'guard', 'patrol', 'access', 'perimeter'],
  time: ['hour', 'hours', 'time', 'am', 'pm', 'morning', 'afternoon', 'evening', 'night', 'shift'],
  personnel: ['staff', 'personnel', 'guard', 'officer', 'team', 'employee', 'member'],
  systems: ['camera', 'system', 'equipment', 'device', 'technology', 'alarm', 'sensor'],
  incidents: ['incident', 'event', 'occurrence', 'situation', 'issue', 'problem', 'concern'],
  compliance: ['compliance', 'regulation', 'requirement', 'standard', 'policy', 'procedure', 'protocol']
} as const;

// === DEFAULT AI OPTIONS ===
export const DEFAULT_AI_OPTIONS: AIOptions = {
  enabled: true,
  autoCorrect: true,
  enhanceWriting: true,
  suggestImprovements: true,
  suggestContent: true,
  analyzeThreats: false,
  generateSummary: false
} as const;

// === ENHANCEMENT TEMPLATES ===
export const ENHANCEMENT_TEMPLATES = {
  TIME_SPECIFIC: 'Security monitoring began at 00:00 hours with all systems operational. Perimeter checks were conducted at 08:00, 12:00, 16:00, and 20:00 hours with all access points confirmed secure throughout the monitoring period.',
  
  SURVEILLANCE: 'All surveillance cameras remained fully operational with 100% uptime throughout the monitoring period. Video quality was excellent with no technical issues detected. Recording systems functioning normally with all footage properly archived according to retention policies.',
  
  ACCESS_CONTROL: 'All access points were maintained in secure status with proper credential verification for all personnel. Access control systems functioned without technical issues and all entries were properly logged in the system. No unauthorized access attempts were detected.',
  
  PATROL_DETAILS: 'Regular security patrols were conducted throughout the monitoring period with comprehensive coverage of all designated areas. Physical inspections confirmed all access points, sensitive areas, and perimeter zones remained properly secured with no evidence of tampering or unauthorized access.',
  
  COMPLIANCE: 'All security operations were conducted in full compliance with established security protocols and regulatory requirements. Required documentation has been properly maintained and is available for audit purposes as needed.',
  
  PERSONNEL: 'Security personnel maintained proper coverage of all assigned posts with no staffing gaps. All security staff demonstrated appropriate attention to detail and adherence to established protocols. Communication between security team members remained effective throughout the monitoring period.',
  
  INCIDENT_RESPONSE: 'In response to the security situation, proper incident response protocols were followed according to established procedures. All required notifications were made to appropriate personnel, and the situation was documented according to security incident reporting requirements. Follow-up actions have been scheduled as appropriate to prevent recurrence.'
} as const;

// === VALIDATION RULES ===
export const AI_VALIDATION_RULES = {
  minSuggestionConfidence: 0.6,
  maxSuggestionsPerType: 3,
  requiredContentLength: 50,
  maxProcessingTime: 5000
} as const;

// === FEEDBACK TYPES ===
export const FEEDBACK_TYPES = {
  HELPFUL: 'helpful',
  NOT_HELPFUL: 'not-helpful',
  APPLIED: 'applied',
  DISMISSED: 'dismissed'
} as const;

export type FeedbackType = typeof FEEDBACK_TYPES[keyof typeof FEEDBACK_TYPES];

// === UTILITY FUNCTIONS ===
export const getSecurityTipsForDay = (day: string) => {
  return SECURITY_TIPS_BY_DAY[day as keyof typeof SECURITY_TIPS_BY_DAY] || SECURITY_TIPS_BY_DAY.Monday;
};

export const getSuggestionBadgeColor = (type: SuggestionType) => {
  return SUGGESTION_BADGE_COLORS[type] || SUGGESTION_BADGE_COLORS[SUGGESTION_TYPES.IMPROVEMENT];
};

export const getSecurityCodeConfig = (code: string) => {
  return SECURITY_CODE_CONFIG[code as keyof typeof SECURITY_CODE_CONFIG] || SECURITY_CODE_CONFIG['Code 4'];
};

export const getDayIndex = (day: string): number => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days.indexOf(day);
};

export default {
  aiAnimations,
  SUGGESTION_TYPES,
  GRAMMAR_PATTERNS,
  CONTENT_ENHANCEMENT_PATTERNS,
  SECURITY_SUGGESTION_PATTERNS,
  SECURITY_TIPS_BY_DAY,
  AI_ANALYSIS_CONFIG,
  AI_TIMING_CONSTANTS,
  SUGGESTION_BADGE_COLORS,
  AI_RESPONSIVE_BREAKPOINTS,
  SECURITY_CODE_CONFIG,
  CONTENT_ANALYSIS_KEYWORDS,
  DEFAULT_AI_OPTIONS,
  ENHANCEMENT_TEMPLATES,
  AI_VALIDATION_RULES,
  FEEDBACK_TYPES,
  getSecurityTipsForDay,
  getSuggestionBadgeColor,
  getSecurityCodeConfig,
  getDayIndex
};
