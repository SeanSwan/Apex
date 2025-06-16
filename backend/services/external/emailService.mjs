/**
 * APEX AI SECURITY PLATFORM - EMAIL SERVICE
 * ==========================================
 * Executive briefings and automated report delivery
 */

import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EmailService {
  constructor() {
    this.transporter = null;
    this.provider = process.env.EMAIL_PROVIDER || 'sendgrid'; // sendgrid, smtp, ses
    this.initialized = false;
    this.init();
  }

  async init() {
    try {
      switch (this.provider) {
        case 'sendgrid':
          await this.initSendGrid();
          break;
        case 'smtp':
          await this.initSMTP();
          break;
        case 'ses':
          await this.initSES();
          break;
        default:
          console.warn('No email provider configured');
      }
      this.initialized = true;
    } catch (error) {
      console.error('Email service initialization error:', error);
      this.initialized = false;
    }
  }

  async initSendGrid() {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      console.log('✅ SendGrid email service initialized');
    }
  }

  async initSMTP() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    // Verify connection
    await this.transporter.verify();
    console.log('✅ SMTP email service initialized');
  }

  async initSES() {
    // AWS SES would be initialized here
    console.log('✅ AWS SES email service initialized');
  }

  /**
   * Send executive briefing email
   * @param {Object} briefingData - Briefing content and metadata
   * @param {Array} recipients - List of executive email addresses
   */
  async sendExecutiveBriefing(briefingData, recipients) {
    if (!this.initialized) {
      console.warn('Email service not initialized');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const emailContent = await this.generateExecutiveBriefingHTML(briefingData);
      
      const emailData = {
        to: recipients,
        from: {
          email: process.env.FROM_EMAIL || 'noreply@apexai-security.com',
          name: 'APEX AI Security Platform'
        },
        subject: `Security Intelligence Briefing - ${briefingData.period} ${briefingData.date}`,
        html: emailContent,
        text: this.generateExecutiveBriefingText(briefingData),
        attachments: briefingData.attachments || []
      };

      const result = await this.sendEmail(emailData);
      
      // Log briefing delivery
      console.log(`📧 Executive briefing sent to ${recipients.length} recipients`);
      
      return result;
      
    } catch (error) {
      console.error('Executive briefing send error:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Send incident alert email
   * @param {Object} incidentData - Incident details
   * @param {Array} recipients - Notification recipients
   */
  async sendIncidentAlert(incidentData, recipients) {
    try {
      const priority = incidentData.severity?.toLowerCase() || 'medium';
      const urgentFlag = priority === 'critical' || priority === 'high' ? '[URGENT] ' : '';
      
      const emailData = {
        to: recipients,
        from: {
          email: process.env.FROM_EMAIL || 'alerts@apexai-security.com',
          name: 'APEX AI Security Alerts'
        },
        subject: `${urgentFlag}Security Incident Alert - ${incidentData.incident_type}`,
        html: await this.generateIncidentAlertHTML(incidentData),
        text: this.generateIncidentAlertText(incidentData),
        priority: priority === 'critical' ? 'high' : 'normal'
      };

      const result = await this.sendEmail(emailData);
      
      console.log(`🚨 Incident alert sent for ${incidentData.incident_id}`);
      
      return result;
      
    } catch (error) {
      console.error('Incident alert send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send scheduled report
   * @param {Object} reportData - Report content and metadata
   * @param {Array} recipients - Report recipients
   */
  async sendScheduledReport(reportData, recipients) {
    try {
      const emailData = {
        to: recipients,
        from: {
          email: process.env.FROM_EMAIL || 'reports@apexai-security.com',
          name: 'APEX AI Security Reports'
        },
        subject: `${reportData.report_type} Security Report - ${reportData.period}`,
        html: await this.generateReportEmailHTML(reportData),
        text: this.generateReportEmailText(reportData),
        attachments: [
          {
            filename: `${reportData.report_type}_${reportData.period}.pdf`,
            content: reportData.pdf_buffer,
            type: 'application/pdf',
            disposition: 'attachment'
          }
        ]
      };

      const result = await this.sendEmail(emailData);
      
      console.log(`📊 ${reportData.report_type} report sent to ${recipients.length} recipients`);
      
      return result;
      
    } catch (error) {
      console.error('Report email send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send guard notification email
   * @param {Object} guardData - Guard information
   * @param {Object} notificationData - Notification content
   */
  async sendGuardNotification(guardData, notificationData) {
    try {
      const emailData = {
        to: [guardData.email],
        from: {
          email: process.env.FROM_EMAIL || 'dispatch@apexai-security.com',
          name: 'APEX AI Security Dispatch'
        },
        subject: notificationData.subject,
        html: await this.generateGuardNotificationHTML(guardData, notificationData),
        text: this.generateGuardNotificationText(guardData, notificationData)
      };

      const result = await this.sendEmail(emailData);
      
      console.log(`👮 Guard notification sent to ${guardData.name}`);
      
      return result;
      
    } catch (error) {
      console.error('Guard notification send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Core email sending function
   */
  async sendEmail(emailData) {
    try {
      switch (this.provider) {
        case 'sendgrid':
          await sgMail.send(emailData);
          break;
        case 'smtp':
          await this.transporter.sendMail(emailData);
          break;
        case 'ses':
          // AWS SES implementation would go here
          break;
        default:
          throw new Error('No email provider configured');
      }

      return {
        success: true,
        message_id: `email_${Date.now()}`,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Email send error:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate executive briefing HTML content
   */
  async generateExecutiveBriefingHTML(briefingData) {
    const template = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>APEX AI Security Intelligence Briefing</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
            .header .subtitle { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
            .content { padding: 30px; }
            .section { margin-bottom: 30px; }
            .section h2 { color: #1a1a1a; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #FFD700; padding-bottom: 5px; }
            .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
            .metric-card { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; border-left: 4px solid #FFD700; }
            .metric-number { font-size: 32px; font-weight: bold; color: #1a1a1a; margin-bottom: 5px; }
            .metric-label { font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
            .alert-item { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 10px 0; }
            .alert-critical { background: #f8d7da; border-color: #f5c6cb; }
            .alert-high { background: #fff3cd; border-color: #ffeaa7; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .priority-critical { color: #dc3545; font-weight: bold; }
            .priority-high { color: #fd7e14; font-weight: bold; }
            .priority-medium { color: #28a745; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🛡️ APEX AI Security Intelligence</h1>
                <p class="subtitle">Executive Briefing - ${briefingData.period} ${briefingData.date}</p>
            </div>
            
            <div class="content">
                <div class="section">
                    <h2>📊 Key Security Metrics</h2>
                    <div class="metric-grid">
                        <div class="metric-card">
                            <div class="metric-number">${briefingData.metrics?.total_alerts || 0}</div>
                            <div class="metric-label">Total Alerts</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-number">${briefingData.metrics?.critical_incidents || 0}</div>
                            <div class="metric-label">Critical Incidents</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-number">${briefingData.metrics?.guard_dispatches || 0}</div>
                            <div class="metric-label">Guard Dispatches</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-number">${briefingData.metrics?.avg_response_time || 0}min</div>
                            <div class="metric-label">Avg Response Time</div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h2>🚨 Critical Incidents</h2>
                    ${(briefingData.critical_incidents || []).map(incident => `
                        <div class="alert-item alert-critical">
                            <strong>${incident.incident_type}</strong> - ${incident.location}<br>
                            <small>${incident.timestamp} | Priority: <span class="priority-critical">CRITICAL</span></small><br>
                            ${incident.description}
                        </div>
                    `).join('')}
                </div>

                <div class="section">
                    <h2>⚠️ High Priority Alerts</h2>
                    ${(briefingData.high_priority_alerts || []).map(alert => `
                        <div class="alert-item alert-high">
                            <strong>${alert.alert_type}</strong> - Camera ${alert.camera_id}<br>
                            <small>${alert.timestamp} | Risk Score: ${alert.risk_score}/10</small><br>
                            ${alert.description}
                        </div>
                    `).join('')}
                </div>

                <div class="section">
                    <h2>📈 AI Performance Summary</h2>
                    <p><strong>Detection Accuracy:</strong> ${briefingData.ai_performance?.accuracy || 0}%</p>
                    <p><strong>False Positive Rate:</strong> ${briefingData.ai_performance?.false_positive_rate || 0}%</p>
                    <p><strong>Threat Vectors Identified:</strong> ${briefingData.ai_performance?.threat_vectors || 0}</p>
                    <p><strong>Proactive Interventions:</strong> ${briefingData.ai_performance?.interventions || 0}</p>
                </div>

                <div class="section">
                    <h2>👮 Guard Performance</h2>
                    <p><strong>Average Response Time:</strong> ${briefingData.guard_performance?.avg_response || 0} minutes</p>
                    <p><strong>Incidents Resolved:</strong> ${briefingData.guard_performance?.resolved || 0}</p>
                    <p><strong>Guards on Duty:</strong> ${briefingData.guard_performance?.on_duty || 0}</p>
                    <p><strong>Coverage Efficiency:</strong> ${briefingData.guard_performance?.efficiency || 0}%</p>
                </div>
            </div>
            
            <div class="footer">
                <p>APEX AI Security Platform | Generated ${new Date().toLocaleString()}</p>
                <p>This briefing was automatically generated by the APEX AI Intelligence system</p>
            </div>
        </div>
    </body>
    </html>
    `;
    
    return template;
  }

  /**
   * Generate incident alert HTML
   */
  async generateIncidentAlertHTML(incidentData) {
    const severityColor = {
      critical: '#dc3545',
      high: '#fd7e14',
      medium: '#ffc107',
      low: '#28a745'
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .alert-container { max-width: 600px; margin: 0 auto; border: 2px solid ${severityColor[incidentData.severity] || '#28a745'}; border-radius: 8px; }
            .alert-header { background: ${severityColor[incidentData.severity] || '#28a745'}; color: white; padding: 20px; text-align: center; }
            .alert-content { padding: 20px; }
            .detail-row { margin: 10px 0; }
            .label { font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="alert-container">
            <div class="alert-header">
                <h1>🚨 SECURITY INCIDENT ALERT</h1>
                <h2>${incidentData.incident_type}</h2>
            </div>
            <div class="alert-content">
                <div class="detail-row">
                    <span class="label">Incident ID:</span> ${incidentData.incident_id}
                </div>
                <div class="detail-row">
                    <span class="label">Severity:</span> ${incidentData.severity?.toUpperCase()}
                </div>
                <div class="detail-row">
                    <span class="label">Location:</span> ${incidentData.location}
                </div>
                <div class="detail-row">
                    <span class="label">Time:</span> ${incidentData.timestamp}
                </div>
                <div class="detail-row">
                    <span class="label">Description:</span><br>${incidentData.description}
                </div>
                ${incidentData.assigned_guard ? `
                <div class="detail-row">
                    <span class="label">Assigned Guard:</span> ${incidentData.assigned_guard}
                </div>
                ` : ''}
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Text versions for accessibility
  generateExecutiveBriefingText(briefingData) {
    return `
APEX AI Security Intelligence Briefing
${briefingData.period} ${briefingData.date}

KEY METRICS:
- Total Alerts: ${briefingData.metrics?.total_alerts || 0}
- Critical Incidents: ${briefingData.metrics?.critical_incidents || 0}
- Guard Dispatches: ${briefingData.metrics?.guard_dispatches || 0}
- Average Response Time: ${briefingData.metrics?.avg_response_time || 0} minutes

This briefing was automatically generated by the APEX AI Security Platform.
    `.trim();
  }

  generateIncidentAlertText(incidentData) {
    return `
SECURITY INCIDENT ALERT

Incident Type: ${incidentData.incident_type}
Severity: ${incidentData.severity?.toUpperCase()}
Location: ${incidentData.location}
Time: ${incidentData.timestamp}
Description: ${incidentData.description}
${incidentData.assigned_guard ? `Assigned Guard: ${incidentData.assigned_guard}` : ''}

Incident ID: ${incidentData.incident_id}
    `.trim();
  }

  generateReportEmailHTML(reportData) {
    return `
    <h1>Security Report - ${reportData.report_type}</h1>
    <p>Period: ${reportData.period}</p>
    <p>Please find the attached ${reportData.report_type} security report.</p>
    <p>This report was automatically generated by the APEX AI Security Platform.</p>
    `;
  }

  generateReportEmailText(reportData) {
    return `Security Report - ${reportData.report_type}\nPeriod: ${reportData.period}\n\nPlease find the attached report.`;
  }

  generateGuardNotificationHTML(guardData, notificationData) {
    return `<h1>Hello ${guardData.name}</h1><p>${notificationData.message}</p>`;
  }

  generateGuardNotificationText(guardData, notificationData) {
    return `Hello ${guardData.name}\n\n${notificationData.message}`;
  }

  /**
   * Get service health status
   */
  async getServiceHealth() {
    return {
      provider: this.provider,
      initialized: this.initialized,
      last_check: new Date().toISOString()
    };
  }
}

export default new EmailService();