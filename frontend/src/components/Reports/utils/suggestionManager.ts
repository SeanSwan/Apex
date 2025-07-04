/**
 * Suggestion Manager - Suggestion Processing and State Management
 * Extracted from AIReportAssistant for better modularity
 * Production-ready suggestion handling with feedback and persistence
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Suggestion,
  AIOptions,
  FeedbackType,
  FEEDBACK_TYPES,
  AI_TIMING_CONSTANTS,
  AI_VALIDATION_RULES
} from '../constants/aiAssistantConstants';

/**
 * Suggestion state interface
 */
export interface SuggestionState {
  suggestions: Suggestion[];
  expandedSuggestion: number | null;
  feedbackGiven: Record<number, FeedbackType | null>;
  appliedSuggestions: Set<number>;
  dismissedSuggestions: Set<number>;
  processingStates: Record<number, boolean>;
}

/**
 * Suggestion actions interface
 */
export interface SuggestionActions {
  setSuggestions: (suggestions: Suggestion[]) => void;
  toggleSuggestion: (index: number) => void;
  applySuggestion: (index: number, improvement: string) => void;
  dismissSuggestion: (index: number) => void;
  recordFeedback: (index: number, feedback: FeedbackType) => void;
  clearFeedback: (index: number) => void;
  resetSuggestions: () => void;
  bulkDismiss: (indices: number[]) => void;
  bulkApply: (indices: number[], onApply: (improvement: string) => void) => void;
}

/**
 * Suggestion processing options
 */
export interface SuggestionProcessingOptions {
  enableFeedback: boolean;
  enablePersistence: boolean;
  maxConcurrentProcessing: number;
  autoCollapseAfterApply: boolean;
  feedbackTimeout: number;
}

/**
 * Suggestion analytics interface
 */
export interface SuggestionAnalytics {
  totalSuggestions: number;
  appliedCount: number;
  dismissedCount: number;
  feedbackCount: Record<FeedbackType, number>;
  averageTimeToAction: number;
  mostCommonType: string;
  conversionRate: number;
}

/**
 * Suggestion manager class for advanced suggestion handling
 */
export class SuggestionManager {
  private suggestions: Suggestion[] = [];
  private feedback: Record<string, { type: FeedbackType; timestamp: number }> = {};
  private analytics: SuggestionAnalytics | null = null;
  private persistenceKey: string;

  constructor(persistenceKey: string = 'ai_suggestion_feedback') {
    this.persistenceKey = persistenceKey;
    this.loadFeedbackFromStorage();
  }

  /**
   * Process suggestions with filtering and enhancement
   */
  processSuggestions(
    rawSuggestions: Suggestion[],
    options: Partial<SuggestionProcessingOptions> = {}
  ): Suggestion[] {
    const processed = rawSuggestions
      .filter(this.validateSuggestion)
      .map(this.enhanceSuggestion.bind(this))
      .sort(this.prioritizeSuggestions);

    this.suggestions = processed;
    this.updateAnalytics();

    return processed;
  }

  /**
   * Apply suggestion and track metrics
   */
  applySuggestion(
    suggestionIndex: number,
    onApply: (improvement: string) => void
  ): boolean {
    const suggestion = this.suggestions[suggestionIndex];
    
    if (!suggestion) {
      console.warn('Suggestion not found for index:', suggestionIndex);
      return false;
    }

    try {
      onApply(suggestion.improvement);
      this.recordAction(suggestionIndex, 'applied');
      return true;
    } catch (error) {
      console.error('Error applying suggestion:', error);
      return false;
    }
  }

  /**
   * Dismiss suggestion and track metrics
   */
  dismissSuggestion(suggestionIndex: number): boolean {
    const suggestion = this.suggestions[suggestionIndex];
    
    if (!suggestion) {
      console.warn('Suggestion not found for index:', suggestionIndex);
      return false;
    }

    this.recordAction(suggestionIndex, 'dismissed');
    return true;
  }

  /**
   * Record user feedback
   */
  recordFeedback(
    suggestionIndex: number,
    feedbackType: FeedbackType,
    additionalData?: Record<string, any>
  ): void {
    const suggestion = this.suggestions[suggestionIndex];
    
    if (!suggestion) {
      console.warn('Cannot record feedback for non-existent suggestion');
      return;
    }

    const feedbackKey = this.generateFeedbackKey(suggestion);
    
    this.feedback[feedbackKey] = {
      type: feedbackType,
      timestamp: Date.now(),
      ...additionalData
    };

    this.saveFeedbackToStorage();
    this.updateAnalytics();
  }

