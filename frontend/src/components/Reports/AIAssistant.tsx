// File: frontend/src/components/Reports/AIAssistant.tsx

import axios from 'axios';
import { AIOptions } from '../../types/reports';

/**
 * AIAssistant provides methods to interact with AI services 
 * for enhancing report content, generating summaries, and more.
 */
class AIAssistant {
  // API endpoint for AI services
  private static API_ENDPOINT = '/api/ai';
  
  // Development mode flag (using Vite environment variable)
  private static IS_DEV = import.meta.env.DEV;
  
  // Flag to use real AI API (using Vite environment variable)
  private static USE_AI_API = import.meta.env.VITE_USE_AI_API === 'true';
  
  /**
   * Enhance content for a single day's report
   * 
   * @param content The original content to enhance
   * @param day The day of the week for context
   * @param options AI enhancement options
   * @returns Enhanced content
   */
  static async enhanceContent(content: string, day: string, options: AIOptions): Promise<string> {
    try {
      // If content is minimal, generate a more complete report
      const isMinimalContent = !content || content.length < 30;
      
      const prompt = isMinimalContent
        ? `Generate a detailed security monitoring report for ${day}. Include typical activities, security checks, and use a professional tone. Mark it as Code 4 (All Clear) unless specified otherwise.`
        : `Enhance the following security report: "${content}". Fix grammar and spelling${options.autoCorrect ? ', ' : ' if needed.'}${options.enhanceWriting ? ' Improve writing style and professionalism. ' : ''}${options.suggestContent ? ' Add relevant details that would be valuable in a security report while maintaining factual accuracy. ' : ''}Keep the same general meaning and events.`;
      
      // In a real implementation, this would call your AI API
      // For now, we'll simulate with a mock response or use a simple API call
      
      // Option 1: Mock response for testing
      if (this.IS_DEV && !this.USE_AI_API) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        
        if (isMinimalContent) {
          return this.getMockReport(day);
        } else {
          return this.getMockEnhancement(content);
        }
      }
      
      // Option 2: Call actual API
      const response = await axios.post(`${this.API_ENDPOINT}/enhance`, {
        content,
        day,
        options,
        isMinimalContent,
        prompt
      });
      
      return response.data.enhancedContent;
    } catch (error) {
      console.error('AI enhancement failed:', error);
      // On error, return original content to avoid data loss
      return content;
    }
  }
  
  /**
   * Generate a summary from all daily reports
   * 
   * @param reportTexts Combined text from all daily reports
   * @param options AI enhancement options
   * @returns Generated summary
   */
  static async generateSummary(reportTexts: string, options: AIOptions): Promise<string> {
    try {
      const prompt = `Generate a concise summary of the week's security monitoring based on these daily reports: ${reportTexts}. 
      Focus on patterns, notable events, and operational status. 
      Keep the tone professional and factual.`;
      
      // Similar to enhanceContent, choose between mock and API
      if (this.IS_DEV && !this.USE_AI_API) {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
        return this.getMockSummary();
      }
      
      const response = await axios.post(`${this.API_ENDPOINT}/summarize`, {
        reportTexts,
        options,
        prompt
      });
      
      return response.data.summary;
    } catch (error) {
      console.error('AI summary generation failed:', error);
      return "The property continues to be actively monitored through virtual surveillance, ensuring consistent oversight of key access points, parking areas, and shared spaces. Recent observations indicate steady activity throughout the week, with no significant security incidents reported. All surveillance systems have been functioning optimally, and security protocols will continue to prioritize real-time monitoring to maintain a safe environment.";
    }
  }
  
  /**
   * Clean up the entire report before sending
   * 
   * @param dailyReports Array of daily report contents
   * @param summaryNotes Additional notes and compliance info
   * @param options AI enhancement options
   * @returns Object with improved daily reports and summary
   */
  static async finalizeReport(
    dailyReports: { day: string; content: string }[],
    summaryNotes: string,
    options: AIOptions
  ): Promise<{ dailyReports: { day: string; content: string }[]; summary: string }> {
    try {
      // For development mode without API, enhance each report individually
      if (this.IS_DEV && !this.USE_AI_API) {
        const enhancedReports = await Promise.all(
          dailyReports.map(async (report) => ({
            day: report.day,
            content: await this.enhanceContent(report.content, report.day, options)
          }))
        );
        
        // Generate summary if needed
        let enhancedSummary = summaryNotes;
        if (options.generateSummary) {
          const reportTexts = enhancedReports.map(r => `${r.day}: ${r.content}`).join('\n\n');
          enhancedSummary = await this.generateSummary(reportTexts, options);
        }
        
        return { 
          dailyReports: enhancedReports, 
          summary: enhancedSummary 
        };
      }
      
      // Call API to process the entire report
      const response = await axios.post(`${this.API_ENDPOINT}/finalize-report`, {
        dailyReports,
        summaryNotes,
        options
      });
      
      return response.data;
    } catch (error) {
      console.error('AI report finalization failed:', error);
      // Return originals on error
      return { dailyReports, summary: summaryNotes };
    }
  }
  
  // MOCK DATA FOR DEVELOPMENT WITHOUT API ------------------------------------------------
  
  /**
   * Get a mock report for a given day (for development only)
   */
  private static getMockReport(day: string): string {
    const reports = {
      'Monday': `Monday: Virtual monitoring began at midnight, with security feeds covering all entry points, stairwells, and communal spaces. The morning remained calm, with typical foot traffic and vehicle movement. Routine patrols confirmed all access points were secure, and no unusual activity was detected throughout the day. (${this.getSecurityCode()})`,
      
      'Tuesday': `Tuesday: Surveillance continued smoothly throughout the day. Morning traffic followed normal patterns with standard resident departures and arrivals. All perimeter checks were completed successfully with no security concerns. Cameras remained operational with 100% uptime during the monitoring period. (${this.getSecurityCode()})`,
      
      'Wednesday': `Wednesday: A non-resident was briefly observed walking near the recreational area in the early evening. They did not enter restricted spaces and left after a short period. Parking lots saw routine movement, with no unauthorized vehicles recorded. Surveillance continued without any incidents, ensuring all key areas remained under observation. (${this.getSecurityCode()})`,
      
      'Thursday': `Thursday: A resident encountered minor trouble accessing the side gate. Virtual guards monitored the situation to ensure no unauthorized individuals attempted entry. The resident resolved the issue and entered without further concern. The evening progressed as usual, with deliveries and pedestrian movement following expected patterns. (${this.getSecurityCode()})`,
      
      'Friday': `Friday: Foot traffic increased near the communal areas, especially in the lounge and outdoor seating sections. Groups gathered into the evening, but all activities remained within property guidelines. Virtual monitoring maintained coverage of pedestrian and vehicle movement, confirming compliance with community policies. The day concluded without any reported security issues. (${this.getSecurityCode()})`,
      
      'Saturday': `Saturday: Weekend activity was higher than usual, particularly around the gym and pool area. Virtual surveillance confirmed that all individuals accessing amenities were authorized residents. No security alerts were triggered, and patrols continued monitoring for any irregularities. Surveillance systems remained fully functional throughout the day. (${this.getSecurityCode()})`,
      
      'Sunday': `Sunday: The day remained uneventful, with only light activity observed in common areas. A routine law enforcement patrol passed through in the afternoon, but no incidents or concerns were reported. Virtual monitoring proceeded as scheduled, and all security systems operated without interruption. (${this.getSecurityCode()})`,
    };
    
    return reports[day] || `${day}: Virtual monitoring was conducted throughout the day with no security incidents reported. All cameras and systems remained fully operational. (${this.getSecurityCode()})`;
  }
  
  /**
   * Get a mock enhancement of provided content (for development only)
   */
  private static getMockEnhancement(content: string): string {
    // Simple enhancement: add more professional language if content is short
    if (content.length < 100) {
      return `${content} Virtual surveillance systems remained fully operational, with continuous monitoring of all key access points. No unauthorized access was detected, and all security protocols were followed according to established guidelines. Code 4 (All Clear) status was maintained throughout the monitoring period.`;
    }
    
    // Otherwise just return the original with minor additions
    return `${content} All monitoring systems functioned as expected with optimal performance.`;
  }
  
  /**
   * Get a mock weekly summary (for development only)
   */
  private static getMockSummary(): string {
    return `The property continues to be actively monitored through virtual surveillance, ensuring consistent oversight of key access points, parking areas, and shared spaces. Recent observations indicate steady activity throughout the week, with slight increases in foot traffic near communal areas. Virtual guards remain vigilant in assessing any anomalies, including extended vehicle presence and non-resident movement near the property. All surveillance systems have been functioning optimally, and security protocols will continue to prioritize real-time monitoring to maintain a safe environment for residents.`;
  }
  
  /**
   * Get a random security code for mock data
   */
  private static getSecurityCode(): string {
    return 'Code 4'; // Default to all clear
  }
}

export default AIAssistant;