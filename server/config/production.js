module.exports = {
  // Database Configuration (Railway MariaDB)
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dialect: 'mariadb',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      connectTimeout: 60000,
      acquireTimeout: 60000,
      timeout: 60000
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: false
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // CORS Configuration
  cors: {
    origin: process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',') : 
      ['https://mentourme.pages.dev'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },

  // Mailgun Configuration
  email: {
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
    from: process.env.MAILGUN_FROM_EMAIL || 'noreply@mentourme.com'
  },

  // WebRTC Configuration (Metered)
  webrtc: {
    iceServers: [
      {
        urls: 'stun:stun.relay.metered.ca:80'
      },
      {
        urls: 'turn:global.relay.metered.ca:80',
        username: process.env.METERED_API_KEY,
        credential: process.env.METERED_SECRET_KEY
      },
      {
        urls: 'turn:global.relay.metered.ca:80?transport=tcp',
        username: process.env.METERED_API_KEY,
        credential: process.env.METERED_SECRET_KEY
      },
      {
        urls: 'turn:global.relay.metered.ca:443',
        username: process.env.METERED_API_KEY,
        credential: process.env.METERED_SECRET_KEY
      },
      {
        urls: 'turns:global.relay.metered.ca:443?transport=tcp',
        username: process.env.METERED_API_KEY,
        credential: process.env.METERED_SECRET_KEY
      }
    ]
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    uploadPath: process.env.UPLOAD_PATH || '/tmp/uploads'
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },

  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // HTTPS only
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }
};
