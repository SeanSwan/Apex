/**
 * AI Assistant Hooks - Custom React Hooks for AI Assistant Functionality
 * Extracted from AIReportAssistant for better modularity
 * Production-ready hooks for AI state management and content analysis
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Suggestion,
  AIOptions,
  DEFAULT_AI_OPTIONS,
  AI_TIMING_CONSTANTS,
  AI_ANALYSIS_CONFIG,
  getSecurityTipsForDay
} from '../constants/aiAssistantConstants';
import { aiAnalysisEngine, AnalysisResult } from './aiAnalysisEngine';
import { useSuggestionManager, SuggestionProcessingOptions } from './suggestionManager';

/**
 * AI Assistant state interface
 */
export interface AIAssistantState {
  isExpanded: boolean;
  isProcessing: boolean;
  isAnalyzing: boolean;
  suggestions: Suggestion[];
  expandedSuggestion: number | null;
  analysisResult: AnalysisResult | null;
  lastAnalysisTime: number | null;
  contentRef: string;
}

/**
 * AI Assistant actions interface
 */
export interface AIAssistantActions {
  toggleExpanded: () => void;
  setExpanded: (expanded: boolean) => void;
  analyzeContent: () => Promise<void>;
  forceAnalyze: () => Promise<void>;
  clearAnalysis: () => void;
  refreshSuggestions: () => Promise<void>;
}

/**
 * AI Assistant options interface
 */
export interface AIAssistantHookOptions {
  autoAnalyze: boolean;
  autoAnalyzeDelay: number;
  enablePersistence: boolean;
  suggestionOptions: Partial<SuggestionProcessingOptions>;
}

/**
 * Analysis trigger conditions
 */
export interface AnalysisTriggers {
  onExpand: boolean;
  onContentChange: boolean;
  onOptionsChange: boolean;
  minContentLength: number;
  debounceDelay: number;
}

/**
 * Main AI Assistant hook
 */
