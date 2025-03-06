// File: backend/src/controllers/aiController.js

/**
 * AI Controller
 * 
 * Handles AI-based text enhancement, summary generation, and report finalization
 * Integrates with OpenAI or another AI service
 */

const { Configuration, OpenAIApi } = require('openai');

// Configure OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

/**
 * Enhance text content with AI
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.enhanceText = async (req, res) => {
  try {
    const { content, day, options, isMinimalContent } = req.body;
    
    // Construct the prompt based on options
    let prompt = "";
    
    if (isMinimalContent) {
      prompt = `Generate a detailed security monitoring report for ${day}. Include typical activities, security checks, and use a professional tone. Mark it as Code 4 (All Clear) unless specified otherwise.`;
    } else {
      prompt = `Enhance the following security report: "${content}". `;
      
      if (options.autoCorrect) {
        prompt += "Fix grammar and spelling errors. ";
      }
      
      if (options.enhanceWriting) {
        prompt += "Improve writing style and professionalism. Use security industry terminology appropriately. ";
      }
      
      if (options.suggestContent) {
        prompt += "Add relevant details that would be valuable in a security report while maintaining factual accuracy. ";
      }
      
      prompt += "Keep the same general meaning and events. Make sure the report sounds like it was written by a security professional.";
    }
    
    // Call OpenAI API
    const completion = await openai.createCompletion({
      model: "text-davinci-003", // Or use a newer model like GPT-4 if available
      prompt: prompt,
      max_tokens: 1000,
      temperature: 0.7,
      top_p: 1,
    });
    
    const enhancedContent = completion.data.choices[0].text.trim();
    
    res.json({
      success: true,
      enhancedContent,
    });
  } catch (error) {
    console.error('Error enhancing text with AI:', error);
    res.status(500).json({ error: 'Failed to enhance text' });
  }
};

/**
 * Generate a summary from report texts
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.generateSummary = async (req, res) => {
  try {
    const { reportTexts, options } = req.body;
    
    // Construct prompt for summary generation
    const prompt = `Generate a concise summary of the week's security monitoring based on these daily reports: ${reportTexts}. 
    Focus on patterns, notable events, and operational status. 
    Keep the tone professional and factual.`;
    
    // Call OpenAI API
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      max_tokens: 500,
      temperature: 0.7,
      top_p: 1,
    });
    
    const summary = completion.data.choices[0].text.trim();
    
    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error('Error generating summary with AI:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
};

/**
 * Finalize a complete report with AI
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.finalizeReport = async (req, res) => {
  try {
    const { dailyReports, summaryNotes, options } = req.body;
    
    // Process each daily report with AI
    const enhancedReports = await Promise.all(
      dailyReports.map(async (report) => {
        if (!report.content) return report;
        
        const prompt = `Refine the following security report for ${report.day}: "${report.content}". 
        Fix any grammar or spelling errors. 
        Ensure the tone is professional and consistent. 
        Keep the same general meaning and events.`;
        
        const completion = await openai.createCompletion({
          model: "text-davinci-003",
          prompt: prompt,
          max_tokens: 500,
          temperature: 0.5,
          top_p: 1,
        });
        
        return {
          ...report,
          content: completion.data.choices[0].text.trim(),
        };
      })
    );
    
    // Generate or enhance summary
    let enhancedSummary = summaryNotes;
    
    if (options.generateSummary || !summaryNotes) {
      const reportTexts = enhancedReports
        .map(report => `${report.day}: ${report.content}`)
        .join('\n\n');
      
      const summaryPrompt = `Generate a concise summary of the week's security monitoring based on these daily reports: ${reportTexts}. 
      Focus on patterns, notable events, and operational status. 
      Keep the tone professional and factual.`;
      
      const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: summaryPrompt,
        max_tokens: 500,
        temperature: 0.7,
        top_p: 1,
      });
      
      enhancedSummary = completion.data.choices[0].text.trim();
    } else if (options.enhanceWriting) {
      const summaryPrompt = `Enhance the following security report summary: "${summaryNotes}". 
      Fix any grammar or spelling errors. 
      Improve writing style and professionalism. 
      Keep the same general meaning.`;
      
      const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: summaryPrompt,
        max_tokens: 500,
        temperature: 0.5,
        top_p: 1,
      });
      
      enhancedSummary = completion.data.choices[0].text.trim();
    }
    
    res.json({
      success: true,
      dailyReports: enhancedReports,
      summary: enhancedSummary,
    });
  } catch (error) {
    console.error('Error finalizing report with AI:', error);
    res.status(500).json({ error: 'Failed to finalize report' });
  }
};