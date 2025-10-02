import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import RoomList from '../components/community/RoomList';
import RoomChatView from '../components/community/RoomChatView';
import { MessagingProvider } from '../features/messaging/context/MessagingContext';
import CreateRoomModal from '../components/community/CreateRoomModal';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socket';
import { roomsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Community = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeRoom, setActiveRoom] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Monitor socket connection
  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleConnectionError = () => {
      toast.error('Connection lost. Attempting to reconnect...');
    };

    socketService.on('connected', handleConnect);
    socketService.on('disconnected', handleDisconnect);
    socketService.on('connect_error', handleConnectionError);

    // Check initial connection status
    setIsConnected(socketService.getConnectionStatus());

    return () => {
      socketService.off('connected', handleConnect);
      socketService.off('disconnected', handleDisconnect);
      socketService.off('connect_error', handleConnectionError);
    };
  }, []);

  const handleSelectRoom = useCallback((room) => {
    // Prevent unnecessary navigation if already on the same room
    const currentPath = window.location.pathname;
    const targetPath = `/community/room/${room.id}`;
    
    if (currentPath !== targetPath) {
      setActiveRoom({
        type: 'room',
        id: room.id,
        name: room.name,
        room: room
      });
      navigate(targetPath);
    }
  }, [navigate]);

  const handleCreateRoom = () => {
    setShowCreateModal(true);
  };

  const handleRoomCreated = (room) => {
    toast.success(`Room "${room.name}" created successfully!`);
    // Automatically select the newly created room
    handleSelectRoom(room);
    // Trigger a refresh of the room list to show the new room
    window.dispatchEvent(new CustomEvent('roomCreated', { detail: room }));
  };

  const handleStartCall = (callData) => {
    const { type, targetId } = callData;
    
    // Navigate to video call page for room calls
    navigate(`/call/new?type=${type}&target=${targetId}&room=true`);
    
    // Initiate room call through socket
    socketService.initiateCall(null, type, targetId);
  };

  // Community layout wrapper
  const CommunityLayout = () => {
    return (
      <div className="h-full flex">
        {/* Connection status indicator */}
        {!isConnected && (
          <div className="absolute top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 text-sm z-10">
            Connection lost. Trying to reconnect...
          </div>
        )}

        {/* Sidebar - Room List */}
        <div className="w-80 border-r border-gray-200 bg-white flex-shrink-0">
          <RoomList
            activeRoomId={activeRoom?.id}
            onSelectRoom={handleSelectRoom}
            onCreateRoom={handleCreateRoom}
          />
        </div>

        {/* Main chat area */}
        <div className="flex-1 bg-gray-50">
          <Routes>
            <Route 
              path="/" 
              element={
                <CommunityWelcome onCreateRoom={handleCreateRoom} />
              } 
            />
            <Route 
              path="/room/:id" 
              element={
                <RoomChatWrapper 
                  onStartCall={handleStartCall}
                  onSelectRoom={handleSelectRoom}
                />
              } 
            />
          </Routes>
        </div>

        {/* Create Room Modal */}
        <CreateRoomModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onRoomCreated={handleRoomCreated}
        />
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="h-full -m-6"> {/* Remove default padding for full-height layout */}
        <CommunityLayout />
      </div>
    </ErrorBoundary>
  );
};

// Welcome screen when no room is selected
const CommunityWelcome = ({ onCreateRoom }) => {
  const { user, hasRole } = useAuth();
  
  return (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center max-w-2xl px-8">
        <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Welcome to the MentourMe Community Hub! 🌟
        </h3>
        
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          Connect with like-minded individuals, share your journey, and grow together in supportive community rooms designed for mentorship and personal development.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="text-2xl mb-3">🎯</div>
            <h4 className="font-semibold text-gray-900 mb-2">Mentorship Rooms</h4>
            <p className="text-sm text-gray-600">Connect with experienced mentors and fellow mentees to accelerate your growth.</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="text-2xl mb-3">🚀</div>
            <h4 className="font-semibold text-gray-900 mb-2">Goal Achievement</h4>
            <p className="text-sm text-gray-600">Share your goals, track progress, and celebrate milestones with your community.</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="text-2xl mb-3">🤝</div>
            <h4 className="font-semibold text-gray-900 mb-2">Accountability Partners</h4>
            <p className="text-sm text-gray-600">Find accountability partners to stay motivated and committed to your journey.</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="text-2xl mb-3">📚</div>
            <h4 className="font-semibold text-gray-900 mb-2">Skill Development</h4>
            <p className="text-sm text-gray-600">Learn new skills, share knowledge, and grow professionally with peers.</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Select a room from the sidebar to join the conversation, or create your own community space.
          </p>
          
          {hasRole(['admin', 'moderator', 'mentor']) && (
            <button
              onClick={onCreateRoom}
              className="btn btn-primary btn-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              🏠 Create Your Community Room
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Wrapper component for room chat
const RoomChatWrapper = ({ onStartCall, onSelectRoom }) => {
  const { id } = useParams();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadRoom(id);
    }
  }, [id]);

  const loadRoom = async (roomId) => {
    setLoading(true);
    try {
      // Try to get room details from API
      const response = await roomsAPI.getAll({ id: roomId });
      const rooms = response.data?.data?.rooms || [];
      const foundRoom = rooms.find(r => r.id === parseInt(roomId));
      
      if (foundRoom) {
        setRoom(foundRoom);
        onSelectRoom(foundRoom);
      } else {
        // Fallback to basic room info
        const basicRoom = { id: parseInt(roomId), name: `Room ${roomId}`, category: 'mentorship' };
        setRoom(basicRoom);
        onSelectRoom(basicRoom);
      }
    } catch (error) {
      console.log('Could not load room details, using basic info');
      const basicRoom = { id: parseInt(roomId), name: `Room ${roomId}`, category: 'mentorship' };
      setRoom(basicRoom);
      onSelectRoom(basicRoom);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <MessagingProvider>
      <div className="h-full">
        <RoomChatView room={room} />
      </div>
    </MessagingProvider>
  );
};

export default Community;

