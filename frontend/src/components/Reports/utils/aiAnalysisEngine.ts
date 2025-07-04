/**
 * AI Analysis Engine - Core AI Processing and Content Analysis
 * Extracted from AIReportAssistant for better modularity
 * Production-ready AI analysis algorithms for security report enhancement
 */

import {
  GRAMMAR_PATTERNS,
  CONTENT_ENHANCEMENT_PATTERNS,
  SECURITY_SUGGESTION_PATTERNS,
  CONTENT_ANALYSIS_KEYWORDS,
  ENHANCEMENT_TEMPLATES,
  AI_ANALYSIS_CONFIG,
  AI_VALIDATION_RULES,
  SUGGESTION_TYPES,
  getSecurityCodeConfig,
  Suggestion,
  AIOptions,
  SuggestionType
} from '../constants/aiAssistantConstants';

/**
 * Grammar issue interface
 */
export interface GrammarIssue {
  original: string;
  correction: string;
  type: string;
  position?: number;
  severity?: 'low' | 'medium' | 'high';
}

/**
 * Content enhancement interface
 */
export interface ContentEnhancement {
  type: 'time' | 'surveillance' | 'access' | 'patrol';
  suggestion: string;
  description: string;
  enhancedContent: string;
  confidence: number;
}

/**
 * Security suggestion interface  
 */
export interface SecuritySuggestion {
  title: string;
  description: string;
  enhancedContent: string;
  priority: 'low' | 'medium' | 'high';
  category: 'compliance' | 'personnel' | 'incident' | 'general';
}

/**
 * Analysis result interface
 */
export interface AnalysisResult {
  suggestions: Suggestion[];
  grammarIssues: GrammarIssue[];
  enhancements: ContentEnhancement[];
  securitySuggestions: SecuritySuggestion[];
  metadata: {
    analysisTime: number;
    contentLength: number;
    confidenceScore: number;
    processedSections: string[];
  };
}

/**
 * Core AI Analysis Engine Class
 */
export class AIAnalysisEngine {
  private analysisHistory: AnalysisResult[] = [];

  /**
   * Main analysis function - orchestrates all AI analysis
   */
  async analyzeContent(
    content: string,
    day: string,
    securityCode: string,
    dateRange: { start: Date; end: Date },
    aiOptions: AIOptions
  ): Promise<AnalysisResult> {
    const startTime = performance.now();

    // Validate input
    if (!this.validateInput(content, aiOptions)) {
      throw new Error('Invalid input for AI analysis');
    }

    const suggestions: Suggestion[] = [];
    const grammarIssues = this.findGrammarIssues(content);
    const enhancements = this.generateContentEnhancements(content, day, dateRange);
    const securitySuggestions = this.generateSecuritySuggestions(content, securityCode);

    // Convert findings to suggestions based on AI options
    if (aiOptions.autoCorrect && grammarIssues.length > 0) {
      suggestions.push(...this.convertGrammarToSuggestions(grammarIssues, content));
    }

    if (aiOptions.enhanceWriting && enhancements.length > 0) {
      suggestions.push(...this.convertEnhancementsToSuggestions(enhancements, content));
    }

    if (aiOptions.suggestImprovements && securitySuggestions.length > 0) {
      suggestions.push(...this.convertSecurityToSuggestions(securitySuggestions, content));
    }

    // Filter and prioritize suggestions
    const filteredSuggestions = this.filterAndPrioritizeSuggestions(suggestions);

    const endTime = performance.now();
    const analysisTime = endTime - startTime;

    const result: AnalysisResult = {
      suggestions: filteredSuggestions,
      grammarIssues,
      enhancements,
      securitySuggestions,
      metadata: {
        analysisTime,
        contentLength: content.length,
        confidenceScore: this.calculateConfidenceScore(filteredSuggestions),
        processedSections: this.identifyProcessedSections(content)
      }
    };

    // Store in history
    this.analysisHistory.push(result);
    
    return result;
  }

  /**
   * Find grammar and spelling issues in content
   */
  findGrammarIssues(content: string): GrammarIssue[] {
    const issues: GrammarIssue[] = [];

    for (const pattern of GRAMMAR_PATTERNS) {
      const matches = content.match(pattern.regex);

      if (matches) {
        for (const match of matches) {
          if (pattern.replacement) {
            const corrected = match.replace(pattern.regex, pattern.replacement);
            issues.push({
              original: match,
              correction: corrected,
              type: pattern.type,
              severity: this.getGrammarSeverity(pattern.type)
            });
          } else if (pattern.correction) {
            issues.push({
              original: match,
              correction: pattern.correction,
              type: pattern.type,
              severity: this.getGrammarSeverity(pattern.type)
            });
          }
        }
      }
    }

    return this.deduplicateGrammarIssues(issues);
  }

