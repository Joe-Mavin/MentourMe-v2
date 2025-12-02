const jwt = require("jsonwebtoken");
const userRepo = require("../repositories/userRepository");

const authenticateToken = async (req, res, next) => {
  try {
    console.log('🔐 AUTH MIDDLEWARE: Processing request', {
      url: req.url,
      method: req.method,
      hasAuthHeader: !!req.headers["authorization"]
    });
    
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Access token required" 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userRepo.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid or inactive user" 
      });
    }

    req.user = userRepo.sanitize(user);
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ 
        success: false, 
        message: "Token expired" 
      });
    }
    
    return res.status(403).json({ 
      success: false, 
      message: "Invalid token" 
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: "Insufficient permissions" 
      });
    }

    next();
  };
};

const requireApproval = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: "Authentication required" 
    });
  }

  if (req.user.role === "mentor" && !req.user.approved) {
    return res.status(403).json({ 
      success: false, 
      message: "Mentor approval required" 
    });
  }

  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userRepo.findById(decoded.userId);

      if (user && user.isActive) {
        req.user = userRepo.sanitize(user);
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  requireApproval,
  optionalAuth
};

