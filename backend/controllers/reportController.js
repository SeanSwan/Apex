// File: backend/src/controllers/reportController.js

/**
 * Report Controller
 * 
 * Handles report generation, storage, and delivery
 * Integrates with SendGrid and Twilio for delivery
 */

const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const { Storage } = require('@google-cloud/storage'); // Or use AWS S3 or another storage solution

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Configure Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Configure storage (example with Google Cloud Storage)
const storage = new Storage({
  keyFilename: process.env.GCS_KEY_FILE,
  projectId: process.env.GCS_PROJECT_ID,
});
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

// Temp storage for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './uploads');
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
});

/**
 * Upload a report PDF to storage
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.uploadReport = [
  upload.single('file'),
  async (req, res) => {
    try {
      const { file } = req;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Create a unique filename
      const filename = `reports/${uuidv4()}-${path.basename(file.originalname)}`;
      
      // Upload to cloud storage
      await bucket.upload(file.path, {
        destination: filename,
        metadata: {
          contentType: file.mimetype,
        },
      });
      
      // Make the file publicly accessible (or use signed URLs for more security)
      await bucket.file(filename).makePublic();
      
      // Get the public URL
      const publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${filename}`;
      
      // Remove the temporary file
      await fs.unlink(file.path);
      
      // Return the URL to the client
      res.json({ 
        success: true,
        url: publicUrl 
      });
    } catch (error) {
      console.error('Error uploading report:', error);
      res.status(500).json({ error: 'Failed to upload report' });
    }
  }
];

/**
 * Save a report draft to the database
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.saveReportDraft = async (req, res) => {
  try {
    const reportData = req.body;
    
    // Validate required fields
    if (!reportData.clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }
    
    // Add additional metadata
    const reportId = reportData.id || uuidv4();
    const updatedReport = {
      ...reportData,
      id: reportId,
      updatedAt: new Date(),
      createdBy: req.user.id,
      status: reportData.status || 'draft',
    };
    
    // Save to database (example with MongoDB)
    const savedReport = await db.collection('reports').updateOne(
      { id: reportId },
      { $set: updatedReport },
      { upsert: true }
    );
    
    res.json({
      success: true,
      id: reportId,
      ...updatedReport
    });
  } catch (error) {
    console.error('Error saving report draft:', error);
    res.status(500).json({ error: 'Failed to save report draft' });
  }
};

/**
 * Get a report by ID
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getReport = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get from database
    const report = await db.collection('reports').findOne({ id });
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
};

/**
 * Send a report to recipients via email and/or SMS
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.sendReport = async (req, res) => {
  try {
    const { clientId, reportUrl, deliveryOptions, subject, message } = req.body;
    
    // Get client data for personalization
    const client = await db.collection('clients').findOne({ id: clientId });
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    let emailResults = [];
    let smsResults = [];
    
    // Send email if enabled
    if (deliveryOptions.email && deliveryOptions.emailRecipients.length > 0) {
      emailResults = await sendEmailReports(
        deliveryOptions.emailRecipients,
        subject,
        message,
        reportUrl,
        client
      );
    }
    
    // Send SMS if enabled
    if (deliveryOptions.sms && deliveryOptions.smsRecipients.length > 0) {
      smsResults = await sendSmsNotifications(
        deliveryOptions.smsRecipients,
        `${subject}: ${reportUrl}`,
        client
      );
    }
    
    // Log the delivery
    await db.collection('reportDeliveries').insertOne({
      reportUrl,
      clientId,
      deliveryOptions,
      emailResults,
      smsResults,
      timestamp: new Date(),
      userId: req.user.id,
    });
    
    res.json({
      success: true,
      emailResults,
      smsResults,
    });
  } catch (error) {
    console.error('Error sending report:', error);
    res.status(500).json({ error: 'Failed to send report' });
  }
};

/**
 * Send emails with the report link
 * 
 * @param {string[]} recipients - Array of email addresses
 * @param {string} subject - Email subject
 * @param {string} message - Email message
 * @param {string} reportUrl - URL to the report PDF
 * @param {Object} client - Client data for personalization
 * @returns {Promise<Array>} - Array of SendGrid responses
 */