  /**
   * Get suggestion feedback
   */
  getFeedback(suggestionIndex: number): { type: FeedbackType; timestamp: number } | null {
    const suggestion = this.suggestions[suggestionIndex];
    
    if (!suggestion) return null;

    const feedbackKey = this.generateFeedbackKey(suggestion);
    return this.feedback[feedbackKey] || null;
  }

  /**
   * Clear feedback for a suggestion
   */
  clearFeedback(suggestionIndex: number): void {
    const suggestion = this.suggestions[suggestionIndex];
    
    if (!suggestion) return;

    const feedbackKey = this.generateFeedbackKey(suggestion);
    delete this.feedback[feedbackKey];
    
    this.saveFeedbackToStorage();
    this.updateAnalytics();
  }

  /**
   * Get analytics for suggestions
   */
  getAnalytics(): SuggestionAnalytics | null {
    return this.analytics;
  }

  /**
   * Export feedback data
   */
  exportFeedbackData(): Record<string, any> {
    return {
      feedback: this.feedback,
      analytics: this.analytics,
      exportedAt: Date.now(),
      version: '1.0'
    };
  }

  /**
   * Import feedback data
   */
  importFeedbackData(data: Record<string, any>): boolean {
    try {
      if (data.feedback) {
        this.feedback = data.feedback;
        this.saveFeedbackToStorage();
      }
      
      this.updateAnalytics();
      return true;
    } catch (error) {
      console.error('Error importing feedback data:', error);
      return false;
    }
  }

  /**
   * Private methods
   */
  private validateSuggestion(suggestion: Suggestion): boolean {
    return (
      suggestion.type &&
      suggestion.title &&
      suggestion.text &&
      suggestion.improvement &&
      (suggestion.confidence || 0.7) >= AI_VALIDATION_RULES.minSuggestionConfidence
    );
  }

  private enhanceSuggestion(suggestion: Suggestion): Suggestion {
    // Add unique identifier if missing
    if (!suggestion.id) {
      suggestion.id = this.generateSuggestionId(suggestion);
    }

    // Add confidence score if missing
    if (!suggestion.confidence) {
      suggestion.confidence = this.estimateConfidence(suggestion);
    }

    // Add priority if missing
    if (!suggestion.priority) {
      suggestion.priority = this.estimatePriority(suggestion);
    }

    return suggestion;
  }

  private prioritizeSuggestions(a: Suggestion, b: Suggestion): number {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    
    const aPriority = priorityOrder[a.priority || 'medium'];
    const bPriority = priorityOrder[b.priority || 'medium'];
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    
    return (b.confidence || 0.7) - (a.confidence || 0.7);
  }

  private generateSuggestionId(suggestion: Suggestion): string {
    const content = `${suggestion.type}-${suggestion.title}-${suggestion.text}`;
    return btoa(content).substring(0, 16);
  }

  private generateFeedbackKey(suggestion: Suggestion): string {
    return suggestion.id || this.generateSuggestionId(suggestion);
  }

  private estimateConfidence(suggestion: Suggestion): number {
    // Estimate confidence based on suggestion characteristics
    const typeConfidence = {
      grammar: 0.9,
      security: 0.85,
      content: 0.75,
      improvement: 0.7
    };

    return typeConfidence[suggestion.type] || 0.7;
  }

