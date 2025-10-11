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
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-600 to-orange-600 text-white text-center py-3 text-sm font-bold z-10 border-b border-red-500">
            ⚠️ BATTLE NETWORK DISCONNECTED - RECONNECTING...
          </div>
        )}

        {/* Sidebar - Room List */}
        <div className="w-80 border-r border-orange-500/30 bg-gradient-to-b from-gray-900 to-black flex-shrink-0">
          <RoomList
            activeRoomId={activeRoom?.id}
            onSelectRoom={handleSelectRoom}
            onCreateRoom={handleCreateRoom}
          />
        </div>

        {/* Main chat area */}
        <div className="flex-1 bg-black">
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
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,69,0,0.1)_0%,transparent_50%)]"></div>
      
      <div className="text-center max-w-2xl px-8 relative z-10">
        <div className="w-32 h-32 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-orange-500/25 border-4 border-orange-500">
          <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        
        <h3 className="text-4xl font-black text-white mb-6 uppercase tracking-wider">
          WELCOME TO THE
          <span className="block bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            WARRIOR COUNCIL
          </span>
          ⚔️
        </h3>
        
        <p className="text-xl text-gray-300 mb-8 leading-relaxed font-medium">
          Join elite battle rooms where warriors and commanders unite to share strategies, forge alliances, and conquer challenges together in the ultimate mentorship arena.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 border border-orange-500/30 hover:border-orange-500 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 hover:scale-105 group">
            <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">⚔️</div>
            <h4 className="font-black text-white mb-4 uppercase tracking-wider text-lg">Command Rooms</h4>
            <p className="text-sm text-gray-300 font-medium leading-relaxed">Connect with elite commanders and fellow warriors to accelerate your battle prowess and strategic thinking.</p>
            <div className="mt-4 flex items-center text-orange-400 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
              Active Battle Zones
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 border border-orange-500/30 hover:border-orange-500 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 hover:scale-105 group">
            <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">🏆</div>
            <h4 className="font-black text-white mb-4 uppercase tracking-wider text-lg">Victory Pursuit</h4>
            <p className="text-sm text-gray-300 font-medium leading-relaxed">Share your conquest goals, track battle progress, and celebrate victories with your warrior legion.</p>
            <div className="mt-4 flex items-center text-orange-400 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
              Achievement Tracking
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 border border-orange-500/30 hover:border-orange-500 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 hover:scale-105 group">
            <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">🛡️</div>
            <h4 className="font-black text-white mb-4 uppercase tracking-wider text-lg">Battle Allies</h4>
            <p className="text-sm text-gray-300 font-medium leading-relaxed">Find loyal battle partners to stay motivated and committed to your warrior journey and growth.</p>
            <div className="mt-4 flex items-center text-orange-400 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
              Alliance Network
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 border border-orange-500/30 hover:border-orange-500 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 hover:scale-105 group">
            <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">⚡</div>
            <h4 className="font-black text-white mb-4 uppercase tracking-wider text-lg">Skill Mastery</h4>
            <p className="text-sm text-gray-300 font-medium leading-relaxed">Master new combat skills, share battle wisdom, and evolve professionally with elite warrior peers.</p>
            <div className="mt-4 flex items-center text-orange-400 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
              Skill Development
            </div>
          </div>
        </div>
        
        {/* Battle Statistics */}
        <div className="bg-gradient-to-r from-gray-900/50 to-black/50 rounded-2xl p-6 mb-8 border border-orange-500/20">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-black text-orange-400 mb-2">24/7</div>
              <div className="text-sm text-gray-400 font-bold uppercase tracking-wider">Battle Ready</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-green-400 mb-2">∞</div>
              <div className="text-sm text-gray-400 font-bold uppercase tracking-wider">Active Warriors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-blue-400 mb-2">∞</div>
              <div className="text-sm text-gray-400 font-bold uppercase tracking-wider">Victory Missions</div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="text-center">
            <p className="text-lg text-gray-300 font-medium mb-6">
              Select a battle room from the war council sidebar to join the strategic discussions, or forge your own warrior sanctuary.
            </p>
            
            <div className="flex items-center justify-center space-x-2 mb-8">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400 font-bold uppercase tracking-wider">Battle Network Online</span>
            </div>
          </div>
          
          {hasRole(['admin', 'moderator', 'mentor']) && (
            <div className="text-center">
              <button
                onClick={onCreateRoom}
                className="px-12 py-5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl font-black hover:shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 text-xl uppercase tracking-wider border-2 border-orange-500 hover:scale-110 relative overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative z-10">🏰 FORGE YOUR BATTLE ROOM</span>
              </button>
              <p className="text-xs text-gray-500 mt-3 font-medium">Elite commanders can create strategic battle rooms</p>
            </div>
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
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-300 font-bold uppercase tracking-wider">Loading Battle Room...</p>
        </div>
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

