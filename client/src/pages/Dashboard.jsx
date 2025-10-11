import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tasksAPI, onboardingAPI, recommendationsAPI, messagesAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import RecommendationCard from '../components/recommendations/RecommendationCard';
import {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  StarIcon,
  SparklesIcon,
  EyeIcon,
  PlusIcon,
  PencilIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [taskStats, setTaskStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Load task statistics
        const statsResponse = await tasksAPI.getStats();
        setTaskStats(statsResponse.data.data.stats);

        // Load recent tasks
        const tasksResponse = await tasksAPI.getAll({ limit: 5 });
        setRecentTasks(tasksResponse.data.data.tasks);

        // Load recommendations for users
        if (hasRole('user')) {
          try {
            const recResponse = await recommendationsAPI.getRecommendations({ limit: 3 });
            setRecommendations(recResponse.data.data.recommendations || []);
          } catch (error) {
            console.log('No recommendations available');
          }
        }

      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [hasRole]);

  const handleRequestMentorship = async (mentorId, matchScore = null) => {
    try {
      const requestData = {
        mentorId: parseInt(mentorId),
        message: `Hi! I found your profile through the recommendation system and would love to work with you as a mentor. I believe we could have a great mentoring relationship based on our compatibility.`,
        matchScore: matchScore
      };

      const response = await recommendationsAPI.requestMentorship(requestData);
      
      if (response.data.success) {
        toast.success('Mentorship request sent successfully!');
        // Optionally update the UI to show the request was sent
        // Could add a state to track sent requests
      } else {
        toast.error(response.data.message || 'Failed to send mentorship request');
      }
    } catch (error) {
      console.error('Failed to request mentorship:', error);
      
      // Handle specific error types
      if (error.response?.status === 400) {
        toast.error(error.response.data?.message || 'Invalid request. Please check your input.');
      } else if (error.response?.status === 404) {
        toast.error('Mentor not found or no longer available.');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to send mentorship requests.');
      } else if (error.response?.status === 429) {
        toast.error('Too many requests. Please wait before sending another request.');
      } else {
        toast.error('Failed to send mentorship request. Please try again later.');
      }
    }
  };

  const handleSaveToFavorites = async (userId, favorited) => {
    try {
      await recommendationsAPI.saveToFavorites(userId, favorited);
      toast.success(favorited ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      console.error('Failed to update favorites:', error);
      toast.error('Failed to update favorites');
    }
  };

  const handleStartConversation = useCallback((userId) => {
    // Navigate directly to the direct message conversation
    // The MessagingLayout will handle creating the conversation if it doesn't exist
    navigate(`/messages/direct/${userId}`);
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  const quickActions = [
    {
      name: 'Messages',
      href: '/messages',
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-blue-500',
      description: 'Chat with mentors and peers'
    },
    {
      name: 'Community',
      href: '/community',
      icon: UserGroupIcon,
      color: 'bg-green-500',
      description: 'Join discussions and support groups'
    },
    {
      name: 'Tasks',
      href: '/tasks',
      icon: CheckCircleIcon,
      color: 'bg-purple-500',
      description: 'Track your progress and goals'
    },
    // Temporarily showing blog management for all users for testing
    {
      name: 'Battle Wisdom',
      href: '/blog-management',
      icon: PencilIcon,
      color: 'bg-orange-500',
      description: 'Share your expertise through blog posts'
    },
  ];

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'verified':
        return 'text-green-600 bg-green-100';
      case 'in_progress':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            WELCOME BACK,
            <span className="block bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              {user?.name?.toUpperCase()}! ⚔️
            </span>
          </h1>
          <p className="mt-3 text-lg text-gray-300 font-medium">
          {hasRole('mentor') 
            ? "Ready to guide and inspire today?" 
            : "Let's continue your growth journey together."
          }
          </p>
        </div>

        {/* Mentor Approval Status */}
        {hasRole('mentor') && !user?.approved && (
          <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-orange-500/30 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-bold text-orange-500 uppercase tracking-wider">
                  Commander Application Under Review
                </h3>
                <p className="mt-1 text-sm text-gray-300 font-medium">
                  Your commander application is being reviewed by the elite council. 
                  You'll receive notification once you've earned your rank.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-wider">
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              BATTLE
            </span> ARSENAL
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                to={action.href}
                className="relative group bg-gradient-to-br from-gray-900 to-black p-6 rounded-xl border border-gray-800 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300"
              >
                <div>
                  <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-xl inline-flex p-3 text-white border-2 border-orange-500 group-hover:scale-110 transition-transform duration-200">
                    <action.icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">
                    {action.name}
                  </h3>
                  <p className="mt-2 text-sm text-gray-300 font-medium">
                    {action.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Task Statistics */}
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 p-6 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-black text-white uppercase tracking-wider">
                <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                  BATTLE
                </span> PROGRESS
              </h2>
            </div>
            <div>
              {taskStats ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-xl p-4 border border-orange-500/30">
                      <div className="flex items-center">
                        <ClockIcon className="h-6 w-6 text-orange-500" />
                        <span className="ml-2 text-sm font-bold text-orange-400 uppercase tracking-wider">
                          In Progress
                        </span>
                      </div>
                      <p className="mt-2 text-3xl font-black text-white">
                        {taskStats.in_progress || 0}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-xl p-4 border border-green-500/30">
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-6 w-6 text-green-500" />
                        <span className="ml-2 text-sm font-bold text-green-400 uppercase tracking-wider">
                          Completed
                        </span>
                      </div>
                      <p className="mt-2 text-3xl font-black text-white">
                        {(taskStats.completed || 0) + (taskStats.verified || 0)}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-orange-500/30">
                    <Link
                      to="/tasks"
                      className="text-sm font-bold text-orange-500 hover:text-orange-400 transition-colors uppercase tracking-wider"
                    >
                      VIEW ALL MISSIONS →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircleIcon className="mx-auto h-16 w-16 text-gray-600" />
                  <h3 className="mt-4 text-lg font-black text-white uppercase tracking-wider">No Missions Yet</h3>
                  <p className="mt-2 text-sm text-gray-300 font-medium">
                    {hasRole('mentor') 
                      ? 'Start by creating missions for your warriors'
                      : 'Your commander will assign missions to track your progress'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Tasks or Recommendations */}
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 p-6 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-xl font-black text-white uppercase tracking-wider">
                {hasRole('user') && recommendations.length > 0 
                  ? <><span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">ELITE</span> COMMANDERS</>
                  : <><span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">RECENT</span> MISSIONS</>
                }
              </h2>
            </div>
            <div>
              {hasRole('user') && recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.map((recommendation) => (
                    <div key={recommendation.user.id} className="p-4 rounded-xl bg-gradient-to-r from-orange-900/20 to-red-900/20 border border-orange-500/30 hover:border-orange-500 transition-all duration-200">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center border-2 border-orange-500">
                            <span className="text-white font-black text-lg">
                              {recommendation.user?.name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-black text-white uppercase tracking-wider">
                              {recommendation.user?.name}
                            </h3>
                            <div className="flex items-center space-x-1">
                              <SparklesIcon className="w-5 h-5 text-orange-500" />
                              <span className="text-lg font-black text-orange-400">
                                {recommendation.compatibilityScore?.toFixed(1)}/10
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-300 mb-3 font-medium">
                            {recommendation.explanation || 'AI-matched commander for your battle journey'}
                          </p>
                          
                          {recommendation.matchingFactors && recommendation.matchingFactors.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {recommendation.matchingFactors.slice(0, 2).map((factor, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-600 text-white border border-orange-500"
                                >
                                  {factor}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex space-x-3">
                            <button 
                              onClick={() => handleRequestMentorship(recommendation.user.id, recommendation.compatibilityScore)}
                              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-orange-500/25 transition-all text-sm uppercase tracking-wider"
                            >
                              Request Command
                            </button>
                            <button 
                              onClick={() => handleStartConversation(recommendation.user.id)}
                              className="px-4 py-2 border border-orange-500 text-orange-400 rounded-lg font-bold hover:bg-orange-500 hover:text-white transition-all text-sm uppercase tracking-wider"
                            >
                              Message
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-orange-500/30">
                    <Link
                      to="/messages"
                      className="text-sm font-bold text-orange-500 hover:text-orange-400 transition-colors uppercase tracking-wider"
                    >
                      START BATTLE COMMUNICATION →
                    </Link>
                  </div>
                </div>
              ) : recentTasks.length > 0 ? (
                <div className="space-y-4">
                  {recentTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700 hover:border-orange-500/50 transition-all duration-200">
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-black text-white truncate uppercase tracking-wider">
                          {task.title}
                        </p>
                        <p className="text-sm text-gray-300 font-medium">
                          {hasRole('mentor') 
                            ? `Assigned to Warrior ${task.mentee?.name}`
                            : `From Commander ${task.mentor?.name}`
                          }
                        </p>
                      </div>
                      <span className={clsx(
                        'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
                        task.status === 'completed' || task.status === 'verified'
                          ? 'bg-green-600 text-white border border-green-500'
                          : task.status === 'in_progress'
                          ? 'bg-orange-600 text-white border border-orange-500'
                          : task.status === 'pending'
                          ? 'bg-yellow-600 text-white border border-yellow-500'
                          : 'bg-red-600 text-white border border-red-500'
                      )}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-orange-500/30">
                    <Link
                      to="/tasks"
                      className="text-sm font-bold text-orange-500 hover:text-orange-400 transition-colors uppercase tracking-wider"
                    >
                      VIEW ALL MISSIONS →
                    </Link>
                </div>
              </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircleIcon className="mx-auto h-16 w-16 text-gray-600" />
                  <h3 className="mt-4 text-lg font-black text-white uppercase tracking-wider">
                    {hasRole('user') ? 'No Commanders Found' : 'No Recent Missions'}
                  </h3>
                  <p className="mt-2 text-sm text-gray-300 font-medium">
                    {hasRole('user') 
                      ? 'Complete your warrior training to get elite commander recommendations'
                      : 'Recent mission activity will appear here'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Battle Strategy Tips */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 p-6 shadow-2xl">
          <h3 className="text-xl font-black text-white mb-6 uppercase tracking-wider">
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              BATTLE
            </span> STRATEGY GUIDE
          </h3>
          <div className="space-y-4 text-sm text-gray-300">
            {hasRole('user') ? (
              <>
                <div className="flex items-start space-x-3">
                  <span className="text-orange-500 font-black">⚔️</span>
                  <p className="font-medium">Browse the warrior community to connect with others who share your battle goals</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-orange-500 font-black">📨</span>
                  <p className="font-medium">Check your messages for elite commander recommendations and strategic conversations</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-orange-500 font-black">🎯</span>
                  <p className="font-medium">Complete assigned missions to track your warrior progress and earn battle experience</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-orange-500 font-black">⚙️</span>
                  <p className="font-medium">Update your warrior profile and availability in the command center settings</p>
                </div>
              </>
            ) : hasRole('mentor') ? (
              <>
                <div className="flex items-start space-x-3">
                  <span className="text-orange-500 font-black">👥</span>
                  <p className="font-medium">Review and approve warrior requests in your command messages</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-orange-500 font-black">📋</span>
                  <p className="font-medium">Create strategic missions to guide your warriors' battle progress</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-orange-500 font-black">🗣️</span>
                  <p className="font-medium">Join community war councils to share your elite expertise</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-orange-500 font-black">📅</span>
                  <p className="font-medium">Keep your command availability updated for scheduling strategic sessions</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start space-x-3">
                  <span className="text-orange-500 font-black">👑</span>
                  <p className="font-medium">Review pending commander applications in the elite council panel</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-orange-500 font-black">📊</span>
                  <p className="font-medium">Monitor warrior community activity and battle engagement metrics</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-orange-500 font-black">🛡️</span>
                  <p className="font-medium">Manage community war rooms and content moderation protocols</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-orange-500 font-black">📈</span>
                  <p className="font-medium">View platform analytics and warrior performance statistics</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