  /**
   * Generate content enhancement suggestions
   */
  generateContentEnhancements(
    content: string,
    day: string,
    dateRange: { start: Date; end: Date }
  ): ContentEnhancement[] {
    const enhancements: ContentEnhancement[] = [];

    // Check for missing time-specific information
    if (!CONTENT_ENHANCEMENT_PATTERNS.TIME_SPECIFIC.regex.test(content)) {
      enhancements.push({
        type: 'time',
        suggestion: CONTENT_ENHANCEMENT_PATTERNS.TIME_SPECIFIC.enhancement,
        description: CONTENT_ENHANCEMENT_PATTERNS.TIME_SPECIFIC.description,
        enhancedContent: this.buildEnhancedContent(content, ENHANCEMENT_TEMPLATES.TIME_SPECIFIC),
        confidence: this.calculateEnhancementConfidence('time', content)
      });
    }

    // Check for missing surveillance information
    if (!CONTENT_ENHANCEMENT_PATTERNS.CAMERA_INFO.regex.test(content)) {
      enhancements.push({
        type: 'surveillance',
        suggestion: CONTENT_ENHANCEMENT_PATTERNS.CAMERA_INFO.enhancement,
        description: CONTENT_ENHANCEMENT_PATTERNS.CAMERA_INFO.description,
        enhancedContent: this.buildEnhancedContent(content, ENHANCEMENT_TEMPLATES.SURVEILLANCE),
        confidence: this.calculateEnhancementConfidence('surveillance', content)
      });
    }

    // Check for missing access control information
    if (!CONTENT_ENHANCEMENT_PATTERNS.ACCESS_INFO.regex.test(content)) {
      enhancements.push({
        type: 'access',
        suggestion: CONTENT_ENHANCEMENT_PATTERNS.ACCESS_INFO.enhancement,
        description: CONTENT_ENHANCEMENT_PATTERNS.ACCESS_INFO.description,
        enhancedContent: this.buildEnhancedContent(content, ENHANCEMENT_TEMPLATES.ACCESS_CONTROL),
        confidence: this.calculateEnhancementConfidence('access', content)
      });
    }

    // Check for missing patrol information
    if (!CONTENT_ENHANCEMENT_PATTERNS.PATROL_INFO.regex.test(content)) {
      enhancements.push({
        type: 'patrol',
        suggestion: CONTENT_ENHANCEMENT_PATTERNS.PATROL_INFO.enhancement,
        description: CONTENT_ENHANCEMENT_PATTERNS.PATROL_INFO.description,
        enhancedContent: this.buildEnhancedContent(content, ENHANCEMENT_TEMPLATES.PATROL_DETAILS),
        confidence: this.calculateEnhancementConfidence('patrol', content)
      });
    }

    return enhancements.filter(e => e.confidence >= AI_VALIDATION_RULES.minSuggestionConfidence);
  }

  /**
   * Generate security-specific suggestions
   */
  generateSecuritySuggestions(content: string, securityCode: string): SecuritySuggestion[] {
    const suggestions: SecuritySuggestion[] = [];
    const codeConfig = getSecurityCodeConfig(securityCode);

    // Add compliance statement if missing
    if (!SECURITY_SUGGESTION_PATTERNS.COMPLIANCE.regex.test(content)) {
      suggestions.push({
        title: SECURITY_SUGGESTION_PATTERNS.COMPLIANCE.title,
        description: SECURITY_SUGGESTION_PATTERNS.COMPLIANCE.description,
        enhancedContent: this.buildEnhancedContent(content, ENHANCEMENT_TEMPLATES.COMPLIANCE),
        priority: 'high',
        category: 'compliance'
      });
    }

    // Add incident response details for non-normal codes
    if (securityCode !== 'Code 4') {
      suggestions.push({
        title: 'Include incident response details',
        description: 'Add information about response procedures followed for the security code situation.',
        enhancedContent: this.buildEnhancedContent(content, ENHANCEMENT_TEMPLATES.INCIDENT_RESPONSE),
        priority: codeConfig.level === 'critical' ? 'high' : 'medium',
        category: 'incident'
      });
    }

    // Add personnel security details if missing
    if (!SECURITY_SUGGESTION_PATTERNS.PERSONNEL.regex.test(content)) {
      suggestions.push({
        title: SECURITY_SUGGESTION_PATTERNS.PERSONNEL.title,
        description: SECURITY_SUGGESTION_PATTERNS.PERSONNEL.description,
        enhancedContent: this.buildEnhancedContent(content, ENHANCEMENT_TEMPLATES.PERSONNEL),
        priority: 'medium',
        category: 'personnel'
      });
    }

    return suggestions;
  }

