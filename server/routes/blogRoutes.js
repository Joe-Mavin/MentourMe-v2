const express = require('express');
const router = express.Router();
const {
  createBlogPost,
  publishBlogPost,
  getBlogPosts,
  getBlogPost,
  likeBlogPost,
  checkLikeStatus,
  getMentorBlogPosts,
  getMyBlogPosts,
  getMyBlogStats,
  updateBlogPost,
  deleteBlogPost,
  addComment,
  getComments,
  shareBlogPost,
  getTopMentors
} = require('../controllers/blogController');

// Import auth middleware
const { authenticateToken, authorizeRoles, optionalAuth } = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/', getBlogPosts);
router.get('/mentor/:mentorId', getMentorBlogPosts);
router.get('/top-mentors', getTopMentors);

// Routes that need authentication but not specific roles
router.post('/:id/like', authenticateToken, likeBlogPost);
router.get('/:id/like-status', authenticateToken, checkLikeStatus);
router.post('/:id/share', authenticateToken, shareBlogPost);
router.post('/:id/comments', authenticateToken, addComment);
router.get('/:id/comments', getComments); // Public - anyone can read comments

// Protected routes (authentication required) - MUST come before /:slug
router.get('/my-posts', authenticateToken, getMyBlogPosts);
router.get('/my-stats', authenticateToken, getMyBlogStats);

// Create and manage blog posts (mentors only)
router.post('/', authenticateToken, authorizeRoles('mentor', 'admin'), createBlogPost);
router.put('/:id', authenticateToken, authorizeRoles('mentor', 'admin'), updateBlogPost);
router.delete('/:id', authenticateToken, authorizeRoles('mentor', 'admin'), deleteBlogPost);
router.patch('/:id/publish', authenticateToken, authorizeRoles('mentor', 'admin'), publishBlogPost);

// Debug endpoint to check mentors (public for testing)
router.get('/debug/mentors', async (req, res) => {
  try {
    const { User } = require('../models');
    const mentors = await User.findAll({
      where: { role: 'mentor' },
      attributes: ['id', 'name', 'email', 'role']
    });
    
    const allUsers = await User.findAll({
      attributes: ['id', 'name', 'email', 'role']
    });
    
    res.json({
      success: true,
      data: {
        mentors: mentors,
        totalMentors: mentors.length,
        allUsers: allUsers,
        totalUsers: allUsers.length
      }
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// ✅ TEMP: Publish all draft posts for testing
router.get('/publish-all-drafts', async (req, res) => {
  try {
    const { BlogPost } = require('../models');
    
    const result = await BlogPost.update(
      { 
        status: 'published',
        publishedAt: new Date()
      },
      { 
        where: { status: 'draft' }
      }
    );
    
    console.log('📝 Published', result[0], 'draft posts');
    
    res.json({
      success: true,
      message: `Published ${result[0]} draft posts`,
      publishedCount: result[0]
    });
  } catch (error) {
    console.error('Error publishing drafts:', error);
    res.status(500).json({ success: false, message: 'Error publishing drafts' });
  }
});

// ✅ Catch-all slug route MUST be last to avoid conflicts
router.get('/:slug', optionalAuth, getBlogPost);

module.exports = router;
