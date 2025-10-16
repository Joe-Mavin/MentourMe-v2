import React, { useState, useEffect, useCallback } from 'react';
import { roomsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import CommunityStats from './CommunityStats';
// Removed sampleRooms dependency for production - using API data
import toast from 'react-hot-toast';
import {
  PlusIcon,
  UserGroupIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

const CATEGORIES = [
  { value: 'all', label: 'All Categories', color: 'gray', icon: '🏠', description: 'Browse all community rooms' },
  { value: 'mentorship', label: 'Mentorship', color: 'blue', icon: '🎯', description: 'Connect with mentors and mentees' },
  { value: 'goals', label: 'Goal Achievement', color: 'purple', icon: '🚀', description: 'Share and track your goals' },
  { value: 'accountability', label: 'Accountability', color: 'orange', icon: '🤝', description: 'Stay accountable with peers' },
  { value: 'support', label: 'Support & Help', color: 'green', icon: '💚', description: 'Get help and support others' },
  { value: 'skills', label: 'Skill Development', color: 'indigo', icon: '📚', description: 'Learn and share skills' },
  { value: 'networking', label: 'Networking', color: 'pink', icon: '🌐', description: 'Build professional connections' },
  { value: 'wellness', label: 'Wellness & Growth', color: 'teal', icon: '🌱', description: 'Personal development and wellness' }
];

// Category color mapping for safe Tailwind classes
const getCategoryClasses = (color, isSelected) => {
  const colorMap = {
    gray: isSelected ? 'bg-gray-100 text-gray-800 border border-gray-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
    blue: isSelected ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
    purple: isSelected ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
    orange: isSelected ? 'bg-orange-100 text-orange-800 border border-orange-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
    green: isSelected ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
    indigo: isSelected ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
    pink: isSelected ? 'bg-pink-100 text-pink-800 border border-pink-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
    teal: isSelected ? 'bg-teal-100 text-teal-800 border border-teal-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
  };
  return colorMap[color] || colorMap.gray;
};

const getCategoryBadgeClasses = (color) => {
  const colorMap = {
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800',
    green: 'bg-green-100 text-green-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    pink: 'bg-pink-100 text-pink-800',
    teal: 'bg-teal-100 text-teal-800'
  };
  return colorMap[color] || colorMap.gray;
};

const RoomList = ({ onSelectRoom, activeRoomId, onCreateRoom }) => {
  const { user, hasRole } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [joinedRooms, setJoinedRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showOnlyJoined, setShowOnlyJoined] = useState(false);
  const [loading, setLoading] = useState(false);

  // Helper function to check if room is from sample data
  const isSampleRoom = (roomId) => {
    return SAMPLE_ROOMS.some(room => room.id === roomId);
  };

  // Load rooms function - use real API with fallback to sample data
  const loadRooms = useCallback(async (params = {}) => {
    setLoading(true);
    
    try {
      // Try to load from API first
      const response = await roomsAPI.getAll(params);
      const roomsData = response.data?.data?.rooms || response.data?.rooms || [];
      setRooms(roomsData);
      console.log('✅ Loaded rooms from API:', roomsData.length);
    } catch (apiError) {
      console.log('⚠️ API not available, using sample data:', apiError.message);
      // Fallback to sample data if API fails
      let sampleData = [...SAMPLE_ROOMS];
      
      // Apply category filter
      if (params.category && params.category !== 'all') {
        sampleData = getRoomsByCategory(params.category);
      }
      
      // Apply search filter
      if (params.search) {
        sampleData = searchRooms(params.search);
      }
      
      setRooms(sampleData);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load joined rooms function - use real API with fallback
  const loadJoinedRooms = useCallback(async () => {
    try {
      const response = await roomsAPI.getJoined();
      const joinedData = response.data?.data?.rooms || response.data?.rooms || [];
      setJoinedRooms(joinedData.map(room => ({ id: room.roomId || room.id })));
      console.log('✅ Loaded joined rooms from API:', joinedData.length);
    } catch (error) {
      console.log('⚠️ Joined rooms API not available, using mock data');
      // For demo purposes, simulate some joined rooms
      const mockJoinedRooms = [
        { id: 1 }, // New Mentor Orientation
        { id: 3 }, // Daily Accountability Check-ins
        { id: 9 }  // 30-Day Goal Challenge
      ];
      setJoinedRooms(mockJoinedRooms);
    }
  }, []);

  // Load rooms on mount and when filters change
  useEffect(() => {
    const params = {};
    if (selectedCategory !== 'all') {
      params.category = selectedCategory;
    }
    if (searchTerm) {
      params.search = searchTerm;
    }
    
    loadRooms(params);
  }, [selectedCategory, searchTerm, loadRooms]);

  // Load joined rooms on mount
  useEffect(() => {
    loadJoinedRooms();
  }, [loadJoinedRooms]);

  // Listen for room creation events to refresh the list
  useEffect(() => {
    const handleRoomCreated = (event) => {
      console.log('Room created, refreshing list:', event.detail);
      // Refresh both rooms and joined rooms
      loadRooms({ category: selectedCategory !== 'all' ? selectedCategory : undefined, search: searchTerm || undefined });
      loadJoinedRooms();
    };

    window.addEventListener('roomCreated', handleRoomCreated);
    return () => window.removeEventListener('roomCreated', handleRoomCreated);
  }, [loadRooms, loadJoinedRooms, selectedCategory, searchTerm]);

  const handleJoinRoom = async (roomId) => {
    console.log(`🏠 CLIENT: handleJoinRoom called for room ${roomId}`);
    console.log(`🏠 CLIENT: isSampleRoom(${roomId}) = ${isSampleRoom(roomId)}`);
    
    // Check if this is a sample room first
    if (isSampleRoom(roomId)) {
      console.log(`🏠 CLIENT: Taking SAMPLE ROOM path for room ${roomId}`);
      // Handle sample room joining locally
      const isAlreadyJoined = joinedRooms.some(jr => jr.id === roomId);
      if (isAlreadyJoined) {
        toast.error('Already a member of this room');
        return;
      }
      
      const newJoinedRoom = { id: roomId };
      setJoinedRooms(prev => [...prev, newJoinedRoom]);
      toast.success('Joined sample room!');
      return;
    }
    
    console.log(`🏠 CLIENT: Taking REAL API path for room ${roomId}`);

    // Check if already in local joined rooms
    const isAlreadyJoined = joinedRooms.some(jr => jr.id === roomId);
    if (isAlreadyJoined) {
      toast.info('You are already a member of this room');
      return;
    }

    // Handle real database rooms with clean API call
    try {
      console.log(`🏠 CLIENT: Attempting to join room ${roomId}`);
      const response = await roomsAPI.join(roomId);
      console.log(`✅ CLIENT: Successfully joined room ${roomId}:`, response);
      toast.success('Successfully joined room!');
      
      // Add to local state
      const newJoinedRoom = { id: roomId };
      setJoinedRooms(prev => [...prev, newJoinedRoom]);
      
      // Refresh data
      await loadJoinedRooms();
      await loadRooms({ category: selectedCategory !== 'all' ? selectedCategory : undefined, search: searchTerm || undefined });
      
      // Trigger a global refresh event for other components
      window.dispatchEvent(new CustomEvent('roomMembershipChanged', { 
        detail: { roomId, action: 'joined' } 
      }));
    } catch (error) {
      console.error('❌ CLIENT: Failed to join room:', error);
      
      if (error.response?.status === 400) {
        toast.info('You are already a member of this room');
        // Add to local state anyway
        const newJoinedRoom = { id: roomId };
        setJoinedRooms(prev => {
          const exists = prev.some(jr => jr.id === roomId);
          return exists ? prev : [...prev, newJoinedRoom];
        });
      } else {
        toast.error('Failed to join room');
      }
    }
  };

  const handleLeaveRoom = async (roomId) => {
    // Check if this is a sample room first
    if (isSampleRoom(roomId)) {
      // Handle sample room leaving locally
      const isMember = joinedRooms.some(jr => jr.id === roomId);
      if (!isMember) {
        toast.error('You are not a member of this room');
        return;
      }
      
      setJoinedRooms(prev => prev.filter(room => room.id !== roomId));
      toast.success('Left sample room!');
      return;
    }

    // Check if not in local joined rooms
    const isMember = joinedRooms.some(jr => jr.id === roomId);
    if (!isMember) {
      toast.error('You are not a member of this room');
      return;
    }

    // Handle real database rooms
    try {
      await roomsAPI.leave(roomId);
      toast.success('Left room successfully');
      
      // Remove from local state
      setJoinedRooms(prev => prev.filter(room => room.id !== roomId));
      
      // Refresh data
      loadJoinedRooms();
      loadRooms({ category: selectedCategory !== 'all' ? selectedCategory : undefined, search: searchTerm || undefined });
    } catch (error) {
      console.error('Failed to leave room:', error);
      
      if (error.response?.status === 404) {
        toast.success('Left room successfully');
        // Remove from local state anyway
        setJoinedRooms(prev => prev.filter(room => room.id !== roomId));
      } else {
        toast.error('Failed to leave room');
      }
    }
  };

  // Filter rooms based on current settings
  const filteredRooms = rooms.filter(room => {
    if (showOnlyJoined) {
      return joinedRooms.some(jr => jr.id === room.id);
    }
    return true;
  });

  const isRoomJoined = (roomId) => {
    return joinedRooms.some(jr => jr.id === roomId);
  };

  if (loading && rooms.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-300 font-bold uppercase tracking-wider">Loading Battle Rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-900 to-black">
      {/* Header */}
      <div className="p-6 border-b border-orange-500/30">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">
              <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                WAR COUNCIL
              </span> ROOMS
            </h2>
            <p className="text-sm text-gray-300 mt-2 font-medium">Unite, strategize, and conquer challenges together</p>
          </div>
          
          {hasRole(['admin', 'mentor']) && (
            <button
              onClick={onCreateRoom}
              className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-200 font-black uppercase tracking-wider border border-orange-500"
              title="Forge a new battle room"
            >
              <PlusIcon className="w-5 h-5" />
              <span>FORGE ROOM</span>
            </button>
          )}
          
          {!hasRole(['admin', 'mentor']) && (
            <div className="text-xs text-gray-400 text-center px-4 py-2 bg-gray-800 rounded-xl border border-gray-700 font-medium">
              ⚔️ Become a commander to forge rooms
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-500" />
          <input
            type="text"
            placeholder="Search battle rooms, objectives, skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
          />
        </div>

        {/* Battle Zone Filters */}
        <div className="space-y-4">
          {/* Category Pills */}
          <div>
            <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Browse Battle Zones</label>
            <div className="flex flex-wrap gap-3 mb-4">
              {CATEGORIES.slice(0, 4).map(category => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={clsx(
                    'flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 uppercase tracking-wider',
                    getCategoryClasses(category.color, selectedCategory === category.value)
                  )}
                >
                  <span className="text-base">{category.icon}</span>
                  <span>{category.label}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              {CATEGORIES.slice(4).map(category => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={clsx(
                    'flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 uppercase tracking-wider',
                    getCategoryClasses(category.color, selectedCategory === category.value)
                  )}
                >
                  <span className="text-base">{category.icon}</span>
                  <span>{category.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Battle Filters */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showOnlyJoined"
                checked={showOnlyJoined}
                onChange={(e) => setShowOnlyJoined(e.target.checked)}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 bg-gray-800 border-gray-600 rounded"
              />
              <label htmlFor="showOnlyJoined" className="ml-3 text-sm text-gray-300 font-medium">
                My Battle Rooms Only
              </label>
            </div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              {filteredRooms.length} ROOM{filteredRooms.length !== 1 ? 'S' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Community Stats */}
      <CommunityStats />

      {/* Battle Rooms List */}
      <div className="flex-1 overflow-y-auto bg-black">
        {filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-12">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center mb-6 border-4 border-orange-500">
              <UserGroupIcon className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-black text-white mb-4 uppercase tracking-wider">
              {searchTerm || selectedCategory !== 'all' ? 'No Battle Rooms Found' : 'No Battle Rooms Available'}
            </h3>
            <p className="text-gray-300 text-center font-medium mb-6">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search or battle zone filters' 
                : 'Be the first to forge a new battle room'}
            </p>
            {(searchTerm || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setShowOnlyJoined(false);
                }}
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-200 font-black uppercase tracking-wider border border-orange-500"
              >
                Clear Battle Filters
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Featured Battle Rooms Section */}
            {selectedCategory === 'all' && !searchTerm && !showOnlyJoined && (
              <div className="mb-6">
                <div className="px-6 py-4 bg-gradient-to-r from-orange-900/50 to-red-900/50 border-b border-orange-500/30">
                  <div className="flex items-center space-x-3 mb-2">
                    <StarIcon className="w-5 h-5 text-yellow-400 fill-current" />
                    <h4 className="text-lg font-black text-white uppercase tracking-wider">Elite Battle Rooms</h4>
                  </div>
                  <p className="text-sm text-gray-300 font-medium">Legendary spaces for warrior development</p>
                </div>
                <div className="divide-y divide-gray-800">
                  {getFeaturedRooms().slice(0, 3).map((room) => (
                    <RoomItem
                      key={`featured-${room.id}`}
                      room={room}
                      isActive={activeRoomId === room.id}
                      isJoined={isRoomJoined(room.id)}
                      onSelect={() => onSelectRoom(room)}
                      onJoin={() => handleJoinRoom(room.id)}
                      onLeave={() => handleLeaveRoom(room.id)}
                      featured={true}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* All Battle Rooms Section */}
            <div>
              {selectedCategory === 'all' && !searchTerm && !showOnlyJoined && (
                <div className="px-6 py-3 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700">
                  <h4 className="text-lg font-black text-white uppercase tracking-wider">All Battle Rooms</h4>
                </div>
              )}
              <div className="divide-y divide-gray-800">
                {filteredRooms.map((room) => (
                  <RoomItem
                    key={room.id}
                    room={room}
                    isActive={activeRoomId === room.id}
                    isJoined={isRoomJoined(room.id)}
                    isCreator={room.createdBy === user?.id}
                    onSelect={() => onSelectRoom(room)}
                    onJoin={() => handleJoinRoom(room.id)}
                    onLeave={() => handleLeaveRoom(room.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const RoomItem = ({ room, isActive, isJoined, isCreator, onSelect, onJoin, onLeave }) => {
  const getCategoryInfo = (category) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[0];
  };

  const categoryInfo = getCategoryInfo(room.category);

  return (
    <div
      className={clsx(
        'p-4 hover:bg-gray-800/50 cursor-pointer transition-all duration-200 border-l-4 bg-black',
        isActive 
          ? 'bg-gradient-to-r from-orange-900/30 to-red-900/30 border-l-orange-500 shadow-lg shadow-orange-500/10' 
          : 'border-l-transparent hover:border-l-orange-500/50'
      )}
      onClick={onSelect}
    >
      {/* Header Row - Icon, Name, and Action Button */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center border border-orange-500 flex-shrink-0">
            <span className="text-sm">{categoryInfo.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white truncate">
              {room.name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              {room.featured && (
                <StarIcon className="w-3 h-3 text-yellow-400 fill-current" />
              )}
              {room.isPrivate && (
                <LockClosedIcon className="w-3 h-3 text-gray-400" />
              )}
            </div>
          </div>
        </div>
        
        {/* Action Button - Right Side */}
        <div className="flex-shrink-0 ml-4">
          {isCreator ? (
            <span className="px-3 py-1 text-xs font-bold text-blue-400 bg-blue-900/50 border border-blue-700 rounded-lg">
              OWNER
            </span>
          ) : isJoined ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLeave();
              }}
              className="px-3 py-1 text-xs font-bold text-red-400 bg-red-900/50 border border-red-700 rounded-lg hover:bg-red-800/50 transition-colors"
            >
              LEAVE
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onJoin();
              }}
              className="px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-red-600 border border-orange-500 rounded-lg hover:shadow-md hover:shadow-orange-500/25 transition-all"
            >
              JOIN
            </button>
          )}
        </div>
      </div>

      {/* Category and Stats Row */}
      <div className="flex items-center justify-between mb-2">
        <span className={clsx(
          'inline-flex items-center space-x-1 px-2 py-1 text-xs font-bold rounded-md',
          getCategoryBadgeClasses(categoryInfo.color)
        )}>
          <span className="text-xs">{categoryInfo.icon}</span>
          <span>{categoryInfo.label}</span>
        </span>
        
        <div className="flex items-center space-x-1 text-xs text-gray-400">
          <UserGroupIcon className="w-3 h-3 text-orange-500" />
          <span>{room.memberCount || 0}/{room.maxMembers || '∞'}</span>
        </div>
      </div>
      
      {/* Description */}
      {room.description && (
        <p className="text-xs text-gray-300 line-clamp-2 mb-2 leading-relaxed">
          {room.description}
        </p>
      )}
      
      {/* Footer Row */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-1">
          <ClockIcon className="w-3 h-3 text-orange-500" />
          <span>
            {room.lastActivity ? 
              `${formatDistanceToNow(new Date(room.lastActivity))} ago` : 
              'No activity'
            }
          </span>
        </div>
        {room.createdBy && (
          <span>by {room.createdBy}</span>
        )}
      </div>
    </div>
  );
};

export default RoomList;
