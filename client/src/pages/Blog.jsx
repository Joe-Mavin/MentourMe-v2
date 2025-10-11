import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FireIcon,
  EyeIcon,
  HeartIcon,
  ShareIcon,
  ClockIcon,
  UserIcon,
  TrophyIcon,
  ShieldCheckIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import api from '../services/api';
import clsx from 'clsx';

const Blog = () => {
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const categories = [
    { id: 'all', name: 'All Posts', icon: FireIcon },
    { id: 'leadership', name: 'Leadership', icon: TrophyIcon },
    { id: 'strategy', name: 'Strategy', icon: ShieldCheckIcon },
    { id: 'career_growth', name: 'Career Growth', icon: BoltIcon },
    { id: 'war_stories', name: 'War Stories', icon: FireIcon },
    { id: 'tactical_guides', name: 'Tactical Guides', icon: UserIcon }
  ];

  const getTierColor = (tier) => {
    const colors = {
      bronze: 'text-orange-600 bg-orange-100',
      silver: 'text-gray-600 bg-gray-100',
      gold: 'text-yellow-600 bg-yellow-100',
      platinum: 'text-purple-600 bg-purple-100',
      elite: 'text-red-600 bg-red-100'
    };
    return colors[tier] || colors.bronze;
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'elite': return '👑';
      case 'platinum': return '💎';
      case 'gold': return '🥇';
      case 'silver': return '🥈';
      default: return '🥉';
    }
  };

  // Handle like functionality
  const handleLike = async (postId) => {
    // Check if user is logged in
    const token = localStorage.getItem('auth_token');
    if (!token) {
      // Store current page for redirect after login
      localStorage.setItem('redirect_after_login', window.location.pathname + window.location.search);
      alert('Please login to like posts! 🗡️\n\nJoin the battle to interact with warrior wisdom.');
      // Redirect to login
      window.location.href = '/login';
      return;
    }

    try {
      const response = await api.post(`/blog/${postId}/like`);
      const { isLiked, newLikeCount } = response.data.data;
      
      // Update the liked posts state
      setLikedPosts(prev => {
        const newLikedPosts = new Set(prev);
        if (isLiked) {
          newLikedPosts.add(postId);
        } else {
          newLikedPosts.delete(postId);
        }
        return newLikedPosts;
      });
      
      // Update the post's like count with the exact count from server
      setBlogPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, likes: newLikeCount }
          : post
      ));
    } catch (error) {
      console.error('Error liking post:', error);
      if (error.response?.status === 401) {
        alert('Session expired. Please login again.');
        window.location.href = '/login';
      } else {
        alert('Please login to interact with posts.');
      }
    }
  };

  // Handle share functionality
  const handleShare = async (postId, postTitle) => {
    // Allow sharing without login, but track shares only for logged-in users
    const token = localStorage.getItem('auth_token');
    
    try {
      // Always allow sharing the link
      if (navigator.share) {
        await navigator.share({
          title: postTitle,
          url: `${window.location.origin}/blog/${postId}`
        });
      } else {
        await navigator.clipboard.writeText(`${window.location.origin}/blog/${postId}`);
        alert('Link copied to clipboard! 🔗');
      }

      // Track share count only if logged in
      if (token) {
        await api.post(`/blog/${postId}/share`);
        
        // Update the post's share count
        setBlogPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? { ...post, shares: post.shares + 1 }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  useEffect(() => {
    fetchBlogPosts();
    // Check if user is logged in
    const token = localStorage.getItem('auth_token');
    setIsLoggedIn(!!token);
  }, [selectedCategory, searchTerm]);

  const fetchBlogPosts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (searchTerm) params.search = searchTerm;
      
      const response = await api.get('/blog', { params });
      console.log('📊 Blog posts response:', response.data);
      
      if (response.data.success) {
        setBlogPosts(response.data.data.blogPosts || []);
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      setBlogPosts([]); // Ensure we set an empty array on error
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black mb-3 sm:mb-4">
              <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                BATTLE-TESTED
              </span>
              <br />
              <span className="text-white">WISDOM</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto font-medium px-4">
              Learn from elite mentors who have conquered their fields.
              <br className="hidden sm:block" />
              <span className="text-orange-500 font-bold">Real strategies. Real results.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Login Prompt for Public Users */}
      {!isLoggedIn && (
        <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border-y border-orange-500/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3 text-center sm:text-left">
                <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <BoltIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm sm:text-base">
                    Join the Elite Warriors! 🗡️
                  </p>
                  <p className="text-gray-300 text-xs sm:text-sm">
                    Login to like, share, and interact with battle-tested wisdom
                  </p>
                </div>
              </div>
              <div className="flex space-x-2 sm:space-x-3">
                <button
                  onClick={() => window.location.href = '/login'}
                  className="px-3 sm:px-4 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition-colors text-sm sm:text-base"
                >
                  Login
                </button>
                <button
                  onClick={() => window.location.href = '/register'}
                  className="px-3 sm:px-4 py-2 border border-orange-500 text-orange-500 rounded-lg font-bold hover:bg-orange-500 hover:text-white transition-colors text-sm sm:text-base"
                >
                  Join Battle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={clsx(
                  'flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 rounded-lg font-bold transition-all duration-200 text-sm sm:text-base',
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white border-2 border-orange-500'
                    : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-orange-500 hover:text-orange-500'
                )}
              >
                <category.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{category.name}</span>
                <span className="sm:hidden">{category.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          <div className="max-w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Search battle-tested wisdom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Blog Posts Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12 sm:py-20">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {blogPosts.map((post) => (
              <article
                key={post.id}
                className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 hover:border-orange-500 transition-all duration-300 overflow-hidden group"
              >
                {/* Featured Image */}
                {post.featuredImage && (
                  <div className="aspect-video bg-gray-800 overflow-hidden">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                <div className="p-6">
                  {/* Category & Read Time */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-orange-600 text-white text-sm font-bold rounded-full uppercase tracking-wider">
                      {post.category.replace('_', ' ')}
                    </span>
                    <div className="flex items-center space-x-1 text-gray-400 text-sm">
                      <ClockIcon className="w-4 h-4" />
                      <span>{post.readTime} min</span>
                    </div>
                  </div>

                  {/* Title */}
                  <Link to={`/blog/${post.slug}`}>
                    <h2 className="text-xl font-black text-white mb-3 group-hover:text-orange-500 transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                  </Link>

                  {/* Excerpt */}
                  <p className="text-gray-300 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>

                  {/* Author Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center">
                        {post.author.avatar ? (
                          <img
                            src={post.author.avatar}
                            alt={post.author.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <UserIcon className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-sm">
                            {post.author.name}
                          </span>
                          {post.author.mentorRanking && (
                            <span className={clsx(
                              'px-2 py-1 text-xs font-bold rounded-full',
                              getTierColor(post.author.mentorRanking.tier)
                            )}>
                              {getTierIcon(post.author.mentorRanking.tier)} {post.author.mentorRanking.tier.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Engagement Stats */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <EyeIcon className="w-4 h-4" />
                        <span>{post.views}</span>
                      </div>
                      <button
                        onClick={() => handleLike(post.id)}
                        className={clsx(
                          "flex items-center space-x-1 transition-colors",
                          likedPosts.has(post.id) 
                            ? "text-red-500" 
                            : "text-gray-400 hover:text-red-500"
                        )}
                      >
                        {likedPosts.has(post.id) ? (
                          <HeartSolidIcon className="w-4 h-4" />
                        ) : (
                          <HeartIcon className="w-4 h-4" />
                        )}
                        <span>{post.likes}</span>
                      </button>
                      <button
                        onClick={() => handleShare(post.id, post.title)}
                        className="flex items-center space-x-1 hover:text-blue-500 transition-colors"
                      >
                        <ShareIcon className="w-4 h-4" />
                        <span>{post.shares}</span>
                      </button>
                    </div>
                    
                    <Link
                      to={`/blog/${post.slug}`}
                      className="text-orange-500 hover:text-orange-400 font-bold text-sm uppercase tracking-wider"
                    >
                      Read More →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {blogPosts.length === 0 && !loading && (
          <div className="text-center py-20">
            <FireIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">No Battle Stories Found</h3>
            <p className="text-gray-500">Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
