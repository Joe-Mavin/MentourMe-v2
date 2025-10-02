const express = require("express");
const router = express.Router();
const {
  submitOnboarding,
  getOnboardingData,
  getRecommendations,
  updateOnboardingData
} = require("../controllers/onboardingController");
const { authenticateToken } = require("../middleware/auth");
const { validateOnboarding } = require("../middleware/validation");

// All routes require authentication
router.use(authenticateToken);

router.post("/", validateOnboarding, submitOnboarding);
router.get("/", getOnboardingData);
router.put("/", validateOnboarding, updateOnboardingData);
router.get("/recommendations", getRecommendations);

module.exports = router;