async function sendEmailReports(recipients, subject, message, reportUrl, client) {
  try {
    // Create email template with company branding
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0070f3; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Security Monitoring Report</h1>
          <p style="color: white; margin: 10px 0 0 0;">${client.name}</p>
        </div>
        
        <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
          <p>Hello,</p>
          <p>${message}</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${reportUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              View Report
            </a>
          </div>
          <p>If the button above doesn't work, you can access the report directly at this link:</p>
          <p><a href="${reportUrl}">${reportUrl}</a></p>
          <p>Thank you for choosing our security monitoring services.</p>
          <p>Best regards,<br>Defense International Team</p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} Defense International. All rights reserved.</p>
        </div>
      </div>
    `;
    
    // Prepare email batch
    const emails = recipients.map(recipient => ({
      to: recipient,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject,
      text: `${message}\n\nView your report at: ${reportUrl}`,
      html: htmlContent,
    }));
    
    // Send emails
    const results = await Promise.all(
      emails.map(email => sgMail.send(email))
    );
    
    return results;
  } catch (error) {
    console.error('Error sending emails:', error);
    throw error;
  }
}

/**
 * Send SMS notifications with the report link
 * 
 * @param {string[]} recipients - Array of phone numbers
 * @param {string} message - SMS message
 * @param {Object} client - Client data for personalization
 * @returns {Promise<Array>} - Array of Twilio responses
 */
async function sendSmsNotifications(recipients, message, client) {
  try {
    // Prepare SMS batch
    const smsPromises = recipients.map(recipient => 
      twilioClient.messages.create({
        body: `${client.name} Security Report: ${message}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: recipient,
      })
    );
    
    // Send SMS messages
    const results = await Promise.all(smsPromises);
    
    return results;
  } catch (error) {
    console.error('Error sending SMS notifications:', error);
    throw error;
  }
}

/**
 * Get clients for the current user
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getClientsForUser = async (req, res) => {
  try {
    // Get user's assigned clients based on roles and permissions
    const userClients = await db.collection('clients')
      .find({ 
        $or: [
          { assignedUsers: req.user.id },
          { organizationId: req.user.organizationId }
        ] 
      })
      .toArray();
    
    res.json(userClients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
};

/**
 * Get metrics for a client
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getClientMetrics = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Get metrics from database or DVR integration
    const metrics = await fetchClientMetrics(clientId, start, end);
    
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching client metrics:', error);
    res.status(500).json({ error: 'Failed to fetch client metrics' });
  }
};

/**
 * Fetch metrics from DVR system or database
 * This is where you'd integrate with your specific DVR or data source
 * 
 * @param {string} clientId - Client ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} - Metrics data
 */
async function fetchClientMetrics(clientId, startDate, endDate) {
  // TODO: Implement integration with your DVR system
  // For now, return mock data
  
  // This is where you'd make API calls to your DVR system or database
  // to retrieve the actual metrics for the date range
  
  return {
    humanIntrusions: {
      Monday: Math.floor(Math.random() * 1000) + 500,
      Tuesday: Math.floor(Math.random() * 1000) + 500,
      Wednesday: Math.floor(Math.random() * 1000) + 500,
      Thursday: Math.floor(Math.random() * 1000) + 500,
      Friday: Math.floor(Math.random() * 1000) + 500,
      Saturday: Math.floor(Math.random() * 1000) + 500,
      Sunday: Math.floor(Math.random() * 1000) + 500,
    },
    vehicleIntrusions: {
      Monday: Math.floor(Math.random() * 2000) + 1000,
      Tuesday: Math.floor(Math.random() * 2000) + 1000,
      Wednesday: Math.floor(Math.random() * 2000) + 1000,
      Thursday: Math.floor(Math.random() * 2000) + 1000,
      Friday: Math.floor(Math.random() * 2000) + 1000,
      Saturday: Math.floor(Math.random() * 2000) + 1000,
      Sunday: Math.floor(Math.random() * 2000) + 1000,
    },
    aiAccuracy: 98.7,
    responseTime: 0.8,
    proactiveAlerts: Math.floor(Math.random() * 20000) + 10000,
    potentialThreats: Math.floor(Math.random() * 5),
    operationalUptime: 100,
    totalMonitoringHours: 168,
    totalCameras: 58,
    camerasOnline: 58,
  };
}