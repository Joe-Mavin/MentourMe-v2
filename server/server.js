require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

// Import services (no SQL)
const SocketService = require("./services/socketService");
const WebRTCService = require("./services/webrtcService");
const notificationService = require("./services/notificationService");

// Import routes (only Firestore-ready modules)
const authRoutes = require("./routes/authRoutes");
const onboardingRoutes = require("./routes/onboardingRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notifications");
const newsletterRoutes = require('./routes/newsletterRoutes');
const videoCallRoutes = require("./routes/videoCallRoutes");
const webrtcRoutes = require("./routes/webrtcRoutes");
const sessionRoutes = require("./routes/sessionRoutes");

const app = express();
const server = http.createServer(app);

// CRITICAL: Health check endpoints FIRST - before any middleware or database connections
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.get("/healthcheck", (req, res) => {
  res.status(200).send("OK");
});

app.get("/", (req, res) => {
  res.status(200).send("MentourMe API - OK");
});

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket", "polling"]
});

// Initialize services
const socketService = new SocketService(io);
const webrtcService = new WebRTCService(socketService);

// Make socket service available to controllers
app.set('socketService', socketService);

// Initialize notification service with socket service
notificationService.setSocketService(socketService);

// Cleanup inactive calls every 5 minutes
setInterval(() => {
  webrtcService.cleanupInactiveCalls();
}, 5 * 60 * 1000);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

// Rate limiting removed entirely per project requirements

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files middleware
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check endpoints moved to top of file

// Test session endpoint directly in server.js
app.get("/api/test-sessions", (req, res) => {
  console.log('🧪 DIRECT SESSION TEST HIT');
  res.json({ success: true, message: 'Direct session test working' });
});

// Debug middleware to log all requests
app.use((req, res, next) => {
  if (req.url.startsWith('/api/sessions') || req.url.includes('sessions')) {
    console.log('🚨 REQUEST TO SESSIONS:', {
      method: req.method,
      url: req.url,
      path: req.path,
      originalUrl: req.originalUrl
    });
  }
  next();
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/video-calls", videoCallRoutes);
app.use("/api/webrtc", webrtcRoutes);
app.use("/api/sessions", sessionRoutes);

// WebRTC signaling endpoints
app.get("/api/webrtc/calls/active", (req, res) => {
  try {
    const activeCalls = webrtcService.getActiveCalls();
    res.json({
      success: true,
      data: { calls: activeCalls }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get active calls"
    });
  }
});

app.get("/api/webrtc/calls/:callId/stats", (req, res) => {
  try {
    const { callId } = req.params;
    const stats = webrtcService.getCallStats(callId);
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        message: "Call not found"
      });
    }

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get call stats"
    });
  }
});

// Frontend is deployed separately on Cloudflare Pages
// No need to serve static files from backend

// Global error handler
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? error.message : undefined
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Server startup (no SQL required)
const PORT = process.env.PORT || 5000;
function startServer() {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🌐 Client URL: ${process.env.CLIENT_URL || "http://localhost:3000"}`);
    console.log(`📊 Socket.IO enabled for real-time features`);
    console.log(`🎥 WebRTC service initialized for video calls`);
    console.log(`✅ Server is ready to accept connections`);
    if (process.send) process.send('ready');
  });
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🔄 SIGTERM received, shutting down gracefully");
  
  server.close(() => {
    console.log("✅ HTTP server closed");
  });
  
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🔄 SIGINT received, shutting down gracefully");
  
  server.close(() => {
    console.log("✅ HTTP server closed");
  });
  
  process.exit(0);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  // Don't exit immediately in production
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit on unhandled rejection in production
});

// Keep the process alive
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Prevent the process from exiting
setInterval(() => {
  // Keep alive ping every 30 seconds
}, 30000);

startServer();

module.exports = { app, server, io, socketService, webrtcService };