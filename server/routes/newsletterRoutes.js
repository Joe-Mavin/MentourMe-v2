const express = require('express');
const router = express.Router();
const { subscribeToNewsletter, unsubscribeFromNewsletter } = require('../controllers/newsletterController');

// Newsletter subscription routes
router.post('/subscribe', subscribeToNewsletter);
router.post('/unsubscribe', unsubscribeFromNewsletter);

module.exports = router;
