require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

// Import models and services
const { sequelize } = require("./models");
const SocketService = require("./services/socketService");
const WebRTCService = require("./services/webrtcService");
const notificationService = require("./services/notificationService");

// Import routes
const authRoutes = require("./routes/authRoutes");
const onboardingRoutes = require("./routes/onboardingRoutes");
const messageRoutes = require("./routes/messageRoutes");
const taskRoutes = require("./routes/taskRoutes");
const roomRoutes = require("./routes/roomRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const mentorshipRoutes = require("./routes/mentorshipRoutes");
const notificationRoutes = require("./routes/notifications");
const videoCallRoutes = require("./routes/videoCallRoutes");
const webrtcRoutes = require("./routes/webrtcRoutes");
const setupRoutes = require("./routes/setupRoutes");
const newsletterRoutes = require('./routes/newsletterRoutes');
const blogRoutes = require('./routes/blogRoutes');
const sessionRoutes = require('./routes/sessionRoutes');

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
app.use("/api/messages", messageRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/mentorship", mentorshipRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/video-calls", videoCallRoutes);
app.use("/api/webrtc", webrtcRoutes);
app.use("/api/setup", setupRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/blog", blogRoutes);
console.log('🔧 Registering session routes at /api/sessions');
app.use("/api/sessions", sessionRoutes);
console.log('✅ Session routes registered successfully');

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

// Database connection and server startup
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully");

    // Sync database with proper dependency order
    const syncOptions = process.env.NODE_ENV === "development" 
      ? { alter: true } 
      : { force: false };
    
    // Import individual models for ordered sync
    const { 
      User, 
      OnboardingData, 
      Newsletter,
      BlogPost, 
      MentorRanking,
      CommunityRoom, 
      Message, 
      Task, 
      RoomMembership,
      MentorshipRequest,
      MentorshipSession,
      BlogComment,
      BlogLike,
      Notification
    } = require('./models');
    
    // Sync models in dependency order (parent tables first)
    console.log('🔄 Syncing database tables in dependency order...');
    
    // 1. Base tables with no dependencies
    await User.sync(syncOptions);
    console.log('✅ Users table synced');
    
    await Newsletter.sync(syncOptions);
    console.log('✅ Newsletter table synced');
    
    // 2. Tables that depend on User
    await OnboardingData.sync(syncOptions);
    console.log('✅ OnboardingData table synced');
    
    await MentorRanking.sync(syncOptions);
    console.log('✅ MentorRanking table synced');
    
    await BlogPost.sync(syncOptions);
    console.log('✅ BlogPost table synced');
    
    await CommunityRoom.sync(syncOptions);
    console.log('✅ CommunityRoom table synced');
    
    await MentorshipRequest.sync(syncOptions);
    console.log('✅ MentorshipRequest table synced');
    
    // 3. Tables that depend on multiple tables
    await Message.sync(syncOptions);
    console.log('✅ Message table synced');
    
    await Task.sync(syncOptions);
    console.log('✅ Task table synced');
    
    await RoomMembership.sync(syncOptions);
    console.log('✅ RoomMembership table synced');
    
    await MentorshipSession.sync(syncOptions);
    console.log('✅ MentorshipSession table synced');
    
    await BlogComment.sync(syncOptions);
    console.log('✅ BlogComment table synced');
    
    await BlogLike.sync(syncOptions);
    console.log('✅ BlogLike table synced');
    
    await Notification.sync(syncOptions);
    console.log('✅ Notification table synced');
  
    // Manually update the notifications table ENUM if needed
    try {
      await sequelize.query(`
        ALTER TABLE notifications 
        MODIFY COLUMN type ENUM(
          'mentor_approved',
          'mentor_rejected', 
          'task_assigned',
          'task_completed',
          'task_verified',
          'task_rejected',
          'new_message',
          'room_invitation',
          'room_joined',
          'room_member_added',
          'mentorship_assigned',
          'call_incoming',
          'call_accepted',
          'call_rejected',
          'call_ended',
          'call_missed',
          'session_scheduled',
          'session_confirmed',
          'session_cancelled',
          'session_completed',
          'session_reminder',
          'system_announcement',
          'profile_update_required'
        ) NOT NULL
      `);
      console.log('✅ Notifications ENUM column updated successfully');
    } catch (enumError) {
      console.log('⚠️ ENUM update error (may be expected):', enumError.message);
    }
    console.log("✅ Database synchronized successfully - FIXING MESSAGE RESPONSE");

    // Start server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🌐 Client URL: ${process.env.CLIENT_URL || "http://localhost:3000"}`);
      console.log(`📊 Socket.IO enabled for real-time features`);
      console.log(`🎥 WebRTC service initialized for video calls`);
      console.log(`✅ Server is ready to accept connections`);
      
      // Signal that the server is ready
      if (process.send) {
        process.send('ready');
      }
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🔄 SIGTERM received, shutting down gracefully");
  
  server.close(() => {
    console.log("✅ HTTP server closed");
  });
  
  await sequelize.close();
  console.log("✅ Database connection closed");
  
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🔄 SIGINT received, shutting down gracefully");
  
  server.close(() => {
    console.log("✅ HTTP server closed");
  });
  
  await sequelize.close();
  console.log("✅ Database connection closed");
  
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