  private estimatePriority(suggestion: Suggestion): 'low' | 'medium' | 'high' {
    const confidence = suggestion.confidence || 0.7;
    
    if (suggestion.type === 'security' || confidence > 0.85) {
      return 'high';
    } else if (suggestion.type === 'grammar' || confidence > 0.75) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private recordAction(suggestionIndex: number, action: string): void {
    const suggestion = this.suggestions[suggestionIndex];
    
    if (!suggestion) return;

    // Record action timestamp for analytics
    const actionKey = `${this.generateFeedbackKey(suggestion)}_${action}`;
    
    this.feedback[actionKey] = {
      type: action as FeedbackType,
      timestamp: Date.now()
    };

    this.saveFeedbackToStorage();
    this.updateAnalytics();
  }

  private updateAnalytics(): void {
    if (this.suggestions.length === 0) {
      this.analytics = null;
      return;
    }

    const totalSuggestions = this.suggestions.length;
    let appliedCount = 0;
    let dismissedCount = 0;
    const feedbackCount: Record<FeedbackType, number> = {
      helpful: 0,
      'not-helpful': 0,
      applied: 0,
      dismissed: 0
    };

    // Count feedback and actions
    Object.values(this.feedback).forEach(feedback => {
      if (feedback.type === 'applied') appliedCount++;
      if (feedback.type === 'dismissed') dismissedCount++;
      if (feedbackCount[feedback.type] !== undefined) {
        feedbackCount[feedback.type]++;
      }
    });

    // Calculate conversion rate
    const totalActions = appliedCount + dismissedCount;
    const conversionRate = totalActions > 0 ? appliedCount / totalActions : 0;

    // Find most common suggestion type
    const typeCount: Record<string, number> = {};
    this.suggestions.forEach(suggestion => {
      typeCount[suggestion.type] = (typeCount[suggestion.type] || 0) + 1;
    });
    
    const mostCommonType = Object.keys(typeCount).reduce((a, b) => 
      typeCount[a] > typeCount[b] ? a : b, 'none'
    );

    this.analytics = {
      totalSuggestions,
      appliedCount,
      dismissedCount,
      feedbackCount,
      averageTimeToAction: this.calculateAverageTimeToAction(),
      mostCommonType,
      conversionRate
    };
  }

  private calculateAverageTimeToAction(): number {
    const actionTimestamps = Object.values(this.feedback)
      .filter(f => f.type === 'applied' || f.type === 'dismissed')
      .map(f => f.timestamp);

    if (actionTimestamps.length < 2) return 0;

    const intervals = [];
    for (let i = 1; i < actionTimestamps.length; i++) {
      intervals.push(actionTimestamps[i] - actionTimestamps[i - 1]);
    }

    return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  }

  private loadFeedbackFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.persistenceKey);
      if (stored) {
        this.feedback = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Error loading feedback from storage:', error);
    }
  }

  private saveFeedbackToStorage(): void {
    try {
      localStorage.setItem(this.persistenceKey, JSON.stringify(this.feedback));
    } catch (error) {
      console.warn('Error saving feedback to storage:', error);
    }
  }
}

/**
 * Custom hook for suggestion management
 */
