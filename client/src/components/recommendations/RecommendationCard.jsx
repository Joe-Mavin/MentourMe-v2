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
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-orange-500/30 p-4 sm:p-6 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 hover:border-orange-500">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center border-2 border-orange-500 flex-shrink-0">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover"
              />
            ) : (
              <UserIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider truncate">{user.name}</h3>
              {user.verified && (
                <CheckBadgeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 flex-shrink-0" title="Elite Commander" />
              )}
            </div>
            
            <p className="text-xs sm:text-sm text-orange-400 capitalize font-bold uppercase tracking-wider">
              {user.role === 'mentor' ? 'ELITE COMMANDER' : user.role}
            </p>
            
            {user.location && (
              <div className="flex items-center space-x-1 mt-1">
                <MapPinIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-400 truncate">{user.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Favorite button */}
        <button
          onClick={handleToggleFavorite}
          className="p-2 rounded-xl hover:bg-gray-800 transition-colors flex-shrink-0 border border-gray-700 hover:border-orange-500/50"
          title={isFavorited ? 'Remove from battle allies' : 'Add to battle allies'}
        >
          {isFavorited ? (
            <HeartSolidIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
          ) : (
            <HeartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          )}
        </button>
      </div>

      {/* Battle Compatibility Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">Battle Synergy</span>
          <span className="px-3 py-1 rounded-xl text-sm font-black bg-gradient-to-r from-orange-600 to-red-600 text-white border border-orange-500 uppercase tracking-wider">
            {compatibilityScore.toFixed(1)}/10
          </span>
        </div>
        
        <div className="w-full bg-gray-800 rounded-full h-3 border border-gray-700">
          <div
            className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-500 shadow-lg shadow-orange-500/25"
            style={{ width: `${(compatibilityScore / 10) * 100}%` }}
          />
        </div>
        
        <p className="text-xs text-gray-400 mt-2 font-medium uppercase tracking-wider">
          {getCompatibilityText(compatibilityScore)}
        </p>
      </div>

      {/* Commander Bio */}
      {user.bio && (
        <p className="text-sm text-gray-300 mb-4 line-clamp-3 font-medium">
          {user.bio}
        </p>
      )}

      {/* Battle Alignment Factors */}
      {matchingFactors && matchingFactors.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">Strategic Alignment:</p>
          <div className="flex flex-wrap gap-2">
            {matchingFactors.slice(0, 3).map((factor, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-orange-600/20 to-red-600/20 text-orange-400 border border-orange-500/30 uppercase tracking-wider"
              >
                {factor}
              </span>
            ))}
            {matchingFactors.length > 3 && (
              <span className="text-xs text-gray-400 font-medium">
                +{matchingFactors.length - 3} more alignments
              </span>
            )}
          </div>
        </div>
      )}

      {/* Battle Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 pt-4 border-t border-orange-500/30">
        <div className="text-center">
          <p className="text-base sm:text-lg font-black text-orange-400">
            {user.menteeCount || 0}
          </p>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
            {currentUser.role === 'user' ? 'Warriors' : 'Active Warriors'}
          </p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1">
            <StarIcon className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
            <p className="text-base sm:text-lg font-black text-orange-400">
              {user.rating ? user.rating.toFixed(1) : 'N/A'}
            </p>
          </div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Battle Rating</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1">
            <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            <p className="text-base sm:text-lg font-black text-orange-400">
              {user.responseTime || 'N/A'}
            </p>
          </div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Response</p>
        </div>
      </div>

      {/* Combat Specializations */}
      {user.specializations && user.specializations.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">Combat Skills:</p>
          <div className="flex flex-wrap gap-2">
            {user.specializations.slice(0, 4).map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-xl text-xs font-black bg-gray-800 text-gray-300 border border-gray-700 uppercase tracking-wider"
              >
                {skill}
              </span>
            ))}
            {user.specializations.length > 4 && (
              <span className="text-xs text-gray-400 font-medium">
                +{user.specializations.length - 4} more skills
              </span>
            )}
          </div>
        </div>
      )}

      {/* AI Battle Analysis */}
      {explanation && (
        <div className="mb-4 p-3 bg-gradient-to-r from-orange-900/30 to-red-900/30 rounded-xl border border-orange-500/30">
          <p className="text-sm text-orange-300 font-medium">
            <strong className="text-orange-400 font-black uppercase tracking-wider">⚡ AI Battle Intel:</strong> {explanation}
          </p>
        </div>
      )}

      {/* Last Battle Activity */}
      {user.lastActive && (
        <p className="text-xs text-gray-400 mb-4 font-medium">
          Last battle activity {formatDistanceToNow(new Date(user.lastActive), { addSuffix: true })}
        </p>
      )}

      {/* Battle Action Buttons - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-3">
        {currentUser.role === 'user' && user.role === 'mentor' && (
          <button
            onClick={handleRequestMentorship}
            disabled={isRequestPending}
            className={clsx(
              'flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-black uppercase tracking-wider text-sm transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/25 border border-orange-500',
              isRequestPending && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isRequestPending ? 'REQUESTING...' : 'REQUEST ALLIANCE'}
          </button>
        )}
        
        <button
          onClick={() => onStartConversation(user.id)}
          className="flex-1 px-4 py-3 bg-gray-800 text-orange-400 rounded-xl font-black uppercase tracking-wider text-sm transition-all duration-200 hover:bg-gray-700 border border-gray-700 hover:border-orange-500/50 flex items-center justify-center space-x-2"
        >
          <ChatBubbleLeftIcon className="w-4 h-4 flex-shrink-0" />
          <span>BATTLE COMMS</span>
        </button>
      </div>

      {/* Alliance Status */}
      {user.connectionStatus && (
        <div className="mt-4 text-center">
          <span className={clsx(
            'inline-flex items-center px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider',
            user.connectionStatus === 'connected' && 'bg-gradient-to-r from-green-600/20 to-green-500/20 text-green-400 border border-green-500/30',
            user.connectionStatus === 'pending' && 'bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 text-yellow-400 border border-yellow-500/30',
            user.connectionStatus === 'none' && 'bg-gradient-to-r from-gray-600/20 to-gray-500/20 text-gray-400 border border-gray-500/30'
          )}>
            {user.connectionStatus === 'connected' && '⚔️ ALLIED'}
            {user.connectionStatus === 'pending' && '⏳ ALLIANCE PENDING'}
            {user.connectionStatus === 'none' && '🛡️ AVAILABLE'}
          </span>
        </div>
      )}
    </div>
  );
};

export default RecommendationCard;

