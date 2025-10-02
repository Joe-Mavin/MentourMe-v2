const { Sequelize } = require("sequelize");
require("dotenv").config();

// Use DATABASE_URL if available (Railway format), otherwise individual params
const sequelize = process.env.DATABASE_URL 
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: "mysql",
      logging: process.env.NODE_ENV === "development" ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      dialectOptions: {
        timezone: "Z",
        allowPublicKeyRetrieval: true,
        ssl: process.env.NODE_ENV === "production" ? {
          require: true,
          rejectUnauthorized: false
        } : false,
        connectTimeout: 60000,
        acquireTimeout: 60000,
        timeout: 60000,
      },
      timezone: "+00:00",
    })
  : new Sequelize(
      process.env.DB_NAME || "mentourme",
      process.env.DB_USER || "root",
      process.env.DB_PASSWORD || "root",
      {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3307,
        dialect: "mysql",
        logging: process.env.NODE_ENV === "development" ? console.log : false,
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
        dialectOptions: {
          timezone: "Z",
          allowPublicKeyRetrieval: true,
          ssl: process.env.NODE_ENV === "production" ? {
            require: true,
            rejectUnauthorized: false
          } : false,
          connectTimeout: 60000,
          acquireTimeout: 60000,
          timeout: 60000,
        },
        timezone: "+00:00",
      }
    );

module.exports = sequelize;