export const useAIAssistant = (
  content: string,
  day: string,
  securityCode: string,
  dateRange: { start: Date; end: Date },
  aiOptions: AIOptions,
  onChange: (content: string) => void,
  options: Partial<AIAssistantHookOptions> = {}
) => {
  // Merge options with defaults
  const hookOptions = {
    autoAnalyze: true,
    autoAnalyzeDelay: AI_TIMING_CONSTANTS.autoAnalyzeDelay,
    enablePersistence: true,
    suggestionOptions: {
      enableFeedback: true,
      enablePersistence: true,
      autoCollapseAfterApply: true,
      feedbackTimeout: AI_TIMING_CONSTANTS.feedbackTimeout
    },
    ...options
  };

  // State management
  const [state, setState] = useState<AIAssistantState>({
    isExpanded: false,
    isProcessing: false,
    isAnalyzing: false,
    suggestions: [],
    expandedSuggestion: null,
    analysisResult: null,
    lastAnalysisTime: null,
    contentRef: content
  });

  // Refs for stable references
  const contentRef = useRef(content);
  const analysisTimeoutRef = useRef<NodeJS.Timeout>();
  const lastAnalysisRef = useRef<number>(0);

  // Suggestion management
  const {
    state: suggestionState,
    actions: suggestionActions,
    analytics: suggestionAnalytics
  } = useSuggestionManager(hookOptions.suggestionOptions);

  // Update content ref when content changes
  useEffect(() => {
    contentRef.current = content;
    setState(prev => ({ ...prev, contentRef: content }));
  }, [content]);

  // Analysis function
  const analyzeContent = useCallback(async (force: boolean = false) => {
    const currentContent = contentRef.current;
    
    // Skip if already processing or content too short
    if (state.isProcessing || (!force && currentContent.length < AI_ANALYSIS_CONFIG.minContentLength)) {
      return;
    }

    // Skip if analyzed recently (unless forced)
    const now = Date.now();
    if (!force && (now - lastAnalysisRef.current) < AI_TIMING_CONSTANTS.debounceDelay) {
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true, isAnalyzing: true }));

    try {
      const result = await aiAnalysisEngine.analyzeContent(
        currentContent,
        day,
        securityCode,
        dateRange,
        aiOptions
      );

      setState(prev => ({
        ...prev,
        suggestions: result.suggestions,
        analysisResult: result,
        lastAnalysisTime: now,
        isProcessing: false,
        isAnalyzing: false
      }));

      suggestionActions.setSuggestions(result.suggestions);
      lastAnalysisRef.current = now;

    } catch (error) {
      console.error('Error analyzing content:', error);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        isAnalyzing: false,
        suggestions: [],
        analysisResult: null
      }));
    }
  }, [day, securityCode, dateRange, aiOptions, state.isProcessing, suggestionActions]);

  // Force analysis function
  const forceAnalyze = useCallback(async () => {
    await analyzeContent(true);
  }, [analyzeContent]);

  // Auto-analyze when expanded and has content
  useEffect(() => {
    if (state.isExpanded && 
        hookOptions.autoAnalyze && 
        contentRef.current.length >= AI_ANALYSIS_CONFIG.minContentLength && 
        state.suggestions.length === 0) {
      
      // Clear existing timeout
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }

      // Set new timeout
      analysisTimeoutRef.current = setTimeout(() => {
        analyzeContent();
      }, hookOptions.autoAnalyzeDelay);
    }

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [state.isExpanded, hookOptions.autoAnalyze, hookOptions.autoAnalyzeDelay, state.suggestions.length, analyzeContent]);

  // Auto-analyze on content changes (debounced)
  useEffect(() => {
    if (!hookOptions.autoAnalyze || !state.isExpanded) return;

    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    analysisTimeoutRef.current = setTimeout(() => {
      if (contentRef.current.length >= AI_ANALYSIS_CONFIG.minContentLength) {
        analyzeContent();
      }
    }, AI_TIMING_CONSTANTS.debounceDelay);

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [content, hookOptions.autoAnalyze, state.isExpanded, analyzeContent]);

  // Actions
  const actions: AIAssistantActions = {
    toggleExpanded: useCallback(() => {
      setState(prev => ({ ...prev, isExpanded: !prev.isExpanded }));
    }, []),

    setExpanded: useCallback((expanded: boolean) => {
      setState(prev => ({ ...prev, isExpanded: expanded }));
    }, []),

    analyzeContent: analyzeContent,
    
    forceAnalyze: forceAnalyze,

    clearAnalysis: useCallback(() => {
      setState(prev => ({
        ...prev,
        suggestions: [],
        analysisResult: null,
        lastAnalysisTime: null,
        expandedSuggestion: null,
        isProcessing: false,
        isAnalyzing: false
      }));
      
      suggestionActions.resetSuggestions();
    }, [suggestionActions]),

    refreshSuggestions: useCallback(async () => {
      await forceAnalyze();
    }, [forceAnalyze])
  };

  // Enhanced suggestion actions that integrate with onChange
  const enhancedSuggestionActions = {
    ...suggestionActions,
    applySuggestion: useCallback((index: number, improvement: string) => {
      onChange(improvement);
      suggestionActions.applySuggestion(index, improvement);
    }, [onChange, suggestionActions])
  };

  return {
    state: {
      ...state,
      suggestions: suggestionState.suggestions,
      expandedSuggestion: suggestionState.expandedSuggestion,
      feedbackGiven: suggestionState.feedbackGiven,
      appliedSuggestions: suggestionState.appliedSuggestions,
      dismissedSuggestions: suggestionState.dismissedSuggestions
    },
    actions,
    suggestionActions: enhancedSuggestionActions,
    analytics: suggestionAnalytics,
    performance: aiAnalysisEngine.getPerformanceMetrics()
  };
};

/**
 * Hook for security tips management
 */
export const useSecurityTips = (day: string, maxTips: number = 4) => {
  const tips = useMemo(() => {
    const allTips = getSecurityTipsForDay(day);
    
    // Select tips based on day index for consistency
    const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(day);
    const selectedTips = [];
    
    for (let i = 0; i < maxTips && i < allTips.length; i++) {
      selectedTips.push(allTips[(dayIndex + i) % allTips.length]);
    }
    
    return selectedTips;
  }, [day, maxTips]);

  return {
    tips,
    totalAvailable: getSecurityTipsForDay(day).length,
    hasMore: getSecurityTipsForDay(day).length > maxTips
  };
};

/**
 * Hook for AI options management with persistence
 */
