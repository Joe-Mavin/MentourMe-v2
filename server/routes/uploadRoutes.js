const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = req.body.type || 'general';
    const typeDir = path.join(uploadsDir, uploadType);
    
    if (!fs.existsSync(typeDir)) {
      fs.mkdirSync(typeDir, { recursive: true });
    }
    
    cb(null, typeDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = {
    image: /jpeg|jpg|png|gif|webp/,
    video: /mp4|webm|ogg|avi/,
    audio: /mp3|wav|ogg|m4a/,
    document: /pdf|doc|docx|txt|rtf/,
    general: /jpeg|jpg|png|gif|webp|mp4|webm|ogg|avi|mp3|wav|m4a|pdf|doc|docx|txt|rtf/
  };

  const uploadType = req.body.type || 'general';
  const allowedPattern = allowedTypes[uploadType] || allowedTypes.general;
  
  const ext = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (allowedPattern.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${ext} not allowed for ${uploadType} uploads`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Single file upload
  }
});

// File upload endpoint
router.post("/", authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const uploadType = req.body.type || 'general';
    const fileUrl = `/uploads/${uploadType}/${req.file.filename}`;

    res.json({
      success: true,
      message: "File uploaded successfully",
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileUrl: fileUrl,
        size: req.file.size,
        type: uploadType,
        mimetype: req.file.mimetype
      }
    });

  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({
      success: false,
      message: "File upload failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Handle multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 10MB."
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: "Too many files. Only one file allowed."
      });
    }
  }
  
  if (error.message.includes('not allowed')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
});

module.exports = router;