export const useSuggestionManager = (
  options: Partial<SuggestionProcessingOptions> = {}
) => {
  const [state, setState] = useState<SuggestionState>({
    suggestions: [],
    expandedSuggestion: null,
    feedbackGiven: {},
    appliedSuggestions: new Set(),
    dismissedSuggestions: new Set(),
    processingStates: {}
  });

  const managerRef = useRef(new SuggestionManager());
  const timeoutRefs = useRef<Record<number, NodeJS.Timeout>>({});

  const actions: SuggestionActions = {
    setSuggestions: useCallback((suggestions: Suggestion[]) => {
      const processed = managerRef.current.processSuggestions(suggestions, options);
      setState(prev => ({
        ...prev,
        suggestions: processed,
        expandedSuggestion: null,
        feedbackGiven: {},
        appliedSuggestions: new Set(),
        dismissedSuggestions: new Set()
      }));
    }, [options]),

    toggleSuggestion: useCallback((index: number) => {
      setState(prev => ({
        ...prev,
        expandedSuggestion: prev.expandedSuggestion === index ? null : index
      }));
    }, []),

    applySuggestion: useCallback((index: number, improvement: string) => {
      const success = managerRef.current.applySuggestion(index, (imp) => {
        // The actual application logic will be handled by the parent component
      });

      if (success) {
        setState(prev => ({
          ...prev,
          appliedSuggestions: new Set([...prev.appliedSuggestions, index]),
          expandedSuggestion: options.autoCollapseAfterApply ? null : prev.expandedSuggestion
        }));

        // Auto-record positive feedback for applied suggestions
        managerRef.current.recordFeedback(index, FEEDBACK_TYPES.APPLIED);
      }
    }, [options.autoCollapseAfterApply]),

    dismissSuggestion: useCallback((index: number) => {
      const success = managerRef.current.dismissSuggestion(index);

      if (success) {
        setState(prev => ({
          ...prev,
          dismissedSuggestions: new Set([...prev.dismissedSuggestions, index]),
          expandedSuggestion: null
        }));

        managerRef.current.recordFeedback(index, FEEDBACK_TYPES.DISMISSED);
      }
    }, []),

    recordFeedback: useCallback((index: number, feedback: FeedbackType) => {
      managerRef.current.recordFeedback(index, feedback);
      
      setState(prev => ({
        ...prev,
        feedbackGiven: {
          ...prev.feedbackGiven,
          [index]: feedback
        }
      }));

      // Clear feedback after timeout
      const timeoutId = setTimeout(() => {
        setState(prev => ({
          ...prev,
          feedbackGiven: {
            ...prev.feedbackGiven,
            [index]: null
          }
        }));
      }, options.feedbackTimeout || AI_TIMING_CONSTANTS.feedbackTimeout);

      // Clear existing timeout
      if (timeoutRefs.current[index]) {
        clearTimeout(timeoutRefs.current[index]);
      }
      timeoutRefs.current[index] = timeoutId;
    }, [options.feedbackTimeout]),

    clearFeedback: useCallback((index: number) => {
      managerRef.current.clearFeedback(index);
      
      setState(prev => ({
        ...prev,
        feedbackGiven: {
          ...prev.feedbackGiven,
          [index]: null
        }
      }));

      if (timeoutRefs.current[index]) {
        clearTimeout(timeoutRefs.current[index]);
        delete timeoutRefs.current[index];
      }
    }, []),

    resetSuggestions: useCallback(() => {
      setState({
        suggestions: [],
        expandedSuggestion: null,
        feedbackGiven: {},
        appliedSuggestions: new Set(),
        dismissedSuggestions: new Set(),
        processingStates: {}
      });

      // Clear all timeouts
      Object.values(timeoutRefs.current).forEach(clearTimeout);
      timeoutRefs.current = {};
    }, []),

    bulkDismiss: useCallback((indices: number[]) => {
      indices.forEach(index => {
        managerRef.current.dismissSuggestion(index);
      });

      setState(prev => ({
        ...prev,
        dismissedSuggestions: new Set([...prev.dismissedSuggestions, ...indices]),
        expandedSuggestion: null
      }));
    }, []),

    bulkApply: useCallback((indices: number[], onApply: (improvement: string) => void) => {
      const successful: number[] = [];

      indices.forEach(index => {
        const success = managerRef.current.applySuggestion(index, onApply);
        if (success) {
          successful.push(index);
        }
      });

      setState(prev => ({
        ...prev,
        appliedSuggestions: new Set([...prev.appliedSuggestions, ...successful]),
        expandedSuggestion: null
      }));
    }, [])
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach(clearTimeout);
    };
  }, []);

  return {
    state,
    actions,
    analytics: managerRef.current.getAnalytics(),
    exportData: () => managerRef.current.exportFeedbackData(),
    importData: (data: Record<string, any>) => managerRef.current.importFeedbackData(data)
  };
};

/**
 * Utility functions for suggestion management
 */
export const suggestionUtils = {
  /**
   * Filter suggestions by type
   */
  filterByType: (suggestions: Suggestion[], type: string): Suggestion[] => {
    return suggestions.filter(s => s.type === type);
  },

  /**
   * Group suggestions by type
   */
  groupByType: (suggestions: Suggestion[]): Record<string, Suggestion[]> => {
    return suggestions.reduce((groups, suggestion) => {
      const type = suggestion.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(suggestion);
      return groups;
    }, {} as Record<string, Suggestion[]>);
  },

  /**
   * Calculate suggestion impact score
   */
  calculateImpactScore: (suggestion: Suggestion): number => {
    const typeWeights = {
      security: 1.0,
      grammar: 0.6,
      content: 0.8,
      improvement: 0.7
    };

    const confidenceWeight = suggestion.confidence || 0.7;
    const typeWeight = typeWeights[suggestion.type] || 0.5;
    
    return confidenceWeight * typeWeight;
  },

  /**
   * Format suggestion for display
   */
  formatForDisplay: (suggestion: Suggestion): {
    title: string;
    description: string;
    badge: string;
    priority: string;
  } => {
    return {
      title: suggestion.title,
      description: suggestion.text,
      badge: suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1),
      priority: suggestion.priority || 'medium'
    };
  }
};

export default SuggestionManager;
