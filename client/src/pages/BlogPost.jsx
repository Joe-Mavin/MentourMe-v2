import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeftIcon,
  ClockIcon,
  EyeIcon,
  HeartIcon,
  ShareIcon,
  ChatBubbleLeftIcon,
  UserIcon,
  ChatBubbleLeftIcon as ChatBubbleLeftIconOutline
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import api from '../services/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchBlogPost();
    checkLoginStatus();
  }, [slug]);

  const checkLoginStatus = () => {
    const token = localStorage.getItem('auth_token');
    setIsLoggedIn(!!token);
  };

  const fetchBlogPost = async () => {
    try {
      setLoading(true);
      console.log('📖 Fetching blog post:', slug);
      
      const response = await api.get(`/blog/${slug}`);
      console.log('📖 Blog post response:', response.data);
      
      setPost(response.data.data.blogPost);
      
      const token = localStorage.getItem('auth_token');
      if (token) {
        checkUserLikeStatus(response.data.data.blogPost.id);
      }
      
      fetchComments(response.data.data.blogPost.id);
    } catch (error) {
      console.error('❌ Error fetching blog post:', error);
      if (error.response?.status === 404) {
        setError('Blog post not found');
      } else {
        setError('Failed to load blog post');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkUserLikeStatus = async (postId) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await api.get(`/blog/${postId}/like-status`);
      setLiked(response.data.data.isLiked);
    } catch (error) {
      console.error('❌ Error checking like status:', error);
    }
  };

  const fetchComments = async (postId) => {
    try {
      const response = await api.get(`/blog/${postId}/comments`);
      setComments(response.data.data.comments || []);
    } catch (error) {
      console.error('❌ Error fetching comments:', error);
    }
  };

  const handleLike = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      localStorage.setItem('redirect_after_login', window.location.pathname);
      alert('Please login to like posts! 🗡️\n\nJoin the battle to interact with warrior wisdom.');
      navigate('/login');
      return;
    }

    try {
      const response = await api.post(`/blog/${post.id}/like`);
      const { isLiked, newLikeCount } = response.data.data;
      
      setPost(prev => ({
        ...prev,
        likes: newLikeCount
      }));
      setLiked(isLiked);
    } catch (error) {
      console.error('❌ Error liking post:', error);
      if (error.response?.status === 401) {
        alert('Session expired. Please login again.');
        navigate('/login');
      } else {
        alert('Please login to interact with posts.');
      }
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('Please login to comment!');
      navigate('/login');
      return;
    }

    try {
      await api.post(`/blog/${post.id}/comments`, { content: newComment });
      setNewComment('');
      fetchComments(post.id);
      toast.success('Comment added!');
    } catch (error) {
      console.error('❌ Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'elite': return 'bg-purple-600 text-white';
      case 'platinum': return 'bg-gray-300 text-gray-800';
      case 'gold': return 'bg-yellow-500 text-yellow-900';
      case 'silver': return 'bg-gray-400 text-gray-900';
      default: return 'bg-orange-600 text-white';
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">{error}</h1>
          <Link 
            to="/blog" 
            className="text-orange-500 hover:text-orange-400 transition-colors"
          >
            ← Back to Battle Wisdom
          </Link>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-white">Post not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link 
          to="/blog"
          className="inline-flex items-center space-x-2 text-orange-500 hover:text-orange-400 transition-colors mb-8"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Back to Battle Wisdom</span>
        </Link>

        {/* Article */}
        <article className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8 mb-8">
          {/* Category & Read Time */}
          <div className="flex items-center space-x-4 mb-4">
            <span className="px-3 py-1 bg-orange-600 text-white text-sm font-bold rounded-full uppercase">
              {post.category}
            </span>
            <div className="flex items-center space-x-1 text-gray-400">
              <ClockIcon className="w-4 h-4" />
              <span>{post.readTime} min read</span>
            </div>
            <div className="flex items-center space-x-1 text-gray-400">
              <EyeIcon className="w-4 h-4" />
              <span>{post.views} views</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-black text-white mb-6 leading-tight">{post.title}</h1>

          {/* Author Info */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center">
                {post.author.avatar ? (
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-7 h-7 text-white" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">
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
                <div className="text-sm text-gray-400">
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>

            {/* Engagement Actions */}
            <div className="flex items-center space-x-6">
              <button
                onClick={handleLike}
                className={clsx(
                  "flex items-center space-x-2 transition-colors",
                  liked ? "text-red-500" : "text-gray-400 hover:text-red-500"
                )}
              >
                {liked ? (
                  <HeartSolidIcon className="w-6 h-6" />
                ) : (
                  <HeartIcon className="w-6 h-6" />
                )}
                <span className="font-bold">{post.likes}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center space-x-2 text-gray-400 hover:text-blue-500 transition-colors"
              >
                <ShareIcon className="w-6 h-6" />
                <span className="font-bold">{post.shares}</span>
              </button>

              <div className="flex items-center space-x-2 text-gray-400">
                <ChatBubbleLeftIcon className="w-6 h-6" />
                <span className="font-bold">{comments.length}</span>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="mb-8">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Content */}
          <div className="prose prose-invert prose-lg max-w-none">
            <div 
              className="text-gray-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </article>

        {/* Comments Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6">
            Battle Comments ({comments.length})
          </h3>

          {/* Add Comment Form */}
          {isLoggedIn ? (
            <form onSubmit={handleAddComment} className="mb-8">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your battle wisdom..."
                className="w-full p-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-orange-500 focus:outline-none resize-none"
                rows={3}
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="px-6 py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Post Comment
                </button>
              </div>
            </form>
          ) : (
            <div className="mb-8 p-4 bg-gray-700/50 border border-gray-600 rounded-lg text-center">
              <p className="text-gray-300 mb-3">Join the battle to share your wisdom!</p>
              <Link
                to="/login"
                className="inline-block px-6 py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors"
              >
                Login to Comment
              </Link>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                  {comment.author?.avatar ? (
                    <img
                      src={comment.author.avatar}
                      alt={comment.author.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-bold text-white text-sm">
                      {comment.author?.name || 'Anonymous Warrior'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}

            {comments.length === 0 && (
              <div className="text-center py-8">
                <ChatBubbleLeftIconOutline className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No comments yet. Be the first to share your wisdom!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;
