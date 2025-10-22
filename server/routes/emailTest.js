const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

// Allow CORS for email test endpoints (for testing purposes)
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

/**
 * Test endpoint to verify Brevo email configuration
 * GET /api/email-test/verify
 */
router.get('/verify', async (req, res) => {
  try {
    console.log('🔍 Testing Brevo email configuration...');
    
    // Check if environment variables are set
    const config = {
      BREVO_SMTP_USER: process.env.BREVO_SMTP_USER || process.env.BREVO_EMAIL,
      BREVO_SMTP_PASSWORD: process.env.BREVO_SMTP_PASSWORD || process.env.BREVO_API_KEY,
      CLIENT_URL: process.env.CLIENT_URL,
      hasUser: !!(process.env.BREVO_SMTP_USER || process.env.BREVO_EMAIL),
      hasPassword: !!(process.env.BREVO_SMTP_PASSWORD || process.env.BREVO_API_KEY),
      hasClientUrl: !!process.env.CLIENT_URL
    };

    console.log('📋 Environment Variables Check:');
    console.log('  ✓ BREVO_SMTP_USER:', config.hasUser ? '✅ Set' : '❌ Missing');
    console.log('  ✓ BREVO_SMTP_PASSWORD:', config.hasPassword ? '✅ Set' : '❌ Missing');
    console.log('  ✓ CLIENT_URL:', config.hasClientUrl ? '✅ Set' : '❌ Missing');

    // Check if email service is enabled
    const service = emailService.getInstance();
    if (!service.isEnabled) {
      return res.status(500).json({
        success: false,
        message: 'Email service is disabled - nodemailer not available',
        config: {
          hasUser: config.hasUser,
          hasPassword: config.hasPassword,
          hasClientUrl: config.hasClientUrl
        }
      });
    }

    // Verify SMTP connection
    if (service.transporter) {
      await new Promise((resolve, reject) => {
        service.transporter.verify((error, success) => {
          if (error) {
            console.error('❌ SMTP Connection Failed:', error.message);
            reject(error);
          } else {
            console.log('✅ SMTP Connection Successful!');
            resolve(success);
          }
        });
      });

      res.json({
        success: true,
        message: 'Brevo email service is properly configured and connected!',
        config: {
          smtpHost: 'smtp-relay.brevo.com',
          smtpPort: 587,
          hasUser: config.hasUser,
          hasPassword: config.hasPassword,
          hasClientUrl: config.hasClientUrl,
          userEmail: config.BREVO_SMTP_USER ? config.BREVO_SMTP_USER.substring(0, 3) + '***' : 'Not set'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Email transporter not initialized',
        config: {
          hasUser: config.hasUser,
          hasPassword: config.hasPassword,
          hasClientUrl: config.hasClientUrl
        }
      });
    }
  } catch (error) {
    console.error('❌ Email configuration test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Email configuration test failed',
      error: error.message,
      details: error.code || 'Unknown error'
    });
  }
});

/**
 * Send a test email
 * POST /api/email-test/send
 * Body: { email: 'recipient@example.com' }
 */
router.post('/send', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    console.log(`📧 Sending test email to: ${email}`);

    const service = emailService.getInstance();
    
    if (!service.isEnabled || !service.transporter) {
      return res.status(500).json({
        success: false,
        message: 'Email service is not available'
      });
    }

    // Send a simple test email
    // Use environment variable for sender email, fallback to Brevo verified sender
    const senderEmail = process.env.SENDER_EMAIL || 'mavinodundo@gmail.com';
    const mailOptions = {
      from: `"MentourMe Team" <${senderEmail}>`,
      to: email,
      subject: '🧪 MentourMe Email Configuration Test',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #ea580c 0%, #dc2626 100%); padding: 40px 30px; text-align: center; color: white; }
            .content { padding: 40px 30px; }
            .success-badge { background: #10b981; color: white; padding: 10px 20px; border-radius: 8px; display: inline-block; font-weight: bold; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚔️ MentourMe Email Test</h1>
              <p>Brevo Configuration Successful!</p>
            </div>
            <div class="content">
              <div class="success-badge">✅ EMAIL SERVICE WORKING</div>
              <h2>Congratulations!</h2>
              <p>Your Brevo email service is properly configured and working perfectly.</p>
              <p><strong>Test Details:</strong></p>
              <ul>
                <li>SMTP Host: smtp-relay.brevo.com</li>
                <li>Port: 587</li>
                <li>Security: TLS</li>
                <li>Status: ✅ Connected</li>
              </ul>
              <p>You can now send emails for:</p>
              <ul>
                <li>🔐 Password resets</li>
                <li>👋 Welcome messages</li>
                <li>🤝 Mentor approvals</li>
                <li>📅 Session reminders</li>
                <li>⚔️ Task notifications</li>
                <li>📧 And much more!</li>
              </ul>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await service.transporter.sendMail(mailOptions);
    
    console.log('✅ Test email sent successfully:', result.messageId);

    res.json({
      success: true,
      message: 'Test email sent successfully!',
      messageId: result.messageId,
      recipient: email
    });
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

module.exports = router;