export const useAIOptions = (
  initialOptions: AIOptions = DEFAULT_AI_OPTIONS,
  persistenceKey: string = 'ai_assistant_options'
) => {
  const [options, setOptions] = useState<AIOptions>(() => {
    // Load from localStorage if available
    try {
      const stored = localStorage.getItem(persistenceKey);
      if (stored) {
        return { ...initialOptions, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Error loading AI options from storage:', error);
    }
    
    return initialOptions;
  });

  // Save to localStorage when options change
  useEffect(() => {
    try {
      localStorage.setItem(persistenceKey, JSON.stringify(options));
    } catch (error) {
      console.warn('Error saving AI options to storage:', error);
    }
  }, [options, persistenceKey]);

  const updateOptions = useCallback((updates: Partial<AIOptions>) => {
    setOptions(prev => ({ ...prev, ...updates }));
  }, []);

  const resetOptions = useCallback(() => {
    setOptions(initialOptions);
  }, [initialOptions]);

  const toggleOption = useCallback((key: keyof AIOptions) => {
    setOptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  return {
    options,
    updateOptions,
    resetOptions,
    toggleOption
  };
};

/**
 * Hook for analysis performance monitoring
 */
export const useAnalysisPerformance = () => {
  const [metrics, setMetrics] = useState(() => aiAnalysisEngine.getPerformanceMetrics());

  const refreshMetrics = useCallback(() => {
    setMetrics(aiAnalysisEngine.getPerformanceMetrics());
  }, []);

  const clearHistory = useCallback(() => {
    aiAnalysisEngine.clearHistory();
    setMetrics(null);
  }, []);

  // Auto-refresh metrics periodically
  useEffect(() => {
    const interval = setInterval(refreshMetrics, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [refreshMetrics]);

  return {
    metrics,
    refreshMetrics,
    clearHistory
  };
};

/**
 * Hook for content quality monitoring
 */
export const useContentQuality = (content: string) => {
  const [quality, setQuality] = useState<{
    score: number;
    words: number;
    sentences: number;
    avgWordsPerSentence: number;
    readabilityScore: number;
  } | null>(null);

  useEffect(() => {
    if (content.length < 10) {
      setQuality(null);
      return;
    }

    const words = content.split(/\s+/).filter(word => word.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
    
    // Simple readability score based on word and sentence length
    const readabilityScore = Math.max(0, Math.min(100, 
      100 - (avgWordsPerSentence * 2) - (words.filter(w => w.length > 6).length * 0.5)
    ));

    // Overall quality score
    const lengthScore = Math.min(words.length / 100, 1.0);
    const structureScore = Math.min(avgWordsPerSentence / 15, 1.0);
    const score = (lengthScore + structureScore + (readabilityScore / 100)) / 3;

    setQuality({
      score,
      words: words.length,
      sentences: sentences.length,
      avgWordsPerSentence,
      readabilityScore
    });
  }, [content]);

  return quality;
};

/**
 * Hook for AI assistant keyboard shortcuts
 */
export const useAIAssistantShortcuts = (
  actions: AIAssistantActions,
  suggestionActions: any,
  isEnabled: boolean = true
) => {
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + A: Toggle AI Assistant
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        actions.toggleExpanded();
      }

      // Ctrl/Cmd + Shift + R: Refresh Analysis
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
        event.preventDefault();
        actions.forceAnalyze();
      }

      // Escape: Collapse expanded suggestion
      if (event.key === 'Escape') {
        suggestionActions.toggleSuggestion(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [actions, suggestionActions, isEnabled]);
};

/**
 * Hook for AI assistant analytics
 */
export const useAIAssistantAnalytics = () => {
  const [analytics, setAnalytics] = useState<{
    sessionsToday: number;
    suggestionsApplied: number;
    averageSessionTime: number;
    mostUsedFeature: string;
  } | null>(null);

  const trackSession = useCallback(() => {
    const today = new Date().toDateString();
    const key = `ai_analytics_${today}`;
    
    try {
      const stored = localStorage.getItem(key);
      const data = stored ? JSON.parse(stored) : { sessions: 0, applied: 0, startTime: Date.now() };
      
      data.sessions += 1;
      data.lastSession = Date.now();
      
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('Error tracking session:', error);
    }
  }, []);

  const trackSuggestionApplied = useCallback(() => {
    const today = new Date().toDateString();
    const key = `ai_analytics_${today}`;
    
    try {
      const stored = localStorage.getItem(key);
      const data = stored ? JSON.parse(stored) : { sessions: 0, applied: 0 };
      
      data.applied += 1;
      
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('Error tracking suggestion application:', error);
    }
  }, []);

  const getAnalytics = useCallback(() => {
    const today = new Date().toDateString();
    const key = `ai_analytics_${today}`;
    
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        setAnalytics({
          sessionsToday: data.sessions || 0,
          suggestionsApplied: data.applied || 0,
          averageSessionTime: 0, // Could be calculated from session data
          mostUsedFeature: 'content_enhancement' // Could be tracked
        });
      }
    } catch (error) {
      console.warn('Error getting analytics:', error);
    }
  }, []);

  useEffect(() => {
    getAnalytics();
  }, [getAnalytics]);

  return {
    analytics,
    trackSession,
    trackSuggestionApplied,
    refreshAnalytics: getAnalytics
  };
};

export default {
  useAIAssistant,
  useSecurityTips,
  useAIOptions,
  useAnalysisPerformance,
  useContentQuality,
  useAIAssistantShortcuts,
  useAIAssistantAnalytics
};
