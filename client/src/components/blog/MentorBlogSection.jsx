import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FireIcon,
  EyeIcon,
  HeartIcon,
  ShareIcon,
  ClockIcon,
  DocumentTextIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const MentorBlogSection = ({ mentorId, mentorName, showTitle = true }) => {
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalViews: 0,
    totalLikes: 0
  });

  useEffect(() => {
    if (mentorId) {
      fetchMentorBlogPosts();
    }
  }, [mentorId]);

  const fetchMentorBlogPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/blog/mentor/${mentorId}`);
      
      if (response.ok) {
        const data = await response.json();
        setBlogPosts(data.data.blogPosts || []);
        
        // Calculate stats
        const posts = data.data.blogPosts || [];
        const totalViews = posts.reduce((sum, post) => sum + post.views, 0);
        const totalLikes = posts.reduce((sum, post) => sum + post.likes, 0);
        
        setStats({
          totalPosts: posts.length,
          totalViews,
          totalLikes
        });
      }
    } catch (error) {
      console.error('Error fetching mentor blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 p-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (blogPosts.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 p-6">
        {showTitle && (
          <h3 className="text-xl font-black text-white mb-4">
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              Battle Wisdom
            </span>
          </h3>
        )}
        <div className="text-center py-8">
          <DocumentTextIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">
            {mentorName} hasn't shared any battle wisdom yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 overflow-hidden">
      {showTitle && (
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-white">
              <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Battle Wisdom
              </span>
            </h3>
            
            <Link
              to="/blog"
              className="text-orange-500 hover:text-orange-400 font-bold text-sm uppercase tracking-wider"
            >
              View All →
            </Link>
          </div>
          
          {/* Stats */}
          <div className="flex items-center space-x-6 mt-4 text-sm">
            <div className="flex items-center space-x-1 text-gray-400">
              <DocumentTextIcon className="w-4 h-4" />
              <span>{stats.totalPosts} posts</span>
            </div>
            <div className="flex items-center space-x-1 text-gray-400">
              <EyeIcon className="w-4 h-4" />
              <span>{stats.totalViews.toLocaleString()} views</span>
            </div>
            <div className="flex items-center space-x-1 text-gray-400">
              <HeartIcon className="w-4 h-4" />
              <span>{stats.totalLikes} likes</span>
            </div>
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-800">
        {blogPosts.slice(0, 3).map((post) => (
          <article
            key={post.id}
            className="p-6 hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Category & Date */}
                <div className="flex items-center space-x-3 mb-3">
                  <span className="px-3 py-1 bg-orange-600 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                    {post.category.replace('_', ' ')}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center space-x-1 text-gray-400 text-sm">
                    <ClockIcon className="w-3 h-3" />
                    <span>{post.readTime} min</span>
                  </div>
                </div>

                {/* Title */}
                <Link to={`/blog/${post.slug}`}>
                  <h4 className="text-lg font-black text-white mb-2 hover:text-orange-500 transition-colors line-clamp-2">
                    {post.title}
                  </h4>
                </Link>

                {/* Excerpt */}
                <p className="text-gray-300 mb-4 line-clamp-2 text-sm">
                  {post.excerpt}
                </p>

                {/* Engagement Stats */}
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <EyeIcon className="w-4 h-4" />
                    <span>{post.views}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <HeartIcon className="w-4 h-4" />
                    <span>{post.likes}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ShareIcon className="w-4 h-4" />
                    <span>{post.shares}</span>
                  </div>
                </div>
              </div>

              {/* Featured Image */}
              {post.featuredImage && (
                <div className="ml-4 flex-shrink-0">
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      {blogPosts.length > 3 && (
        <div className="p-6 border-t border-gray-800 text-center">
          <Link
            to={`/blog?author=${mentorId}`}
            className="inline-flex items-center space-x-2 text-orange-500 hover:text-orange-400 font-bold text-sm uppercase tracking-wider"
          >
            <span>View All {stats.totalPosts} Posts</span>
            <FireIcon className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default MentorBlogSection;
