const { User, OnboardingData } = require("../models");
const { Op } = require("sequelize");

// Get personalized recommendations for a user
const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      limit = 10, 
      minCompatibility = 0,
      location,
      specialization,
      sortBy = 'compatibility',
      availableOnly = false 
    } = req.query;

    // Get current user's onboarding data
    const currentUser = await User.findByPk(userId, {
      include: [{
        model: OnboardingData,
        as: "onboardingData"
      }]
    });

    if (!currentUser?.onboardingData) {
      return res.status(400).json({
        success: false,
        message: "Please complete onboarding to get personalized recommendations"
      });
    }

    // Determine target role based on current user's role
    const targetRole = currentUser.role === 'user' ? 'mentor' : 'user';

    // Build filter conditions
    const whereConditions = {
      role: targetRole,
      approved: true,
      isActive: true,
      id: { [Op.ne]: userId } // Exclude current user
    };

    if (location) {
      whereConditions.location = location;
    }

    if (availableOnly) {
      whereConditions.isAvailable = true;
    }

    // Get potential matches
    const potentialMatches = await User.findAll({
      where: whereConditions,
      include: [{
        model: OnboardingData,
        as: "onboardingData",
        required: true
      }],
      limit: parseInt(limit) * 2 // Get more for better filtering
    });

    // Calculate compatibility scores
    const recommendations = potentialMatches.map(match => {
      const compatibility = calculateCompatibility(currentUser.onboardingData, match.onboardingData);
      const matchingFactors = getMatchingFactors(currentUser.onboardingData, match.onboardingData);
      const explanation = generateExplanation(currentUser.onboardingData, match.onboardingData, compatibility);

      return {
        user: {
          id: match.id,
          name: match.name,
          email: match.email,
          role: match.role,
          avatar: match.avatar,
          bio: match.bio,
          location: match.location,
          specializations: match.specializations || [],
          rating: match.averageRating,
          menteeCount: match.menteeCount || 0,
          responseTime: match.averageResponseTime,
          lastActive: match.lastLogin,
          verified: match.verified || false,
          isAvailable: match.isAvailable || false
        },
        compatibilityScore: compatibility.score,
        matchingFactors: matchingFactors,
        explanation: explanation,
        matchDetails: compatibility.details
      };
    });

    // Filter by minimum compatibility
    const filteredRecommendations = recommendations.filter(
      rec => rec.compatibilityScore >= parseFloat(minCompatibility)
    );

    // Sort recommendations
    const sortedRecommendations = filteredRecommendations.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.user.rating || 0) - (a.user.rating || 0);
        case 'experience':
          return (b.user.menteeCount || 0) - (a.user.menteeCount || 0);
        case 'response_time':
          return (a.user.responseTime || 999) - (b.user.responseTime || 999);
        case 'last_active':
          return new Date(b.user.lastActive || 0) - new Date(a.user.lastActive || 0);
        case 'compatibility':
        default:
          return b.compatibilityScore - a.compatibilityScore;
      }
    });

    // Limit results
    const finalRecommendations = sortedRecommendations.slice(0, parseInt(limit));

    res.json({
      success: true,
      message: "Recommendations retrieved successfully",
      data: {
        recommendations: finalRecommendations,
        total: finalRecommendations.length,
        filters: {
          minCompatibility,
          location,
          specialization,
          sortBy,
          availableOnly
        }
      }
    });

  } catch (error) {
    console.error("Get recommendations error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get recommendations",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Calculate compatibility score between two users based on onboarding data
const calculateCompatibility = (userData, targetData) => {
  let totalScore = 0;
  let maxScore = 0;
  const details = {};

  // Goals compatibility (weight: 30%)
  const goalsWeight = 3;
  const userGoals = Array.isArray(userData.goals) ? userData.goals : [];
  const targetInterests = Array.isArray(targetData.interests) ? targetData.interests : [];
  const goalsScore = calculateArraySimilarity(userGoals, targetInterests);
  totalScore += goalsScore * goalsWeight;
  maxScore += goalsWeight;
  details.goals = { score: goalsScore, weight: goalsWeight };

  // Struggles/expertise match (weight: 25%)
  const strugglesWeight = 2.5;
  const userStruggles = Array.isArray(userData.struggles) ? userData.struggles : [];
  const targetExpertise = Array.isArray(targetData.expertise) ? targetData.expertise : [];
  const strugglesScore = calculateArraySimilarity(userStruggles, targetExpertise);
  totalScore += strugglesScore * strugglesWeight;
  maxScore += strugglesWeight;
  details.struggles = { score: strugglesScore, weight: strugglesWeight };

  // Communication style compatibility (weight: 20%)
  const communicationWeight = 2;
  const userStyle = userData.preferredCommunicationStyle || userData.communicationStyle;
  const targetStyle = targetData.preferredCommunicationStyle || targetData.communicationStyle;
  const communicationScore = (userStyle && targetStyle && userStyle === targetStyle) ? 1 : 0.5;
  totalScore += communicationScore * communicationWeight;
  maxScore += communicationWeight;
  details.communication = { score: communicationScore, weight: communicationWeight };

  // Availability overlap (weight: 15%)
  const availabilityWeight = 1.5;
  const userAvailability = normalizeAvailability(userData.availability);
  const targetAvailability = normalizeAvailability(targetData.availability);
  const availabilityScore = calculateArraySimilarity(userAvailability, targetAvailability);
  totalScore += availabilityScore * availabilityWeight;
  maxScore += availabilityWeight;
  details.availability = { score: availabilityScore, weight: availabilityWeight };

  // Age range compatibility (weight: 10%)
  const ageWeight = 1;
  const ageScore = calculateAgeCompatibility(userData.age, targetData.age);
  totalScore += ageScore * ageWeight;
  maxScore += ageWeight;
  details.age = { score: ageScore, weight: ageWeight };

  // Normalize to 0-10 scale
  const finalScore = (totalScore / maxScore) * 10;

  return {
    score: Math.round(finalScore * 10) / 10, // Round to 1 decimal
    details: details
  };
};

// Normalize availability data to consistent array format
const normalizeAvailability = (availability) => {
  if (!availability) return [];
  
  // If it's already an array, return it
  if (Array.isArray(availability)) {
    return availability.filter(item => item && typeof item === 'string');
  }
  
  // If it's an object (e.g., { monday: true, tuesday: false, ... })
  if (typeof availability === 'object') {
    return Object.keys(availability).filter(day => availability[day] === true || availability[day] === 'true');
  }
  
  // If it's a string, try to parse it
  if (typeof availability === 'string') {
    try {
      const parsed = JSON.parse(availability);
      return normalizeAvailability(parsed); // Recursive call to handle parsed object/array
    } catch (e) {
      // If parsing fails, treat as comma-separated string
      return availability.split(',').map(day => day.trim()).filter(Boolean);
    }
  }
  
  return [];
};

// Calculate similarity between two arrays (e.g., goals, struggles)
const calculateArraySimilarity = (array1, array2) => {
  if (!Array.isArray(array1) || !Array.isArray(array2)) return 0;
  if (!array1.length || !array2.length) return 0;
  
  const intersection = array1.filter(item => 
    array2.some(target => 
      item.toLowerCase().includes(target.toLowerCase()) ||
      target.toLowerCase().includes(item.toLowerCase())
    )
  );
  
  return intersection.length / Math.max(array1.length, array2.length);
};

// Calculate age compatibility
const calculateAgeCompatibility = (age1, age2) => {
  if (!age1 || !age2) return 0.5;
  
  const ageDiff = Math.abs(age1 - age2);
  if (ageDiff <= 5) return 1;
  if (ageDiff <= 10) return 0.8;
  if (ageDiff <= 15) return 0.6;
  if (ageDiff <= 20) return 0.4;
  return 0.2;
};

// Get specific factors that make users compatible
const getMatchingFactors = (userData, targetData) => {
  const factors = [];

  // Check goal alignment
  const userGoals = Array.isArray(userData.goals) ? userData.goals : [];
  const targetInterests = Array.isArray(targetData.interests) ? targetData.interests : [];
  
  if (userGoals.length > 0 && targetInterests.length > 0) {
    const matchingGoals = userGoals.filter(goal =>
      targetInterests.some(interest =>
        goal.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(goal.toLowerCase())
      )
    );
    
    if (matchingGoals.length > 0) {
      factors.push(`Shared interests in ${matchingGoals.slice(0, 2).join(', ')}`);
    }
  }

  // Check struggle/expertise match
  const userStruggles = Array.isArray(userData.struggles) ? userData.struggles : [];
  const targetExpertise = Array.isArray(targetData.expertise) ? targetData.expertise : [];
  
  if (userStruggles.length > 0 && targetExpertise.length > 0) {
    const matchingExpertise = userStruggles.filter(struggle =>
      targetExpertise.some(expertise =>
        struggle.toLowerCase().includes(expertise.toLowerCase()) ||
        expertise.toLowerCase().includes(struggle.toLowerCase())
      )
    );
    
    if (matchingExpertise.length > 0) {
      factors.push(`Expert help available for ${matchingExpertise[0]}`);
    }
  }

  // Check communication style
  const userStyle = userData.preferredCommunicationStyle || userData.communicationStyle;
  const targetStyle = targetData.preferredCommunicationStyle || targetData.communicationStyle;
  
  if (userStyle && targetStyle && userStyle === targetStyle) {
    factors.push(`Compatible communication style (${userStyle})`);
  }

  // Check availability overlap
  const userAvailability = normalizeAvailability(userData.availability);
  const targetAvailability = normalizeAvailability(targetData.availability);
  
  if (userAvailability.length > 0 && targetAvailability.length > 0) {
    const overlappingDays = userAvailability.filter(day =>
      targetAvailability.includes(day)
    );
    
    if (overlappingDays.length > 0) {
      factors.push(`Available on ${overlappingDays.slice(0, 2).join(', ')}`);
    }
  }

  // Check age proximity
  if (userData.age && targetData.age) {
    const ageDiff = Math.abs(userData.age - targetData.age);
    if (ageDiff <= 5) {
      factors.push('Similar age group');
    }
  }

  return factors;
};

// Generate AI-style explanation for the match
const generateExplanation = (userData, targetData, compatibility) => {
  const score = compatibility.score;
  
  if (score >= 8) {
    return "This is an excellent match! You share similar goals and communication styles, making this partnership likely to be highly effective.";
  } else if (score >= 6) {
    return "This is a good match with strong alignment in key areas. You're likely to work well together and achieve meaningful progress.";
  } else if (score >= 4) {
    return "This is a fair match with some shared interests. While there may be differences, you could still have a productive mentoring relationship.";
  } else {
    return "This is a basic match. You may have different approaches, but sometimes diverse perspectives can lead to unexpected growth.";
  }
};

// Get available filters for recommendations
const getFilters = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentUser = await User.findByPk(userId);
    const targetRole = currentUser.role === 'user' ? 'mentor' : 'user';

    // Get unique locations
    const locations = await User.findAll({
      where: { 
        role: targetRole,
        approved: true,
        isActive: true,
        location: { [Op.ne]: null }
      },
      attributes: ['location'],
      group: ['location']
    });

    // Get unique specializations (this would need to be added to User model)
    const specializations = [
      'Personal Development',
      'Career Growth',
      'Health & Wellness',
      'Education',
      'Technology',
      'Business',
      'Creative Arts',
      'Life Coaching',
      'Mental Health',
      'Fitness'
    ];

    res.json({
      success: true,
      data: {
        locations: locations.map(l => l.location).filter(Boolean),
        specializations: specializations
      }
    });

  } catch (error) {
    console.error("Get filters error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get filters"
    });
  }
};

module.exports = {
  getRecommendations,
  getFilters
};

