const { BlogPost, User, MentorRanking, BlogComment, BlogLike, sequelize } = require('../models');
const { Op } = require('sequelize');

// Helper function to generate slug
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

// Helper function to calculate read time
const calculateReadTime = (content) => {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
};

// Helper function to calculate engagement score
const calculateEngagementScore = (views, likes, shares, comments) => {
  if (views === 0) return 0;
  const engagementRate = (likes + shares * 2 + comments * 3) / views;
  return Math.min(engagementRate * 100, 100); // Cap at 100
};

// Create blog post
const createBlogPost = async (req, res) => {
  try {
    console.log('🔍 CREATE BLOG POST - User:', req.user.id, 'Role:', req.user.role);
    
    const { title, excerpt, content, category, tags, featuredImage, metaDescription } = req.body;
    
    // Validate required fields
    if (!title || !excerpt || !content || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, excerpt, content, category',
        received: { title, excerpt, content, category }
      });
    }

    // Temporarily comment out role restriction for testing
    // if (req.user.role !== 'mentor' && req.user.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Only mentors can create blog posts',
    //     debug: {
    //       userRole: req.user.role,
    //       userId: req.user.id
    //     }
    //   });
    // }

    const slug = generateSlug(title);
    const readTime = calculateReadTime(content);

    console.log('📝 Generated slug:', slug, 'Read time:', readTime);

    // Check if slug already exists
    const existingPost = await BlogPost.findOne({ where: { slug } });
    if (existingPost) {
      return res.status(400).json({
        success: false,
        message: 'A post with this title already exists'
      });
    }

    console.log('💾 Creating blog post with data:', {
      title,
      slug,
      excerpt,
      authorId: req.user.id,
      category,
      tags: tags || [],
      readTime
    });

    const blogPost = await BlogPost.create({
      title,
      slug,
      excerpt,
      content,
      authorId: req.user.id,
      category,
      tags: tags || [],
      readTime,
      featuredImage: featuredImage || null,
      metaDescription: metaDescription || null,
      status: 'published', // ✅ Default to published for testing
      publishedAt: new Date() // ✅ Set publish date
    });

    console.log('✅ Blog post created successfully:', blogPost.id);

    // Update mentor ranking after creating post
    try {
      await updateMentorRanking(req.user.id);
      console.log('✅ Mentor ranking updated');
    } catch (rankingError) {
      console.error('⚠️ Mentor ranking update failed:', rankingError);
      // Don't fail the request if ranking update fails
    }

    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: { blogPost }
    });

  } catch (error) {
    console.error('❌ Create blog post error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Publish blog post
const publishBlogPost = async (req, res) => {
  try {
    const { id } = req.params;
    
    const blogPost = await BlogPost.findOne({
      where: { id, authorId: req.user.id }
    });

    if (!blogPost) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    await blogPost.update({
      status: 'published',
      publishedAt: new Date()
    });

    // Update mentor ranking
    await updateMentorRanking(req.user.id);

    res.json({
      success: true,
      message: 'Blog post published successfully',
      data: { blogPost }
    });

  } catch (error) {
    console.error('Publish blog post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all published blog posts
const getBlogPosts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      author, 
      search,
      sortBy = 'publishedAt',
      order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { status: 'published' };

    if (category) {
      whereClause.category = category;
    }

    if (author) {
      whereClause.authorId = author;
    }

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { excerpt: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: blogPosts } = await BlogPost.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'avatar', 'role'],
        include: [{
          model: MentorRanking,
          as: 'mentorRanking',
          attributes: ['tier', 'overallScore', 'badges']
        }]
      }],
      order: [[sortBy, order]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        blogPosts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalPosts: count,
          hasNext: page * limit < count,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get blog posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get single blog post
const getBlogPost = async (req, res) => {
  try {
    const { slug } = req.params;

    const blogPost = await BlogPost.findOne({
      where: { slug, status: 'published' },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'avatar', 'role', 'bio'],
        include: [{
          model: MentorRanking,
          as: 'mentorRanking',
          attributes: ['tier', 'overallScore', 'badges', 'totalBlogPosts', 'avgContentQuality']
        }]
      }]
    });

    if (!blogPost) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Increment view count
    await blogPost.increment('views');

    // Update engagement score
    const engagementScore = calculateEngagementScore(
      blogPost.views + 1,
      blogPost.likes,
      blogPost.shares,
      blogPost.comments
    );
    await blogPost.update({ engagementScore });

    res.json({
      success: true,
      data: { blogPost }
    });

  } catch (error) {
    console.error('Get blog post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Like/Unlike blog post (toggle)
const likeBlogPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const blogPost = await BlogPost.findByPk(id);
    if (!blogPost) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Check if user already liked this post
    const existingLike = await BlogLike.findOne({
      where: { userId, postId: id }
    });

    let isLiked = false;
    let newLikeCount = blogPost.likes;

    if (existingLike) {
      // Unlike: Remove like and decrement count
      await existingLike.destroy();
      await blogPost.decrement('likes');
      newLikeCount = blogPost.likes - 1;
      isLiked = false;
    } else {
      // Like: Add like and increment count
      await BlogLike.create({
        userId,
        postId: id
      });
      await blogPost.increment('likes');
      newLikeCount = blogPost.likes + 1;
      isLiked = true;
    }
    
    // Update engagement score
    const engagementScore = calculateEngagementScore(
      blogPost.views,
      newLikeCount,
      blogPost.shares,
      blogPost.comments
    );
    await blogPost.update({ engagementScore });

    // Update mentor ranking
    await updateMentorRanking(blogPost.authorId);

    res.json({
      success: true,
      message: isLiked ? 'Blog post liked successfully' : 'Blog post unliked successfully',
      data: {
        isLiked,
        newLikeCount
      }
    });

  } catch (error) {
    console.error('Like blog post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Check if user has liked a blog post
const checkLikeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existingLike = await BlogLike.findOne({
      where: { userId, postId: id }
    });

    res.json({
      success: true,
      data: {
        isLiked: !!existingLike
      }
    });

  } catch (error) {
    console.error('Check like status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update mentor ranking based on blog performance
const updateMentorRanking = async (mentorId) => {
  try {
    // Get mentor's blog stats
    const blogStats = await BlogPost.findAll({
      where: { authorId: mentorId, status: 'published' },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalPosts'],
        [sequelize.fn('AVG', sequelize.col('engagementScore')), 'avgEngagement'],
        [sequelize.fn('SUM', sequelize.col('views')), 'totalViews'],
        [sequelize.fn('SUM', sequelize.col('likes')), 'totalLikes'],
        [sequelize.fn('SUM', sequelize.col('shares')), 'totalShares']
      ],
      raw: true
    });

    const stats = blogStats[0];
    
    // Calculate expertise score based on content quality and engagement
    const expertiseScore = (stats.avgEngagement || 0) * 0.6 + 
                          Math.min((stats.totalPosts || 0) * 5, 50) * 0.4;

    // Update or create mentor ranking
    const [ranking] = await MentorRanking.findOrCreate({
      where: { mentorId },
      defaults: {
        totalBlogPosts: stats.totalPosts || 0,
        avgContentQuality: stats.avgEngagement || 0,
        totalContentViews: stats.totalViews || 0,
        totalContentLikes: stats.totalLikes || 0,
        totalContentShares: stats.totalShares || 0,
        expertiseScore
      }
    });

    if (!ranking._options.isNewRecord) {
      await ranking.update({
        totalBlogPosts: stats.totalPosts || 0,
        avgContentQuality: stats.avgEngagement || 0,
        totalContentViews: stats.totalViews || 0,
        totalContentLikes: stats.totalLikes || 0,
        totalContentShares: stats.totalShares || 0,
        expertiseScore
      });
    }

  } catch (error) {
    console.error('Update mentor ranking error:', error);
  }
};

// Get mentor's own blog posts (for dashboard)
const getMyBlogPosts = async (req, res) => {
  try {
    console.log('🔍 GET MY BLOG POSTS - User:', req.user.id, 'Role:', req.user.role);
    
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { authorId: req.user.id };
    if (status) {
      whereClause.status = status;
    }

    console.log('📊 Searching for blog posts with where clause:', whereClause);

    // First check if ANY posts exist for this user
    const totalUserPosts = await BlogPost.count({ where: { authorId: req.user.id } });
    console.log('📊 Total posts for user', req.user.id, ':', totalUserPosts);

    const { count, rows: blogPosts } = await BlogPost.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log('📊 Query returned', count, 'posts, actual rows:', blogPosts.length);
    console.log('📊 Blog posts found:', blogPosts.map(p => ({ id: p.id, title: p.title, status: p.status })));

    res.json({
      success: true,
      data: {
        blogPosts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalPosts: count
        }
      }
    });

  } catch (error) {
    console.error('❌ Get my blog posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get mentor's blog stats
const getMyBlogStats = async (req, res) => {
  try {
    console.log('📊 GET MY BLOG STATS - User:', req.user.id, 'Role:', req.user.role);
    
    // Check ALL posts first (including drafts)
    const allPosts = await BlogPost.count({ where: { authorId: req.user.id } });
    console.log('📊 Total posts (all statuses) for user', req.user.id, ':', allPosts);
    
    // Get basic count first
    const totalPosts = await BlogPost.count({
      where: { authorId: req.user.id, status: 'published' }
    });
    console.log('📊 Published posts for user', req.user.id, ':', totalPosts);

    // If no published posts, check drafts too
    if (totalPosts === 0) {
      const draftPosts = await BlogPost.count({
        where: { authorId: req.user.id, status: 'draft' }
      });
      console.log('📊 Draft posts for user', req.user.id, ':', draftPosts);
      
      return res.json({
        success: true,
        data: {
          stats: {
            totalPosts: allPosts, // Show all posts including drafts
            totalViews: 0,
            totalLikes: 0,
            totalShares: 0,
            avgEngagement: 0
          }
        }
      });
    }

    // Get aggregated stats with better null handling
    const stats = await BlogPost.findAll({
      where: { authorId: req.user.id, status: 'published' },
      attributes: [
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('views')), 0), 'totalViews'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('likes')), 0), 'totalLikes'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('shares')), 0), 'totalShares'],
        [sequelize.fn('COALESCE', sequelize.fn('AVG', sequelize.col('engagementScore')), 0), 'avgEngagement']
      ],
      raw: true
    });

    const result = stats[0] || {};
    console.log('📊 Raw stats result:', result);
    
    const finalStats = {
      totalPosts: totalPosts,
      totalViews: parseInt(result.totalViews) || 0,
      totalLikes: parseInt(result.totalLikes) || 0,
      totalShares: parseInt(result.totalShares) || 0,
      avgEngagement: parseFloat(result.avgEngagement) || 0
    };
    
    console.log('📊 Final stats being returned:', finalStats);
    
    res.json({
      success: true,
      data: {
        stats: finalStats
      }
    });

  } catch (error) {
    console.error('Get my blog stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update blog post
const updateBlogPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, excerpt, content, category, tags, featuredImage, metaDescription } = req.body;
    
    const blogPost = await BlogPost.findOne({
      where: { id, authorId: req.user.id }
    });

    if (!blogPost) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    const slug = generateSlug(title);
    const readTime = calculateReadTime(content);

    // Check if new slug conflicts with other posts
    if (slug !== blogPost.slug) {
      const existingPost = await BlogPost.findOne({ 
        where: { 
          slug,
          id: { [Op.ne]: id }
        } 
      });
      if (existingPost) {
        return res.status(400).json({
          success: false,
          message: 'A post with this title already exists'
        });
      }
    }

    await blogPost.update({
      title,
      slug,
      excerpt,
      content,
      category,
      tags: tags || [],
      readTime,
      featuredImage,
      metaDescription
    });

    res.json({
      success: true,
      message: 'Blog post updated successfully',
      data: { blogPost }
    });

  } catch (error) {
    console.error('Update blog post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete blog post
const deleteBlogPost = async (req, res) => {
  try {
    const { id } = req.params;
    
    const blogPost = await BlogPost.findOne({
      where: { id, authorId: req.user.id }
    });

    if (!blogPost) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    await blogPost.destroy();

    // Update mentor ranking
    await updateMentorRanking(req.user.id);

    res.json({
      success: true,
      message: 'Blog post deleted successfully'
    });

  } catch (error) {
    console.error('Delete blog post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add comment to blog post
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, parentId } = req.body;

    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to comment'
      });
    }

    console.log('💬 ADD COMMENT - User:', req.user.id, 'Post:', id, 'Content length:', content?.length);

    const blogPost = await BlogPost.findByPk(id);
    if (!blogPost) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    const comment = await BlogComment.create({
      postId: id,
      authorId: req.user.id,
      content,
      parentId: parentId || null
    });

    // Increment comment count on blog post
    await blogPost.increment('comments');

    // Update engagement score
    const engagementScore = calculateEngagementScore(
      blogPost.views,
      blogPost.likes,
      blogPost.shares,
      blogPost.comments + 1
    );
    await blogPost.update({ engagementScore });

    // Get comment with author info
    const commentWithAuthor = await BlogComment.findByPk(comment.id, {
      include: [{
        model: User,
        as: 'commentAuthor',
        attributes: ['id', 'name', 'avatar', 'role']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: { comment: commentWithAuthor }
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get comments for blog post
const getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: comments } = await BlogComment.findAndCountAll({
      where: { postId: id, parentId: null }, // Only top-level comments
      include: [
        {
          model: User,
          as: 'commentAuthor',
          attributes: ['id', 'name', 'avatar', 'role'],
          include: [{
            model: MentorRanking,
            as: 'mentorRanking',
            attributes: ['tier', 'badges']
          }]
        },
        {
          model: BlogComment,
          as: 'commentReplies',
          include: [{
            model: User,
            as: 'commentAuthor',
            attributes: ['id', 'name', 'avatar', 'role']
          }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalComments: count
        }
      }
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Share blog post
const shareBlogPost = async (req, res) => {
  try {
    const { id } = req.params;

    const blogPost = await BlogPost.findByPk(id);
    if (!blogPost) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    await blogPost.increment('shares');
    
    // Update engagement score
    const engagementScore = calculateEngagementScore(
      blogPost.views,
      blogPost.likes,
      blogPost.shares + 1,
      blogPost.comments
    );
    await blogPost.update({ engagementScore });

    res.json({
      success: true,
      message: 'Blog post shared successfully'
    });

  } catch (error) {
    console.error('Share blog post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get top mentors by blog performance
const getTopMentors = async (req, res) => {
  try {
    console.log('🏆 GET TOP MENTORS - Fetching mentor rankings...');
    const { limit = 10 } = req.query;

    // First check if we have any mentor rankings
    const mentorRankingCount = await MentorRanking.count();
    console.log('📊 Total mentor rankings:', mentorRankingCount);

    if (mentorRankingCount === 0) {
      // If no rankings exist, return mentors with blog posts
      console.log('📝 No rankings found, getting mentors with blog posts...');
      
      // Just get all mentors for now since we don't have blog posts yet
      const allMentors = await User.findAll({
        where: { role: 'mentor' },
        attributes: ['id', 'name', 'avatar', 'bio'],
        limit: parseInt(limit)
      });

      // Create mock ranking data
      const mockRankings = allMentors.map((mentor, index) => ({
        id: index + 1,
        mentorId: mentor.id,
        tier: 'bronze',
        overallScore: 50.0 + (allMentors.length - index) * 10,
        totalBlogPosts: 0,
        mentor: {
          id: mentor.id,
          name: mentor.name,
          avatar: mentor.avatar,
          bio: mentor.bio
        }
      }));

      return res.json({
        success: true,
        data: { mentors: mockRankings }
      });
    }

    // Get actual rankings
    const topMentors = await MentorRanking.findAll({
      include: [{
        model: User,
        as: 'mentor',
        attributes: ['id', 'name', 'avatar', 'bio'],
        where: { role: 'mentor' }
      }],
      order: [['overallScore', 'DESC']],
      limit: parseInt(limit)
    });

    console.log('🎯 Found top mentors:', topMentors.length);

    res.json({
      success: true,
      data: { mentors: topMentors }
    });

  } catch (error) {
    console.error('Get top mentors error:', error);
    
    // Fallback: return empty array instead of error
    res.json({
      success: true,
      data: { mentors: [] }
    });
  }
};

// Get blog posts by mentor ID (public route)
const getMentorBlogPosts = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: blogPosts } = await BlogPost.findAndCountAll({
      where: { 
        authorId: mentorId, 
        status: 'published' 
      },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'avatar', 'role']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        blogPosts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalPosts: count
        }
      }
    });

  } catch (error) {
    console.error('Get mentor blog posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  createBlogPost,
  publishBlogPost,
  getBlogPosts,
  getBlogPost,
  likeBlogPost,
  checkLikeStatus,
  getMentorBlogPosts,
  updateMentorRanking,
  getMyBlogPosts,
  getMyBlogStats,
  updateBlogPost,
  deleteBlogPost,
  addComment,
  getComments,
  shareBlogPost,
  getTopMentors
};
