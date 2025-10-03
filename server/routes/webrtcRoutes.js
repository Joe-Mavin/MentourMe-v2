const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");

/**
 * GET /api/webrtc/config
 * Returns WebRTC configuration with STUN/TURN servers
 * Requires authentication to prevent unauthorized access
 */
router.get("/config", authenticateToken, async (req, res) => {
  try {
    // Get Metered credentials from environment variables
    const meteredUsername = process.env.METERED_USERNAME;
    const meteredPassword = process.env.METERED_PASSWORD;
    const meteredDomain = process.env.METERED_DOMAIN;

    // Validate that credentials are available
    if (!meteredUsername || !meteredPassword) {
      console.error("Missing Metered credentials in environment variables");
      return res.status(500).json({
        success: false,
        message: "WebRTC service configuration error"
      });
    }

    // Build ICE servers configuration
    const iceServers = [
      // Public STUN servers (no authentication needed)
      {
        urls: [
          "stun:stun.relay.metered.ca:80",
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302"
        ]
      },
      // Metered TURN servers (authenticated)
      {
        urls: [
          "turn:global.relay.metered.ca:80",
          "turn:global.relay.metered.ca:80?transport=tcp",
          "turns:global.relay.metered.ca:443?transport=tcp"
        ],
        username: meteredUsername,
        credential: meteredPassword
      }
    ];

    // WebRTC configuration
    const webrtcConfig = {
      iceServers,
      iceCandidatePoolSize: 10,
      iceTransportPolicy: "all", // Use both STUN and TURN
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy: "require"
    };

    // Additional configuration for the client
    const config = {
      webrtcConfig,
      meteredDomain: meteredDomain,
      // Security: Don't expose actual credentials to frontend
      hasValidCredentials: true,
      serverTimestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error("WebRTC config error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get WebRTC configuration",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

/**
 * GET /api/webrtc/test
 * Test endpoint to verify WebRTC service availability
 */
router.get("/test", authenticateToken, async (req, res) => {
  try {
    const hasCredentials = !!(process.env.METERED_USERNAME && process.env.METERED_PASSWORD);
    
    res.json({
      success: true,
      data: {
        webrtcAvailable: hasCredentials,
        stunServers: ["stun:stun.relay.metered.ca:80"],
        turnServersConfigured: hasCredentials,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("WebRTC test error:", error);
    res.status(500).json({
      success: false,
      message: "WebRTC test failed"
    });
  }
});

module.exports = router;
