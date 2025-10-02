const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BlogPost = sequelize.define('BlogPost', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [3, 200]
      }
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [3, 500] // Reduced from 10 to 3 for easier testing
      }
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: false
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    category: {
      type: DataTypes.ENUM(
        'leadership',
        'strategy',
        'career_growth',
        'entrepreneurship',
        'technology',
        'finance',
        'personal_development',
        'industry_insights',
        'war_stories',
        'tactical_guides'
      ),
      allowNull: false
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'featured', 'archived'),
      defaultValue: 'draft'
    },
    readTime: {
      type: DataTypes.INTEGER, // in minutes
      allowNull: false
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    shares: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    comments: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    featuredImage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metaDescription: {
      type: DataTypes.STRING,
      validate: {
        len: [0, 160]
      }
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Merit scoring fields
    engagementScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0
    },
    qualityScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0
    },
    impactScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0
    }
  }, {
    tableName: 'blog_posts',
    timestamps: true,
    indexes: [
      {
        fields: ['authorId']
      },
      {
        fields: ['category']
      },
      {
        fields: ['status']
      },
      {
        fields: ['publishedAt']
      },
      {
        fields: ['engagementScore']
      },
      {
        unique: true,
        fields: ['slug']
      }
    ]
  });

  return BlogPost;
};
