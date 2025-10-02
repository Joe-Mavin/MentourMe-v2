import React, { useState } from 'react';
import { 
  UserIcon, 
  StarIcon, 
  CheckBadgeIcon,
  ChatBubbleLeftIcon,
  HeartIcon,
  ClockIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

const RecommendationCard = ({ 
  recommendation, 
  currentUser, 
  onRequestMentorship, 
  onSaveToFavorites, 
  onStartConversation 
}) => {
  const [isFavorited, setIsFavorited] = useState(recommendation.isFavorited || false);
  const [isRequestPending, setIsRequestPending] = useState(false);

  const { user, compatibilityScore, matchingFactors, explanation } = recommendation;

  const handleRequestMentorship = async () => {
    setIsRequestPending(true);
    try {
      await onRequestMentorship(user.id);
    } finally {
      setIsRequestPending(false);
    }
  };

  const handleToggleFavorite = async () => {
    const newFavoriteStatus = !isFavorited;
    setIsFavorited(newFavoriteStatus);
    onSaveToFavorites?.(user.id, newFavoriteStatus);
  };

  const getCompatibilityColor = (score) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-blue-600 bg-blue-100';
    if (score >= 4) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getCompatibilityText = (score) => {
    if (score >= 8) return 'Excellent Match';
    if (score >= 6) return 'Good Match';
    if (score >= 4) return 'Fair Match';
    return 'Basic Match';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <UserIcon className="w-8 h-8 text-gray-500" />
            )}
          </div>
          
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
              {user.verified && (
                <CheckBadgeIcon className="w-5 h-5 text-blue-500" title="Verified mentor" />
              )}
            </div>
            
            <p className="text-sm text-gray-600 capitalize">{user.role}</p>
            
            {user.location && (
              <div className="flex items-center space-x-1 mt-1">
                <MapPinIcon className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">{user.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Favorite button */}
        <button
          onClick={handleToggleFavorite}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorited ? (
            <HeartSolidIcon className="w-5 h-5 text-red-500" />
          ) : (
            <HeartIcon className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>

      {/* Compatibility Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Compatibility</span>
          <span className={clsx(
            'px-3 py-1 rounded-full text-sm font-medium',
            getCompatibilityColor(compatibilityScore)
          )}>
            {compatibilityScore.toFixed(1)}/10
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(compatibilityScore / 10) * 100}%` }}
          />
        </div>
        
        <p className="text-xs text-gray-600 mt-1">
          {getCompatibilityText(compatibilityScore)}
        </p>
      </div>

      {/* Bio/Description */}
      {user.bio && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {user.bio}
        </p>
      )}

      {/* Matching Factors */}
      {matchingFactors && matchingFactors.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Why you match:</p>
          <div className="flex flex-wrap gap-2">
            {matchingFactors.slice(0, 3).map((factor, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
              >
                {factor}
              </span>
            ))}
            {matchingFactors.length > 3 && (
              <span className="text-xs text-gray-500">
                +{matchingFactors.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">
            {user.menteeCount || 0}
          </p>
          <p className="text-xs text-gray-600">
            {currentUser.role === 'user' ? 'Mentees' : 'Current Mentees'}
          </p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1">
            <StarIcon className="w-4 h-4 text-yellow-500" />
            <p className="text-lg font-semibold text-gray-900">
              {user.rating ? user.rating.toFixed(1) : 'N/A'}
            </p>
          </div>
          <p className="text-xs text-gray-600">Rating</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1">
            <ClockIcon className="w-4 h-4 text-gray-500" />
            <p className="text-lg font-semibold text-gray-900">
              {user.responseTime || 'N/A'}
            </p>
          </div>
          <p className="text-xs text-gray-600">Response Time</p>
        </div>
      </div>

      {/* Specializations/Skills */}
      {user.specializations && user.specializations.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Specializations:</p>
          <div className="flex flex-wrap gap-1">
            {user.specializations.slice(0, 4).map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
              >
                {skill}
              </span>
            ))}
            {user.specializations.length > 4 && (
              <span className="text-xs text-gray-500">
                +{user.specializations.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Explanation */}
      {explanation && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>AI Insight:</strong> {explanation}
          </p>
        </div>
      )}

      {/* Last active */}
      {user.lastActive && (
        <p className="text-xs text-gray-500 mb-4">
          Last active {formatDistanceToNow(new Date(user.lastActive), { addSuffix: true })}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex space-x-3">
        {currentUser.role === 'user' && user.role === 'mentor' && (
          <button
            onClick={handleRequestMentorship}
            disabled={isRequestPending}
            className={clsx(
              'flex-1 btn btn-primary text-sm',
              isRequestPending && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isRequestPending ? 'Requesting...' : 'Request Mentorship'}
          </button>
        )}
        
        <button
          onClick={() => onStartConversation(user.id)}
          className="flex-1 btn btn-outline text-sm"
        >
          <ChatBubbleLeftIcon className="w-4 h-4 mr-1" />
          Message
        </button>
      </div>

      {/* Connection status */}
      {user.connectionStatus && (
        <div className="mt-3 text-center">
          <span className={clsx(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            user.connectionStatus === 'connected' && 'bg-green-100 text-green-800',
            user.connectionStatus === 'pending' && 'bg-yellow-100 text-yellow-800',
            user.connectionStatus === 'none' && 'bg-gray-100 text-gray-800'
          )}>
            {user.connectionStatus === 'connected' && 'Connected'}
            {user.connectionStatus === 'pending' && 'Request Pending'}
            {user.connectionStatus === 'none' && 'Not Connected'}
          </span>
        </div>
      )}
    </div>
  );
};

export default RecommendationCard;

