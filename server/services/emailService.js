// Import nodemailer with error handling
let nodemailer;
let nodemailerError = null;

try {
  nodemailer = require('nodemailer');
  console.log('✅ Nodemailer loaded successfully');
  console.log('📦 Module info:', {
    type: typeof nodemailer,
    hasCreateTransport: typeof nodemailer?.createTransport,
    isFunction: typeof nodemailer?.createTransport === 'function'
  });
} catch (error) {
  nodemailerError = error;
  console.error('❌ Failed to load nodemailer:', error.message);
}

class EmailService {
  constructor() {
    this.transporter = null;
    this.isEnabled = false;
    
    if (!nodemailer) {
      console.error('❌ Nodemailer not available:', nodemailerError?.message || 'Module not loaded');
      return;
    }
    
    if (typeof nodemailer.createTransport !== 'function') {
      console.error('❌ nodemailer.createTransport is not a function. Module type:', typeof nodemailer);
      console.error('Available properties:', Object.keys(nodemailer));
      return;
    }
    
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      console.log('🔧 Creating email transporter...');
      
      // Configure with Brevo (formerly Sendinblue) SMTP settings
      // Try port 465 with SSL first (more reliable on cloud platforms)
      const smtpPort = parseInt(process.env.BREVO_SMTP_PORT) || 465;
      const isSecure = smtpPort === 465;
      
      console.log(`🔧 Attempting SMTP connection to smtp-relay.brevo.com:${smtpPort} (SSL: ${isSecure})`);
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: smtpPort,
        secure: isSecure, // true for 465, false for 587/2525
        auth: {
          user: process.env.BREVO_SMTP_USER || process.env.BREVO_EMAIL,
          pass: process.env.BREVO_SMTP_PASSWORD || process.env.BREVO_API_KEY
        },
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000,
        socketTimeout: 10000,
        tls: {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2'
        },
        debug: false, // Set to true for detailed SMTP logs
        logger: false
      });

      console.log('✅ Transporter created successfully');
      
      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('❌ SMTP connection failed:', error.message);
          this.isEnabled = false;
        } else {
          console.log('✅ SMTP connection verified - Email service ready!');
          this.isEnabled = true;
        }
      });
      
      // Set enabled immediately (will be disabled if verify fails)
      this.isEnabled = true;
      
    } catch (error) {
      console.error('❌ Failed to create transporter:', error.message);
      console.error('Stack:', error.stack);
      this.isEnabled = false;
      this.transporter = null;
    }
  }

  async sendWelcomeEmail(userEmail, userName) {
    if (!this.isEnabled || !this.transporter) {
      console.log('📧 Email service disabled - skipping welcome email');
      return { messageId: 'disabled' };
    }

    const senderEmail = process.env.SENDER_EMAIL || 'mavinodundo@gmail.com';
    const mailOptions = {
      from: `"MentourMe Team" <${senderEmail}>`,
      to: userEmail,
      subject: '🎉 Welcome to MentourMe - Your Mentorship Journey Begins!',
      html: this.getWelcomeEmailTemplate(userName)
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      throw error;
    }
  }

  async sendMentorMatchEmail(userEmail, userName, mentorName, mentorExpertise) {
    const senderEmail = process.env.SENDER_EMAIL || 'mavinodundo@gmail.com';
    const mailOptions = {
      from: `"MentourMe Team" <${senderEmail}>`,
      to: userEmail,
      subject: '🤝 You\'ve Been Matched with a Mentor!',
      html: this.getMentorMatchEmailTemplate(userName, mentorName, mentorExpertise)
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Mentor match email sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Failed to send mentor match email:', error);
      throw error;
    }
  }

  async sendSessionReminderEmail(userEmail, userName, sessionDate, mentorName) {
    const senderEmail = process.env.SENDER_EMAIL || 'mavinodundo@gmail.com';
    const mailOptions = {
      from: `"MentourMe Team" <${senderEmail}>`,
      to: userEmail,
      subject: '⏰ Upcoming Mentorship Session Reminder',
      html: this.getSessionReminderTemplate(userName, sessionDate, mentorName)
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Session reminder email sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Failed to send session reminder email:', error);
      throw error;
    }
  }

  async sendNewsletterSignupEmail(userEmail) {
    if (!this.isEnabled || !this.transporter) {
      console.log('📧 Email service disabled - skipping newsletter email');
      return { messageId: 'disabled' };
    }

    const senderEmail = process.env.SENDER_EMAIL || 'mavinodundo@gmail.com';
    const mailOptions = {
      from: `"MentourMe Team" <${senderEmail}>`,
      to: userEmail,
      subject: '📧 Welcome to MentourMe Insights Newsletter',
      html: this.getNewsletterSignupTemplate()
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Newsletter signup email sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Failed to send newsletter signup email:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(userEmail, resetToken) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    const senderEmail = process.env.SENDER_EMAIL || 'mavinodundo@gmail.com';
    const mailOptions = {
      from: `"MentourMe Team" <${senderEmail}>`,
      to: userEmail,
      subject: '🔐 Reset Your MentourMe Password',
      html: this.getPasswordResetTemplate(resetUrl)
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      throw error;
    }
  }

  getWelcomeEmailTemplate(userName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to MentourMe</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #4f46e5 100%); padding: 40px 30px; text-align: center; }
        .logo { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .tagline { color: rgba(255,255,255,0.9); font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 20px; }
        .message { font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 30px; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .features { margin: 30px 0; }
        .feature { display: flex; align-items: center; margin: 15px 0; }
        .feature-icon { width: 24px; height: 24px; margin-right: 15px; }
        .footer { background-color: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">MentourMe</div>
          <div class="tagline">Empowering Growth</div>
        </div>
        
        <div class="content">
          <h1 class="greeting">Welcome to MentourMe, ${userName}! 🎉</h1>
          
          <p class="message">
            We're thrilled to have you join our community of ambitious professionals and experienced mentors. 
            Your journey towards accelerated career growth starts now!
          </p>
          
          <div class="features">
            <div class="feature">
              <span style="color: #3b82f6; font-size: 20px; margin-right: 15px;">🤝</span>
              <span>Connect with industry-leading mentors</span>
            </div>
            <div class="feature">
              <span style="color: #8b5cf6; font-size: 20px; margin-right: 15px;">💬</span>
              <span>Real-time messaging and video calls</span>
            </div>
            <div class="feature">
              <span style="color: #4f46e5; font-size: 20px; margin-right: 15px;">🎯</span>
              <span>Personalized goal tracking and achievement</span>
            </div>
          </div>
          
          <p class="message">
            Ready to take the next step? Complete your profile and start connecting with mentors who can 
            help you achieve your career goals.
          </p>
          
          <a href="${process.env.CLIENT_URL}/dashboard" class="cta-button">
            Complete Your Profile →
          </a>
        </div>
        
        <div class="footer">
          <p>© 2024 MentourMe. All rights reserved.</p>
          <p>This email was sent to you because you signed up for MentourMe.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  getMentorMatchEmailTemplate(userName, mentorName, mentorExpertise) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mentor Match Found!</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); padding: 40px 30px; text-align: center; color: white; }
        .content { padding: 40px 30px; }
        .mentor-card { border: 2px solid #e5e7eb; border-radius: 12px; padding: 25px; margin: 25px 0; background: linear-gradient(135deg, #f0f9ff 0%, #f3e8ff 100%); }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #10b981, #3b82f6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🤝 Great News, ${userName}!</h1>
          <p>We've found the perfect mentor for you</p>
        </div>
        
        <div class="content">
          <div class="mentor-card">
            <h2 style="color: #1f2937; margin-bottom: 15px;">Your New Mentor: ${mentorName}</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              <strong>Expertise:</strong> ${mentorExpertise}
            </p>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Based on your goals and interests, we believe ${mentorName} is an excellent match 
              to help guide your professional development journey.
            </p>
          </div>
          
          <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
            You can now start messaging your mentor and schedule your first mentorship session. 
            We recommend introducing yourself and sharing your current goals and challenges.
          </p>
          
          <a href="${process.env.CLIENT_URL}/messages" class="cta-button">
            Start Conversation →
          </a>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  getSessionReminderTemplate(userName, sessionDate, mentorName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Session Reminder</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 40px 30px; text-align: center; color: white; }
        .content { padding: 40px 30px; }
        .session-details { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Session Reminder</h1>
          <p>Don't forget about your upcoming mentorship session!</p>
        </div>
        
        <div class="content">
          <p style="font-size: 18px; color: #1f2937;">Hi ${userName},</p>
          
          <div class="session-details">
            <h3 style="margin-top: 0; color: #92400e;">Upcoming Session Details</h3>
            <p style="margin: 10px 0; color: #92400e;"><strong>Mentor:</strong> ${mentorName}</p>
            <p style="margin: 10px 0; color: #92400e;"><strong>Date & Time:</strong> ${sessionDate}</p>
          </div>
          
          <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
            Your mentorship session is coming up! Make sure you're prepared with any questions 
            or topics you'd like to discuss. This is a great opportunity to get personalized 
            guidance on your career goals.
          </p>
          
          <a href="${process.env.CLIENT_URL}/video-call" class="cta-button">
            Join Session →
          </a>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  getNewsletterSignupTemplate() {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Newsletter Subscription Confirmed</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%); padding: 40px 30px; text-align: center; color: white; }
        .content { padding: 40px 30px; }
        .benefits { margin: 30px 0; }
        .benefit { display: flex; align-items: center; margin: 15px 0; padding: 15px; background: #f8fafc; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📧 Welcome to MentourMe Insights!</h1>
          <p>Your subscription has been confirmed</p>
        </div>
        
        <div class="content">
          <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
            Thank you for subscribing to MentourMe Insights! You'll now receive weekly career tips, 
            success stories, and exclusive mentorship opportunities directly in your inbox.
          </p>
          
          <div class="benefits">
            <div class="benefit">
              <span style="color: #8b5cf6; font-size: 20px; margin-right: 15px;">💡</span>
              <span>Weekly career development tips and strategies</span>
            </div>
            <div class="benefit">
              <span style="color: #3b82f6; font-size: 20px; margin-right: 15px;">🌟</span>
              <span>Inspiring success stories from our community</span>
            </div>
            <div class="benefit">
              <span style="color: #10b981; font-size: 20px; margin-right: 15px;">🎯</span>
              <span>Exclusive mentorship opportunities and events</span>
            </div>
          </div>
          
          <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
            Stay tuned for your first newsletter coming this week!
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  getPasswordResetTemplate(resetUrl) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); padding: 40px 30px; text-align: center; color: white; }
        .content { padding: 40px 30px; }
        .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #ef4444, #f97316); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
          <p>Secure your MentourMe account</p>
        </div>
        
        <div class="content">
          <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
            We received a request to reset your MentourMe password. If you made this request, 
            click the button below to create a new password.
          </p>
          
          <a href="${resetUrl}" class="cta-button">
            Reset Password →
          </a>
          
          <div class="warning">
            <p style="margin: 0; color: #dc2626; font-weight: bold;">Security Notice:</p>
            <p style="margin: 10px 0 0 0; color: #dc2626;">
              This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
  }
}

let emailServiceInstance = null;

module.exports = {
  getInstance() {
    if (!emailServiceInstance) {
      emailServiceInstance = new EmailService();
    }
    return emailServiceInstance;
  },
  
  // Convenience methods
  async sendWelcomeEmail(userEmail, userName) {
    return this.getInstance().sendWelcomeEmail(userEmail, userName);
  },
  
  async sendNewsletterSignupEmail(userEmail) {
    return this.getInstance().sendNewsletterSignupEmail(userEmail);
  },
  
  async sendMentorMatchEmail(userEmail, userName, mentorName, mentorExpertise) {
    return this.getInstance().sendMentorMatchEmail(userEmail, userName, mentorName, mentorExpertise);
  },
  
  async sendSessionReminderEmail(userEmail, userName, sessionDate, mentorName) {
    return this.getInstance().sendSessionReminderEmail(userEmail, userName, sessionDate, mentorName);
  },
  
  async sendPasswordResetEmail(userEmail, resetToken) {
    return this.getInstance().sendPasswordResetEmail(userEmail, resetToken);
  }
};
