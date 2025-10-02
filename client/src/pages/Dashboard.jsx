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
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          {hasRole('mentor') 
            ? "Ready to guide and inspire today?" 
            : "Let's continue your growth journey together."
          }
        </p>
      </div>

      {/* Mentor Approval Status */}
      {hasRole('mentor') && !user?.approved && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Mentor Application Under Review
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                Your mentor application is currently being reviewed by our admin team. 
                You'll receive an email notification once approved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200"
            >
              <div>
                <span className={clsx(
                  action.color,
                  'rounded-lg inline-flex p-3 text-white'
                )}>
                  <action.icon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {action.name}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Task Statistics */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Task Progress</h2>
          </div>
          <div className="card-body">
            {taskStats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <ClockIcon className="h-5 w-5 text-blue-600" />
                      <span className="ml-2 text-sm font-medium text-blue-900">
                        In Progress
                      </span>
                    </div>
                    <p className="mt-1 text-2xl font-semibold text-blue-900">
                      {taskStats.in_progress || 0}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      <span className="ml-2 text-sm font-medium text-green-900">
                        Completed
                      </span>
                    </div>
                    <p className="mt-1 text-2xl font-semibold text-green-900">
                      {(taskStats.completed || 0) + (taskStats.verified || 0)}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <Link
                    to="/tasks"
                    className="text-sm font-medium text-primary-600 hover:text-primary-500"
                  >
                    View all tasks →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {hasRole('mentor') 
                    ? 'Start by creating tasks for your mentees'
                    : 'Your mentor will assign tasks to track your progress'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Tasks or Recommendations */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">
              {hasRole('user') && recommendations.length > 0 
                ? 'Recommended Mentors' 
                : 'Recent Tasks'
              }
            </h2>
          </div>
          <div className="card-body">
            {hasRole('user') && recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.map((recommendation) => (
                  <div key={recommendation.user.id} className="p-4 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-medium">
                            {recommendation.user?.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            {recommendation.user?.name}
                          </h3>
                          <div className="flex items-center space-x-1">
                            <SparklesIcon className="w-4 h-4 text-primary-500" />
                            <span className="text-sm font-medium text-primary-600">
                              {recommendation.compatibilityScore?.toFixed(1)}/10
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-600 mb-2">
                          {recommendation.explanation || 'AI-matched mentor for your goals'}
                        </p>
                        
                        {recommendation.matchingFactors && recommendation.matchingFactors.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {recommendation.matchingFactors.slice(0, 2).map((factor, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800"
                              >
                                {factor}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleRequestMentorship(recommendation.user.id, recommendation.compatibilityScore)}
                            className="btn btn-sm btn-primary text-xs"
                          >
                            Request Mentorship
                          </button>
                          <button 
                            onClick={() => handleStartConversation(recommendation.user.id)}
                            className="btn btn-sm btn-outline text-xs"
                          >
                            Message
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t border-gray-200">
                  <Link
                    to="/messages"
                    className="text-sm font-medium text-primary-600 hover:text-primary-500"
                  >
                    Start a conversation →
                  </Link>
                </div>
              </div>
            ) : recentTasks.length > 0 ? (
              <div className="space-y-4">
                {recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {task.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {hasRole('mentor') 
                          ? `Assigned to ${task.mentee?.name}`
                          : `From ${task.mentor?.name}`
                        }
                      </p>
                    </div>
                    <span className={clsx(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      getTaskStatusColor(task.status)
                    )}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
                <div className="pt-4 border-t border-gray-200">
                  <Link
                    to="/tasks"
                    className="text-sm font-medium text-primary-600 hover:text-primary-500"
                  >
                    View all tasks →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {hasRole('user') ? 'No mentors found' : 'No recent tasks'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {hasRole('user') 
                    ? 'Complete your onboarding to get mentor recommendations'
                    : 'Recent task activity will appear here'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Welcome Tips */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-primary-900 mb-3">
          Getting Started Tips
        </h3>
        <div className="space-y-2 text-sm text-primary-800">
          {hasRole('user') ? (
            <>
              <p>• Browse the community rooms to connect with others who share your goals</p>
              <p>• Check your messages for mentor recommendations and conversations</p>
              <p>• Complete assigned tasks to track your progress</p>
              <p>• Update your profile and availability in settings</p>
            </>
          ) : hasRole('mentor') ? (
            <>
              <p>• Review and approve mentee requests in your messages</p>
              <p>• Create tasks to help guide your mentees' progress</p>
              <p>• Join community discussions to share your expertise</p>
              <p>• Keep your availability updated for scheduling sessions</p>
            </>
          ) : (
            <>
              <p>• Review pending mentor applications in the admin panel</p>
              <p>• Monitor community activity and user engagement</p>
              <p>• Manage community rooms and content moderation</p>
              <p>• View platform analytics and user statistics</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

