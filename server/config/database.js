const { Sequelize } = require('sequelize');

// Database configuration based on environment
const getDatabaseConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const config = {
    development: {
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mentourme_dev',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mariadb',
      logging: console.log,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    },
    test: {
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mentourme_test',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mariadb',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    },
    production: {
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      dialect: 'mariadb',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        },
        connectTimeout: 60000,
        acquireTimeout: 60000,
        timeout: 60000,
        charset: 'utf8mb4'
      },
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      retry: {
        match: [
          /ETIMEDOUT/,
          /EHOSTUNREACH/,
          /ECONNRESET/,
          /ECONNREFUSED/,
          /ETIMEDOUT/,
          /ESOCKETTIMEDOUT/,
          /EHOSTUNREACH/,
          /EPIPE/,
          /EAI_AGAIN/,
          /SequelizeConnectionError/,
          /SequelizeConnectionRefusedError/,
          /SequelizeHostNotFoundError/,
          /SequelizeHostNotReachableError/,
          /SequelizeInvalidConnectionError/,
          /SequelizeConnectionTimedOutError/
        ],
        max: 3
      }
    }
  };

  return config[env];
};

// Create Sequelize instance
const createSequelizeInstance = () => {
  const config = getDatabaseConfig();
  
  // Use DATABASE_URL if available (Railway format)
  if (process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
    return new Sequelize(process.env.DATABASE_URL, {
      dialect: 'mariadb',
      logging: false,
      dialectOptions: config.dialectOptions,
      pool: config.pool,
      retry: config.retry
    });
  }
  
  // Use individual connection parameters
  return new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
};

module.exports = {
  getDatabaseConfig,
  createSequelizeInstance
};