  /**
   * Convert grammar issues to suggestions
   */
  private convertGrammarToSuggestions(issues: GrammarIssue[], content: string): Suggestion[] {
    return issues.slice(0, AI_VALIDATION_RULES.maxSuggestionsPerType).map(issue => ({
      type: SUGGESTION_TYPES.GRAMMAR,
      title: 'Grammar & Spelling',
      issue: issue.original,
      suggestion: issue.correction,
      text: `Consider changing "${issue.original}" to "${issue.correction}".`,
      improvement: content.replace(issue.original, issue.correction),
      confidence: this.getGrammarConfidence(issue),
      priority: issue.severity || 'medium'
    }));
  }

  /**
   * Convert enhancements to suggestions
   */
  private convertEnhancementsToSuggestions(enhancements: ContentEnhancement[], content: string): Suggestion[] {
    return enhancements.slice(0, AI_VALIDATION_RULES.maxSuggestionsPerType).map(enhancement => ({
      type: SUGGESTION_TYPES.CONTENT,
      title: 'Content Enhancement',
      suggestion: enhancement.suggestion,
      text: enhancement.description,
      improvement: enhancement.enhancedContent,
      confidence: enhancement.confidence,
      priority: enhancement.confidence > 0.8 ? 'high' : 'medium'
    }));
  }

  /**
   * Convert security suggestions to suggestions
   */
  private convertSecurityToSuggestions(securitySuggestions: SecuritySuggestion[], content: string): Suggestion[] {
    return securitySuggestions.slice(0, AI_VALIDATION_RULES.maxSuggestionsPerType).map(suggestion => ({
      type: SUGGESTION_TYPES.SECURITY,
      title: 'Security Improvement',
      suggestion: suggestion.title,
      text: suggestion.description,
      improvement: suggestion.enhancedContent,
      confidence: 0.85,
      priority: suggestion.priority
    }));
  }

