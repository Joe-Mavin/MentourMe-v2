const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BlogLike = sequelize.define('BlogLike', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'blog_posts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'blog_likes',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'postId']
      },
      {
        fields: ['postId']
      },
      {
        fields: ['userId']
      }
    ]
  });

  return BlogLike;
};
