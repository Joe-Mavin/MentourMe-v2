const emailService = require('../services/emailService');
const newsletterRepo = require('../repositories/newsletterRepository');

const subscribeToNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if email already exists (via repository: SQL or Firestore)
    const existingSubscription = await newsletterRepo.findByEmail(email);
    
    if (existingSubscription) {
      if (existingSubscription.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Email is already subscribed to our newsletter'
        });
      } else {
        // Reactivate subscription
        await newsletterRepo.reactivate(email);
      }
    } else {
      // Create new subscription
      await newsletterRepo.create(email);
    }

    // Send welcome email
    try {
      await emailService.sendNewsletterSignupEmail(email);
    } catch (emailError) {
      console.error('Failed to send newsletter welcome email:', emailError);
      // Don't fail the subscription if email fails
    }

    res.json({
      success: true,
      message: 'Successfully subscribed to newsletter'
    });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const unsubscribeFromNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const subscription = await newsletterRepo.findByEmail(email);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Email not found in our newsletter list'
      });
    }

    await newsletterRepo.deactivate(email);

    res.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    });

  } catch (error) {
    console.error('Newsletter unsubscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  subscribeToNewsletter,
  unsubscribeFromNewsletter
};
