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

  async sendMentorApplicationReceivedEmail(userEmail, userName) {
    if (!this.isEnabled || !this.transporter) {
      console.log('📧 Email service disabled - skipping mentor application email');
      return { messageId: 'disabled' };
    }

    const senderEmail = process.env.SENDER_EMAIL || 'mavinodundo@gmail.com';
    const mailOptions = {
      from: `"MentourMe Team" <${senderEmail}>`,
      to: userEmail,
      subject: '🛡️ Mentor Application Received - Under Elite Review',
      html: this.getMentorApplicationReceivedTemplate(userName)
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Mentor application received email sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Failed to send mentor application email:', error);
      throw error;
    }
  }

  async sendMentorApprovalEmail(userEmail, userName) {
    if (!this.isEnabled || !this.transporter) {
      console.log('📧 Email service disabled - skipping mentor approval email');
      return { messageId: 'disabled' };
    }

    const senderEmail = process.env.SENDER_EMAIL || 'mavinodundo@gmail.com';
    const clientUrl = process.env.CLIENT_URL || 'https://mentourme-v3.pages.dev';
    const mailOptions = {
      from: `"MentourMe Team" <${senderEmail}>`,
      to: userEmail,
      subject: '🎉 You\'re Now an Elite Mentor - Application Approved!',
      html: this.getMentorApprovalTemplate(userName, clientUrl)
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Mentor approval email sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Failed to send mentor approval email:', error);
      throw error;
    }
  }

  async sendMentorshipRequestEmail(mentorEmail, mentorName, menteeName, menteeMessage) {
    if (!this.isEnabled || !this.transporter) {
      console.log('📧 Email service disabled - skipping mentorship request email');
      return { messageId: 'disabled' };
    }

    const senderEmail = process.env.SENDER_EMAIL || 'mavinodundo@gmail.com';
    const clientUrl = process.env.CLIENT_URL || 'https://mentourme-v3.pages.dev';
    const mailOptions = {
      from: `"MentourMe Team" <${senderEmail}>`,
      to: mentorEmail,
      subject: '🤝 New Warrior Seeks Your Mentorship!',
      html: this.getMentorshipRequestTemplate(mentorName, menteeName, menteeMessage, clientUrl)
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Mentorship request email sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Failed to send mentorship request email:', error);
      throw error;
    }
  }

  async sendMentorshipAcceptedEmail(menteeEmail, menteeName, mentorName) {
    if (!this.isEnabled || !this.transporter) {
      console.log('📧 Email service disabled - skipping mentorship accepted email');
      return { messageId: 'disabled' };
    }

    const senderEmail = process.env.SENDER_EMAIL || 'mavinodundo@gmail.com';
    const clientUrl = process.env.CLIENT_URL || 'https://mentourme-v3.pages.dev';
    const mailOptions = {
      from: `"MentourMe Team" <${senderEmail}>`,
      to: menteeEmail,
      subject: '🎉 Your Mentor Has Accepted - Battle Journey Begins!',
      html: this.getMentorshipAcceptedTemplate(menteeName, mentorName, clientUrl)
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Mentorship accepted email sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Failed to send mentorship accepted email:', error);
      throw error;
    }
  }

  async sendTaskAssignedEmail(menteeEmail, menteeName, taskTitle, mentorName, dueDate) {
    if (!this.isEnabled || !this.transporter) {
      console.log('📧 Email service disabled - skipping task assigned email');
      return { messageId: 'disabled' };
    }

    const senderEmail = process.env.SENDER_EMAIL || 'mavinodundo@gmail.com';
    const clientUrl = process.env.CLIENT_URL || 'https://mentourme-v3.pages.dev';
    const mailOptions = {
      from: `"MentourMe Team" <${senderEmail}>`,
      to: menteeEmail,
      subject: '⚔️ New Battle Mission Assigned!',
      html: this.getTaskAssignedTemplate(menteeName, taskTitle, mentorName, dueDate, clientUrl)
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Task assigned email sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Failed to send task assigned email:', error);
      throw error;
    }
  }

  async sendSessionScheduledEmail(userEmail, userName, sessionDate, otherPersonName, isHost) {
    if (!this.isEnabled || !this.transporter) {
      console.log('📧 Email service disabled - skipping session scheduled email');
      return { messageId: 'disabled' };
    }

    const senderEmail = process.env.SENDER_EMAIL || 'mavinodundo@gmail.com';
    const clientUrl = process.env.CLIENT_URL || 'https://mentourme-v3.pages.dev';
    const mailOptions = {
      from: `"MentourMe Team" <${senderEmail}>`,
      to: userEmail,
      subject: '📅 Mentorship Session Scheduled!',
      html: this.getSessionScheduledTemplate(userName, sessionDate, otherPersonName, isHost, clientUrl)
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Session scheduled email sent:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ Failed to send session scheduled email:', error);
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

  getMentorApplicationReceivedTemplate(userName) {
    const clientUrl = process.env.CLIENT_URL || 'https://mentourme-v3.pages.dev';
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #1f2937, #111827); }
        .container { max-width: 600px; margin: 0 auto; background: #fff; }
        .header { background: linear-gradient(135deg, #ea580c, #dc2626); padding: 40px 30px; text-align: center; color: white; }
        .content { padding: 40px 30px; color: #374151; }
        .badge { background: #fef3c7; color: #92400e; padding: 10px 20px; border-radius: 8px; display: inline-block; font-weight: bold; margin: 20px 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #ea580c, #dc2626); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛡️ Mentor Application Received!</h1>
          <p>Welcome to the Elite Review Process</p>
        </div>
        <div class="content">
          <p style="font-size: 18px;">Greetings, <strong>${userName}</strong>!</p>
          
          <div class="badge">⚔️ APPLICATION UNDER REVIEW</div>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Thank you for your interest in joining MentourMe as an <strong>Elite Mentor</strong>! Your application has been received and is currently under review by our command team.
          </p>
          
          <h3>🔍 What Happens Next:</h3>
          <ul style="line-height: 1.8;">
            <li>📝 Our team will carefully review your experience and expertise</li>
            <li>✓ We'll verify your qualifications and background</li>
            <li>📧 You'll receive an email notification once the review is complete</li>
            <li>⏱️ This process typically takes 2-3 business days</li>
          </ul>
          
          <p style="font-size: 16px; line-height: 1.6; background: #f3f4f6; padding: 20px; border-left: 4px solid #ea580c; border-radius: 0 8px 8px 0;">
            <strong>💡 Pro Tip:</strong> While you wait, explore the platform and familiarize yourself with our warrior-themed mentorship approach!
          </p>
          
          <a href="${clientUrl}/dashboard" class="cta-button">
            Explore Platform →
          </a>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Questions? Contact us at support@mentourme.com
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  getMentorApprovalTemplate(userName, clientUrl) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #1f2937, #111827); }
        .container { max-width: 600px; margin: 0 auto; background: #fff; }
        .header { background: linear-gradient(135deg, #10b981, #059669); padding: 40px 30px; text-align: center; color: white; }
        .content { padding: 40px 30px; color: #374151; }
        .success-badge { background: #d1fae5; color: #065f46; padding: 15px 25px; border-radius: 8px; display: inline-block; font-weight: bold; margin: 20px 0; font-size: 18px; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #ea580c, #dc2626); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .feature-box { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="font-size: 32px; margin-bottom: 10px;">🎉 CONGRATULATIONS!</h1>
          <p style="font-size: 18px;">You're Now an Elite Mentor</p>
        </div>
        <div class="content">
          <p style="font-size: 18px;">Welcome to the ranks, <strong>${userName}</strong>!</p>
          
          <div class="success-badge">✅ MENTOR STATUS: APPROVED</div>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Your mentor application has been <strong>APPROVED</strong>! You are now officially part of our elite mentor community, ready to guide warriors on their journey to greatness.
          </p>
          
          <div class="feature-box">
            <h3 style="margin-top: 0; color: #92400e;">⚔️ Your Mentor Powers:</h3>
            <ul style="line-height: 1.8; color: #78350f;">
              <li>👥 Connect with mentees seeking your expertise</li>
              <li>📝 Assign battle missions (tasks) to your mentees</li>
              <li>📅 Schedule and conduct mentorship sessions</li>
              <li>🏆 Track and verify mentee progress</li>
              <li>💬 Engage in direct messaging and guidance</li>
            </ul>
          </div>
          
          <h3>🚀 Get Started Now:</h3>
          <ol style="line-height: 1.8;">
            <li>Complete your mentor profile</li>
            <li>Set your availability and areas of expertise</li>
            <li>Start receiving mentorship requests</li>
            <li>Guide warriors to victory!</li>
          </ol>
          
          <a href="${clientUrl}/dashboard" class="cta-button">
            Access Mentor Dashboard →
          </a>
          
          <p style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-top: 30px; border-left: 4px solid #3b82f6;">
            <strong>💡 Mentor Tip:</strong> The most effective mentors set clear expectations, provide consistent support, and celebrate their mentees' victories along the way.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  getMentorshipRequestTemplate(mentorName, menteeName, menteeMessage, clientUrl) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #1f2937, #111827); }
        .container { max-width: 600px; margin: 0 auto; background: #fff; }
        .header { background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 40px 30px; text-align: center; color: white; }
        .content { padding: 40px 30px; color: #374151; }
        .request-box { background: #eff6ff; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 10px 10px 0; }
        .secondary-button { display: inline-block; background: #6b7280; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🤝 New Mentorship Request!</h1>
          <p>A warrior seeks your guidance</p>
        </div>
        <div class="content">
          <p style="font-size: 18px;">Greetings, <strong>${mentorName}</strong>!</p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            <strong>${menteeName}</strong> has requested your mentorship. They believe your experience and expertise can help them achieve their goals.
          </p>
          
          <div class="request-box">
            <h3 style="margin-top: 0; color: #1e40af;">💬 Message from ${menteeName}:</h3>
            <p style="font-style: italic; color: #1e3a8a; line-height: 1.6;">
              "${menteeMessage || 'I would like to learn from your experience and expertise. I believe your guidance can help me grow in my journey.'}"
            </p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Review their profile and decide if you'd like to accept this mentorship opportunity. Remember, great mentorship creates lasting impact!
          </p>
          
          <div style="margin-top: 30px;">
            <a href="${clientUrl}/mentorship-requests" class="cta-button">
              ✅ View Request
            </a>
            <a href="${clientUrl}/dashboard" class="secondary-button">
              Go to Dashboard
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            You can accept or decline this request from your dashboard.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  getMentorshipAcceptedTemplate(menteeName, mentorName, clientUrl) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #1f2937, #111827); }
        .container { max-width: 600px; margin: 0 auto; background: #fff; }
        .header { background: linear-gradient(135deg, #10b981, #059669); padding: 40px 30px; text-align: center; color: white; }
        .content { padding: 40px 30px; color: #374151; }
        .success-box { background: #d1fae5; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #ea580c, #dc2626); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .tip-box { background: #fef3c7; padding: 20px; border-radius: 8px; margin-top: 25px; border-left: 4px solid #f59e0b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Great News!</h1>
          <p>Your mentorship journey begins!</p>
        </div>
        <div class="content">
          <p style="font-size: 18px;">Congratulations, <strong>${menteeName}</strong>!</p>
          
          <div class="success-box">
            <h2 style="margin-top: 0; color: #065f46;">✅ Mentorship Request Accepted!</h2>
            <p style="color: #047857; font-size: 16px; line-height: 1.6;">
              <strong>${mentorName}</strong> has accepted your mentorship request. Your battle journey with an elite mentor is now officially underway!
            </p>
          </div>
          
          <h3>🚀 Next Steps:</h3>
          <ol style="line-height: 1.8;">
            <li>Send a message to introduce yourself</li>
            <li>Share your goals and what you hope to achieve</li>
            <li>Schedule your first mentorship session</li>
            <li>Stay committed and engaged throughout your journey</li>
          </ol>
          
          <a href="${clientUrl}/messages" class="cta-button">
            Start Conversation →
          </a>
          
          <div class="tip-box">
            <h4 style="margin-top: 0; color: #92400e;">💡 Pro Tips for Success:</h4>
            <ul style="color: #78350f; line-height: 1.6;">
              <li>Be proactive in communication</li>
              <li>Come prepared to sessions with questions</li>
              <li>Complete assigned battle missions on time</li>
              <li>Be open to feedback and willing to learn</li>
            </ul>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  getTaskAssignedTemplate(menteeName, taskTitle, mentorName, dueDate, clientUrl) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #1f2937, #111827); }
        .container { max-width: 600px; margin: 0 auto; background: #fff; }
        .header { background: linear-gradient(135deg, #ea580c, #dc2626); padding: 40px 30px; text-align: center; color: white; }
        .content { padding: 40px 30px; color: #374151; }
        .task-box { background: #fef3c7; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ea580c; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #ea580c, #dc2626); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .deadline { background: #fee2e2; color: #991b1b; padding: 10px 15px; border-radius: 6px; display: inline-block; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚔️ New Battle Mission!</h1>
          <p>Your mentor has assigned you a quest</p>
        </div>
        <div class="content">
          <p style="font-size: 18px;">Warrior <strong>${menteeName}</strong>,</p>
          
          <div class="task-box">
            <h2 style="margin-top: 0; color: #92400e;">🎯 Mission: ${taskTitle}</h2>
            <p style="color: #78350f; margin: 10px 0;">
              <strong>Assigned by:</strong> ${mentorName}
            </p>
            <p style="color: #78350f; margin: 10px 0;">
              <div class="deadline">⏰ Deadline: ${dueDate}</div>
            </p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Your mentor <strong>${mentorName}</strong> has assigned you a new battle mission. This task is designed to help you grow and develop new skills on your journey.
          </p>
          
          <p style="background: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; line-height: 1.6;">
            <strong>💡 Remember:</strong> Complete this mission before the deadline. If you encounter challenges, don't hesitate to reach out to your mentor for guidance!
          </p>
          
          <a href="${clientUrl}/tasks" class="cta-button">
            View Mission Details →
          </a>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  getSessionScheduledTemplate(userName, sessionDate, otherPersonName, isHost, clientUrl) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #1f2937, #111827); }
        .container { max-width: 600px; margin: 0 auto; background: #fff; }
        .header { background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 40px 30px; text-align: center; color: white; }
        .content { padding: 40px 30px; color: #374151; }
        .session-box { background: #eff6ff; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 Session Scheduled!</h1>
          <p>Mentorship session confirmed</p>
        </div>
        <div class="content">
          <p style="font-size: 18px;">Hi <strong>${userName}</strong>,</p>
          
          <div class="session-box">
            <h2 style="margin-top: 0; color: #1e40af;">✅ Session Confirmed</h2>
            <p style="color: #1e3a8a; line-height: 1.6;">
              <strong>With:</strong> ${otherPersonName}<br>
              <strong>Date & Time:</strong> ${sessionDate}
            </p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6;">
            ${isHost ? 'You have scheduled a mentorship session' : 'A mentorship session has been scheduled'} with <strong>${otherPersonName}</strong>. Make sure to prepare any topics or questions you'd like to discuss.
          </p>
          
          <h3>✅ Preparation Tips:</h3>
          <ul style="line-height: 1.8;">
            <li>Review any battle missions or progress</li>
            <li>Prepare questions or discussion topics</li>
            <li>Test your video connection ahead of time</li>
            <li>Have pen and paper ready for notes</li>
          </ul>
          
          <a href="${clientUrl}/sessions" class="cta-button">
            View Session Details →
          </a>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            You'll receive a reminder before the session starts.
          </p>
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