  /**
   * Filter and prioritize suggestions
   */
  private filterAndPrioritizeSuggestions(suggestions: Suggestion[]): Suggestion[] {
    // Filter by confidence
    const filtered = suggestions.filter(s => 
      (s.confidence || 0.7) >= AI_VALIDATION_RULES.minSuggestionConfidence
    );

    // Sort by priority and confidence
    const prioritized = filtered.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority || 'medium'];
      const bPriority = priorityOrder[b.priority || 'medium'];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return (b.confidence || 0.7) - (a.confidence || 0.7);
    });

    // Limit total suggestions
    return prioritized.slice(0, AI_ANALYSIS_CONFIG.maxSuggestions);
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidenceScore(suggestions: Suggestion[]): number {
    if (suggestions.length === 0) return 1.0;
    
    const totalConfidence = suggestions.reduce((sum, s) => sum + (s.confidence || 0.7), 0);
    return totalConfidence / suggestions.length;
  }

  /**
   * Identify processed sections of content
   */
  private identifyProcessedSections(content: string): string[] {
    const sections: string[] = [];
    
    if (this.containsKeywords(content, CONTENT_ANALYSIS_KEYWORDS.security)) {
      sections.push('security');
    }
    if (this.containsKeywords(content, CONTENT_ANALYSIS_KEYWORDS.time)) {
      sections.push('temporal');
    }
    if (this.containsKeywords(content, CONTENT_ANALYSIS_KEYWORDS.personnel)) {
      sections.push('personnel');
    }
    if (this.containsKeywords(content, CONTENT_ANALYSIS_KEYWORDS.systems)) {
      sections.push('systems');
    }
    if (this.containsKeywords(content, CONTENT_ANALYSIS_KEYWORDS.compliance)) {
      sections.push('compliance');
    }
    
    return sections;
  }

  /**
   * Check if content contains keywords
   */
  private containsKeywords(content: string, keywords: readonly string[]): boolean {
    const lowerContent = content.toLowerCase();
    return keywords.some(keyword => lowerContent.includes(keyword));
  }

  /**
   * Build enhanced content with template
   */
  private buildEnhancedContent(originalContent: string, template: string): string {
    return `${originalContent}\n\n${template}`;
  }

  /**
   * Calculate enhancement confidence
   */
  private calculateEnhancementConfidence(type: string, content: string): number {
    const contentLength = content.length;
    const baseConfidence = Math.min(contentLength / 500, 1.0); // Higher confidence for longer content
    
    // Adjust based on enhancement type
    const typeMultipliers = {
      time: 0.9,
      surveillance: 0.8,
      access: 0.85,
      patrol: 0.8
    };
    
    const multiplier = typeMultipliers[type as keyof typeof typeMultipliers] || 0.7;
    return Math.max(baseConfidence * multiplier, 0.6);
  }

  /**
   * Get grammar severity
   */
  private getGrammarSeverity(type: string): 'low' | 'medium' | 'high' {
    const severityMap = {
      spelling: 'high',
      grammar: 'high',
      contraction: 'medium',
      possessive: 'medium',
      word_choice: 'medium',
      spacing: 'low',
      informal: 'low'
    };
    
    return severityMap[type as keyof typeof severityMap] || 'medium';
  }

  /**
   * Get grammar confidence
   */
  private getGrammarConfidence(issue: GrammarIssue): number {
    const confidenceMap = {
      high: 0.95,
      medium: 0.8,
      low: 0.65
    };
    
    return confidenceMap[issue.severity || 'medium'];
  }

  /**
   * Deduplicate grammar issues
   */
  private deduplicateGrammarIssues(issues: GrammarIssue[]): GrammarIssue[] {
    const seen = new Set<string>();
    return issues.filter(issue => {
      const key = `${issue.original}-${issue.correction}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Validate input parameters
   */
  private validateInput(content: string, aiOptions: AIOptions): boolean {
    return (
      content.length >= AI_ANALYSIS_CONFIG.minContentLength &&
      aiOptions.enabled &&
      typeof content === 'string'
    );
  }

  /**
   * Get analysis history
   */
  getAnalysisHistory(): AnalysisResult[] {
    return [...this.analysisHistory];
  }

  /**
   * Clear analysis history
   */
  clearHistory(): void {
    this.analysisHistory = [];
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    if (this.analysisHistory.length === 0) {
      return null;
    }

    const times = this.analysisHistory.map(r => r.metadata.analysisTime);
    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    return {
      averageAnalysisTime: avgTime,
      minimumAnalysisTime: minTime,
      maximumAnalysisTime: maxTime,
      totalAnalyses: this.analysisHistory.length,
      averageContentLength: this.analysisHistory.reduce((sum, r) => sum + r.metadata.contentLength, 0) / this.analysisHistory.length
    };
  }
}

/**
 * Singleton instance for global use
 */
export const aiAnalysisEngine = new AIAnalysisEngine();

/**
 * Utility functions for external use
 */
export const aiAnalysisUtils = {
  /**
   * Quick grammar check
   */
  quickGrammarCheck: (content: string): GrammarIssue[] => {
    return aiAnalysisEngine.findGrammarIssues(content);
  },

  /**
   * Content quality score
   */
  calculateContentQuality: (content: string): number => {
    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;
    
    // Quality score based on length, structure, and keyword presence
    const lengthScore = Math.min(words / 100, 1.0);
    const structureScore = Math.min(avgWordsPerSentence / 15, 1.0);
    
    return (lengthScore + structureScore) / 2;
  },

  /**
   * Extract keywords from content
   */
  extractKeywords: (content: string, category?: keyof typeof CONTENT_ANALYSIS_KEYWORDS): string[] => {
    const lowerContent = content.toLowerCase();
    const words = lowerContent.split(/\s+/);
    
    if (category) {
      const keywords = CONTENT_ANALYSIS_KEYWORDS[category];
      return words.filter(word => keywords.includes(word));
    }
    
    // Extract all security-related keywords
    const allKeywords = Object.values(CONTENT_ANALYSIS_KEYWORDS).flat();
    return words.filter(word => allKeywords.includes(word));
  },

  /**
   * Validate suggestion
   */
  validateSuggestion: (suggestion: Suggestion): boolean => {
    return (
      suggestion.type &&
      suggestion.title &&
      suggestion.text &&
      suggestion.improvement &&
      (suggestion.confidence || 0.7) >= AI_VALIDATION_RULES.minSuggestionConfidence
    );
  }
};

export default aiAnalysisEngine;
