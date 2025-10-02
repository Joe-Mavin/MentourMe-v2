const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Newsletter = sequelize.define('Newsletter', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    subscribedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    unsubscribedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'newsletters',
    timestamps: true
  });

  return Newsletter;
};
