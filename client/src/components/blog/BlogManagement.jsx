import React, { useState, useEffect } from 'react';
import {
  PencilIcon,
  FireIcon,
  EyeIcon,
  HeartIcon,
  ShareIcon,
  TrashIcon,
  PlusIcon,
  DocumentTextIcon,
  ChartBarIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import BlogEditor from './BlogEditor';
import api from '../../services/api';
import clsx from 'clsx';

const BlogManagement = () => {
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    avgEngagement: 0
  });

  useEffect(() => {
    fetchMyBlogPosts();
    fetchBlogStats();
  }, []);

  const fetchMyBlogPosts = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching my blog posts...');
      
      const response = await api.get('/blog/my-posts');
      console.log('📊 My blog posts data:', response.data);
      setBlogPosts(response.data.data?.blogPosts || []);
    } catch (error) {
      console.error('❌ Error fetching my blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlogStats = async () => {
    try {
      console.log('📈 Fetching blog stats...');
      
      const response = await api.get('/blog/my-stats');
      console.log('📈 Blog stats data:', response.data);
      setStats(response.data.data || {
        totalPosts: 0,
        totalViews: 0,
        totalLikes: 0,
        avgEngagement: 0
      });
    } catch (error) {
      console.error('❌ Error fetching blog stats:', error);
    }
  };

  const handleCreatePost = () => {
    console.log('🔥 Creating new battle post...');
    setEditingPost(null);
    setShowEditor(true);
    console.log('🔥 Show editor set to true');
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setShowEditor(true);
  };

  const handleSavePost = async (postData) => {
    try {
      console.log('💾 Saving blog post:', postData);
      
      if (editingPost) {
        await api.put(`/blog/${editingPost.id}`, postData);
        console.log('✅ Blog post updated successfully');
      } else {
        await api.post('/blog', postData);
        console.log('✅ Blog post created successfully');
      }
      
      await fetchMyBlogPosts();
      await fetchBlogStats();
      setShowEditor(false);
      setEditingPost(null);
    } catch (error) {
      console.error('❌ Error saving blog post:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this battle wisdom? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('🗑️ Deleting blog post:', postId);
      
      await api.delete(`/blog/${postId}`);
      console.log('✅ Blog post deleted successfully');
      
      await fetchMyBlogPosts();
      await fetchBlogStats();
    } catch (error) {
      console.error('❌ Error deleting blog post:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-600 text-gray-200',
      published: 'bg-green-600 text-white',
      featured: 'bg-orange-600 text-white',
      archived: 'bg-red-600 text-white'
    };
    return colors[status] || colors.draft;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'published': return '🔥';
      case 'featured': return '👑';
      case 'archived': return '📦';
      default: return '📝';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white mb-2">
            Your <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Battle Wisdom</span>
          </h2>
          <p className="text-gray-400">
            Share your expertise and build your warrior reputation
          </p>
        </div>
        
        <button
          onClick={handleCreatePost}
          className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-orange-500/25 transition-all font-bold"
        >
          <PlusIcon className="w-5 h-5" />
          <span>New Battle</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-2xl border border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
              <DocumentTextIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{stats.totalPosts}</div>
              <div className="text-sm text-gray-400 font-medium">Total Battles</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-2xl border border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <EyeIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{stats.totalViews.toLocaleString()}</div>
              <div className="text-sm text-gray-400 font-medium">Total Views</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-2xl border border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
              <HeartSolidIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{stats.totalLikes}</div>
              <div className="text-sm text-gray-400 font-medium">Total Likes</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-2xl border border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{stats.avgEngagement.toFixed(1)}%</div>
              <div className="text-sm text-gray-400 font-medium">Avg Engagement</div>
            </div>
          </div>
        </div>
      </div>

      {/* Blog Posts List */}
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-lg font-black text-white">Your Battle Chronicles</h3>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : blogPosts.length === 0 ? (
          <div className="text-center py-20">
            <DocumentTextIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">No Battle Wisdom Yet</h3>
            <p className="text-gray-500 mb-6">Start sharing your expertise to build your warrior reputation</p>
            <button
              onClick={handleCreatePost}
              className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-orange-500/25 transition-all font-bold"
            >
              Share Your First Battle
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {blogPosts.map((post) => (
              <div key={post.id} className="p-6 hover:bg-gray-800/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className={clsx(
                        'px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider',
                        getStatusColor(post.status)
                      )}>
                        {getStatusIcon(post.status)} {post.status}
                      </span>
                      <span className="px-3 py-1 bg-orange-600 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                        {post.category.replace('_', ' ')}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-lg font-black text-white mb-2 hover:text-orange-500 transition-colors cursor-pointer">
                      {post.title}
                    </h4>
                    
                    <p className="text-gray-300 mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center space-x-6 text-sm text-gray-400">
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
                      <div className="flex items-center space-x-1">
                        <span>{post.readTime} min read</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-6">
                    <button
                      onClick={() => handleEditPost(post)}
                      className="p-2 text-gray-400 hover:text-orange-500 hover:bg-gray-800 rounded-lg transition-all"
                      title="Edit post"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-gray-800 rounded-lg transition-all"
                      title="View post"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-800 rounded-lg transition-all"
                      title="Delete post"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blog Editor Modal */}
      {showEditor && (
        <BlogEditor
          editingPost={editingPost}
          onSave={handleSavePost}
          onClose={() => {
            setShowEditor(false);
            setEditingPost(null);
          }}
        />
      )}
    </div>
  );
};

export default BlogManagement;
