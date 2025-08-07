/**
 * APEX AI VISUAL ALERTS COMPONENTS - TIER 2 EXPORTS
 * =================================================
 * Central export file for all TIER 2 visual alert system components
 */

// Core visual alert components
export { default as BlinkingBorderOverlay, THREAT_COLORS, ThreatLevels, getAnimationConfig } from './BlinkingBorderOverlay'
export { default as AlertManager, ALERT_CONFIG, ALERT_STATS_INITIAL } from './AlertManager'
export { default as AudioAlertController, AUDIO_CONFIG } from './AudioAlertController'
export { default as VoiceResponsePanel, SECURITY_SCRIPTS, CONVERSATION_CONFIG } from './VoiceResponsePanel'

// Demo and testing components
export { default as Tier2VisualAlertsDemo } from './Tier2VisualAlertsDemo'

// Type definitions and configurations
export const VISUAL_ALERT_TYPES = {
  BORDER_OVERLAY: 'border_overlay',
  FULL_SCREEN_FLASH: 'full_screen_flash',
  ZONE_HIGHLIGHT: 'zone_highlight',
  TEXT_ALERT: 'text_alert'
}

export const AUDIO_ALERT_TYPES = {
  TONE: 'tone',
  VOICE: 'voice',
  SPATIAL: 'spatial',
  DIRECTIONAL: 'directional'
}

export const CONVERSATION_STATES = {
  IDLE: 'idle',
  STARTING: 'starting',
  ACTIVE: 'active',
  PROCESSING: 'processing',
  ENDING: 'ending',
  ERROR: 'error'
}