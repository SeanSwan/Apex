/**
 * APEX AI EMAIL SERVICE - EXTERNAL INTEGRATION
 * ===========================================
 * Handles email notifications for security alerts and incidents
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class ApexEmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  initializeTransporter() {
    try {
      // Production SMTP configuration
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
        this.transporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
          }
        });
        
        this.isConfigured = true;
        console.log('📧 Email service configured with SMTP');
      } 
      // Development configuration with Ethereal
      else {
        console.log('📧 Using demo email service (no real emails sent)');
        this.isConfigured = false;
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Send incident alert email
   */
  async sendIncidentAlert(incidentData, recipients) {
    try {
      const {
        incident_id,
        incident_type,
        severity,
        location,
        timestamp,
        description,
        assigned_guard
      } = incidentData;

      const subject = `🚨 ${severity.toUpperCase()} SECURITY ALERT - ${incident_type.toUpperCase()}`;
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #ffffff; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; color: #FFD700;">
              🛡️ APEX AI Security Alert
            </h1>
            <p style="margin: 10px 0 0 0; color: #B0B0B0;">
              Incident ID: ${incident_id}
            </p>
          </div>
          
          <div style="background: #ffffff; padding: 20px; border-radius: 0 0 8px 8px;">
            <div style="background: ${severity === 'critical' ? '#EF4444' : severity === 'high' ? '#F59E0B' : '#3B82F6'}; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 18px;">
                ${severity.toUpperCase()} PRIORITY ALERT
              </h2>
              <p style="margin: 5px 0 0 0; font-size: 14px;">
                ${incident_type.replace('_', ' ').toUpperCase()} DETECTED
              </p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold; color: #333;">Location:</td>
                <td style="padding: 10px 0; color: #666;">${location}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold; color: #333;">Time:</td>
                <td style="padding: 10px 0; color: #666;">${new Date(timestamp).toLocaleString()}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold; color: #333;">Severity:</td>
                <td style="padding: 10px 0; color: #666;">${severity.toUpperCase()}</td>
              </tr>
              ${assigned_guard ? `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold; color: #333;">Assigned Guard:</td>
                <td style="padding: 10px 0; color: #666;">${assigned_guard}</td>
              </tr>
              ` : ''}
            </table>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 10px 0; color: #333;">Description:</h3>
              <p style="margin: 0; color: #666; line-height: 1.5;">
                ${description}
              </p>
            </div>
            
            <div style="background: #FFD700; color: #000; padding: 15px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0 0 10px 0;">Immediate Action Required</h3>
              <p style="margin: 0; font-size: 14px;">
                This alert requires immediate attention. Please log into the APEX AI dashboard to view full details and take appropriate action.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>APEX AI Security Platform • Automated Alert System</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      `;

      const textContent = `
APEX AI SECURITY ALERT

Incident ID: ${incident_id}
Type: ${incident_type.toUpperCase()}
Severity: ${severity.toUpperCase()}
Location: ${location}
Time: ${new Date(timestamp).toLocaleString()}
${assigned_guard ? `Assigned Guard: ${assigned_guard}` : ''}

Description: ${description}

This alert requires immediate attention. Please log into the APEX AI dashboard to view full details and take appropriate action.

APEX AI Security Platform - Automated Alert System
      `;

      if (this.isConfigured && this.transporter) {
        // Send real email
        const mailOptions = {
          from: process.env.SMTP_FROM || 'alerts@apexai-security.com',
          to: recipients.join(', '),
          subject,
          text: textContent,
          html: htmlContent
        };

        const result = await this.transporter.sendMail(mailOptions);
        
        console.log(`📧 Incident alert email sent to ${recipients.length} recipients`);
        console.log(`📧 Message ID: ${result.messageId}`);
        
        return {
          success: true,
          message_id: result.messageId,
          recipients: recipients.length
        };
        
      } else {
        // Demo mode - log email content
        console.log('📧 DEMO EMAIL SERVICE - Incident Alert');
        console.log('📧 Subject:', subject);
        console.log('📧 Recipients:', recipients.join(', '));
        console.log('📧 Content Preview:');
        console.log(textContent);
        
        return {
          success: true,
          message_id: `demo_${Date.now()}`,
          recipients: recipients.length,
          demo_mode: true
        };
      }
      
    } catch (error) {
      console.error('❌ Failed to send incident alert email:', error);
      throw error;
    }
  }

  /**
   * Send daily executive briefing
   */
  async sendExecutiveBriefing(briefingData, executives) {
    try {
      const {
        date,
        summary,
        key_metrics,
        incidents,
        recommendations
      } = briefingData;

      const subject = `📊 Daily Security Briefing - ${new Date(date).toLocaleDateString()}`;
      
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #ffffff; padding: 30px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; color: #FFD700; font-size: 24px;">
              🛡️ APEX AI Daily Security Briefing
            </h1>
            <p style="margin: 10px 0 0 0; color: #B0B0B0; font-size: 16px;">
              ${new Date(date).toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
            <div style="margin-bottom: 30px;">
              <h2 style="color: #333; border-bottom: 2px solid #FFD700; padding-bottom: 10px;">Executive Summary</h2>
              <p style="line-height: 1.6; color: #666;">${summary}</p>
            </div>
            
            <div style="margin-bottom: 30px;">
              <h2 style="color: #333; border-bottom: 2px solid #FFD700; padding-bottom: 10px;">Key Metrics</h2>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                ${Object.entries(key_metrics).map(([key, value]) => `
                  <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #FFD700;">${value}</div>
                    <div style="color: #666; text-transform: capitalize;">${key.replace('_', ' ')}</div>
                  </div>
                `).join('')}
              </div>
            </div>
            
            ${incidents.length > 0 ? `
            <div style="margin-bottom: 30px;">
              <h2 style="color: #333; border-bottom: 2px solid #FFD700; padding-bottom: 10px;">Notable Incidents</h2>
              ${incidents.map(incident => `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid ${
                  incident.severity === 'critical' ? '#EF4444' : 
                  incident.severity === 'high' ? '#F59E0B' : '#3B82F6'
                };">
                  <div style="font-weight: bold; color: #333; margin-bottom: 5px;">
                    ${incident.type.replace('_', ' ').toUpperCase()} - ${incident.severity.toUpperCase()}
                  </div>
                  <div style="color: #666; font-size: 14px; margin-bottom: 5px;">
                    ${incident.location} • ${new Date(incident.timestamp).toLocaleTimeString()}
                  </div>
                  <div style="color: #666;">${incident.description}</div>
                </div>
              `).join('')}
            </div>
            ` : ''}
            
            ${recommendations.length > 0 ? `
            <div style="margin-bottom: 30px;">
              <h2 style="color: #333; border-bottom: 2px solid #FFD700; padding-bottom: 10px;">Recommendations</h2>
              <ul style="line-height: 1.6; color: #666;">
                ${recommendations.map(rec => `<li style="margin-bottom: 10px;">${rec}</li>`).join('')}
              </ul>
            </div>
            ` : ''}
            
            <div style="background: #FFD700; color: #000; padding: 20px; border-radius: 8px; text-align: center;">
              <h3 style="margin: 0 0 10px 0;">Security Status: Operational</h3>
              <p style="margin: 0; font-size: 14px;">
                All systems operational. Continuous monitoring active across all properties.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>APEX AI Security Platform • Executive Intelligence Briefing</p>
            <p>Generated automatically from security monitoring data</p>
          </div>
        </div>
      `;

      if (this.isConfigured && this.transporter) {
        const mailOptions = {
          from: process.env.SMTP_FROM || 'briefings@apexai-security.com',
          to: executives.join(', '),
          subject,
          html: htmlContent
        };

        const result = await this.transporter.sendMail(mailOptions);
        
        console.log(`📊 Executive briefing sent to ${executives.length} recipients`);
        
        return {
          success: true,
          message_id: result.messageId,
          recipients: executives.length
        };
        
      } else {
        console.log('📊 DEMO EMAIL SERVICE - Executive Briefing');
        console.log('📊 Subject:', subject);
        console.log('📊 Recipients:', executives.join(', '));
        
        return {
          success: true,
          message_id: `demo_briefing_${Date.now()}`,
          recipients: executives.length,
          demo_mode: true
        };
      }
      
    } catch (error) {
      console.error('❌ Failed to send executive briefing:', error);
      throw error;
    }
  }

  /**
   * Test email configuration
   */
  async testConfiguration() {
    try {
      if (this.isConfigured && this.transporter) {
        await this.transporter.verify();
        console.log('✅ Email service configuration verified');
        return { success: true, configured: true };
      } else {
        console.log('⚠️ Email service in demo mode');
        return { success: true, configured: false, demo_mode: true };
      }
    } catch (error) {
      console.error('❌ Email configuration test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const emailService = new ApexEmailService();
export default emailService;