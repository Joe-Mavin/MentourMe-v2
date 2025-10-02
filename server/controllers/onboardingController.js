const { OnboardingData, User } = require("../models");

const submitOnboarding = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      age,
      goals,
      struggles,
      availability,
      timeZone,
      preferredCommunicationStyle,
      experience,
      interests
    } = req.body;

    // Check if onboarding data already exists
    let onboardingData = await OnboardingData.findOne({
      where: { userId }
    });

    if (onboardingData) {
      // Update existing onboarding data
      await onboardingData.update({
        age,
        goals,
        struggles,
        availability,
        timeZone,
        preferredCommunicationStyle,
        experience,
        interests,
        completedAt: new Date()
      });
    } else {
      // Create new onboarding data
      onboardingData = await OnboardingData.create({
        userId,
        age,
        goals,
        struggles,
        availability,
        timeZone,
        preferredCommunicationStyle,
        experience,
        interests,
        completedAt: new Date()
      });
    }

    res.json({
      success: true,
      message: "Onboarding data saved successfully",
      data: { onboardingData }
    });
  } catch (error) {
    console.error("Onboarding submission error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getOnboardingData = async (req, res) => {
  try {
    const userId = req.user.id;

    const onboardingData = await OnboardingData.findOne({
      where: { userId },
      include: [{
        model: User,
        as: "user",
        attributes: ["id", "name", "email", "role"]
      }]
    });

    if (!onboardingData) {
      return res.status(404).json({
        success: false,
        message: "Onboarding data not found"
      });
    }

    res.json({
      success: true,
      data: { onboardingData }
    });
  } catch (error) {
    console.error("Get onboarding data error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's onboarding data
    const userOnboarding = await OnboardingData.findOne({
      where: { userId },
      include: [{
        model: User,
        as: "user",
        attributes: ["id", "name", "role"]
      }]
    });

    if (!userOnboarding) {
      return res.status(404).json({
        success: false,
        message: "Please complete onboarding first"
      });
    }

    // Find potential matches based on goals and struggles
    const userGoals = userOnboarding.goals || [];
    const userStruggles = userOnboarding.struggles || [];

    let targetRole;
    if (req.user.role === "user") {
      targetRole = "mentor";
    } else if (req.user.role === "mentor") {
      targetRole = "user";
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid user role for recommendations"
      });
    }

    // Find users with matching goals/struggles
    const recommendations = await OnboardingData.findAll({
      include: [{
        model: User,
        as: "user",
        where: {
          role: targetRole,
          approved: true,
          isActive: true,
          id: { [require("sequelize").Op.ne]: userId }
        },
        attributes: ["id", "name", "email", "role", "avatar"]
      }],
      where: {
        completedAt: { [require("sequelize").Op.ne]: null }
      }
    });

    // Calculate compatibility scores
    const scoredRecommendations = recommendations.map(rec => {
      const recGoals = rec.goals || [];
      const recStruggles = rec.struggles || [];
      
      let score = 0;
      
      // Goals compatibility
      const goalMatches = userGoals.filter(goal => 
        recGoals.some(recGoal => 
          recGoal.toLowerCase().includes(goal.toLowerCase()) ||
          goal.toLowerCase().includes(recGoal.toLowerCase())
        )
      ).length;
      
      // Struggles compatibility
      const struggleMatches = userStruggles.filter(struggle =>
        recStruggles.some(recStruggle =>
          recStruggle.toLowerCase().includes(struggle.toLowerCase()) ||
          struggle.toLowerCase().includes(recStruggle.toLowerCase())
        )
      ).length;
      
      // Age compatibility (within 10 years)
      const ageDiff = Math.abs((userOnboarding.age || 25) - (rec.age || 25));
      const ageScore = Math.max(0, 10 - ageDiff) / 10;
      
      // Communication style compatibility
      const commStyleMatch = userOnboarding.preferredCommunicationStyle === rec.preferredCommunicationStyle ? 1 : 0;
      
      score = (goalMatches * 3) + (struggleMatches * 2) + (ageScore * 1) + (commStyleMatch * 1);
      
      return {
        ...rec.toJSON(),
        compatibilityScore: score,
        matchingGoals: goalMatches,
        matchingStruggles: struggleMatches
      };
    });

    // Sort by compatibility score
    scoredRecommendations.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    res.json({
      success: true,
      data: {
        recommendations: scoredRecommendations.slice(0, 10), // Return top 10
        userProfile: userOnboarding
      }
    });
  } catch (error) {
    console.error("Get recommendations error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateOnboardingData = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    const onboardingData = await OnboardingData.findOne({
      where: { userId }
    });

    if (!onboardingData) {
      return res.status(404).json({
        success: false,
        message: "Onboarding data not found"
      });
    }

    await onboardingData.update(updateData);

    res.json({
      success: true,
      message: "Onboarding data updated successfully",
      data: { onboardingData }
    });
  } catch (error) {
    console.error("Update onboarding data error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  submitOnboarding,
  getOnboardingData,
  getRecommendations,
  updateOnboardingData
};

