const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const OnboardingData = sequelize.define("OnboardingData", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  userId: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    unique: true
  },
  age: { 
    type: DataTypes.INTEGER,
    validate: {
      min: 13,
      max: 120
    }
  },
  goals: { 
    type: DataTypes.JSON,
    defaultValue: []
  },
  struggles: { 
    type: DataTypes.JSON,
    defaultValue: []
  },
  availability: { 
    type: DataTypes.JSON,
    defaultValue: {}
  },
  timeZone: {
    type: DataTypes.STRING,
    defaultValue: "UTC"
  },
  preferredCommunicationStyle: {
    type: DataTypes.ENUM("direct", "supportive", "motivational", "analytical"),
    defaultValue: "supportive"
  },
  experience: {
    type: DataTypes.TEXT
  },
  interests: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  completedAt: {
    type: DataTypes.DATE
  }
}, { 
  timestamps: true,
  tableName: 'onboardingdata'
});

module.exports = OnboardingData;

