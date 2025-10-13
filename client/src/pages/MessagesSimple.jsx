import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { messagesAPI, usersAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { 
  ChatBubbleLeftRightIcon, 
  UserIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const MessagesSimple = () => {
  const { user } = useAuth();
  const { id } = useParams(); // Get user ID from URL params
  const location = useLocation();
  const navigate = useNavigate();
  
  // Parse the route to get user ID for direct messages (memoized to prevent re-renders)
  const getUserIdFromPath = useCallback(() => {
    const path = location.pathname;
    
    // Check if it's a direct message route: /messages/direct/123
    const directMatch = path.match(/\/messages\/direct\/(\d+)/);
    if (directMatch) {
      const userId = parseInt(directMatch[1]);
      return userId;
    }
    
    return null;
  }, [location.pathname]);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Load conversations or handle direct message route
  useEffect(() => {
    const userIdFromPath = getUserIdFromPath();
    console.log('🔄 Route changed - Path user ID:', userIdFromPath);
    
    if (userIdFromPath) {
      // Only start conversation if it's different from current one
      const currentUserId = activeConversation?.otherUserId;
      if (currentUserId !== userIdFromPath) {
        console.log('🚀 Starting direct conversation with user ID:', userIdFromPath);
        startDirectConversation(userIdFromPath);
      }
    } else {
      // Regular messages page - load conversations
      console.log('📋 Loading conversations list');
      loadConversations();
    }
  }, [getUserIdFromPath]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      console.log('📞 Loading conversations...');
      
      const response = await messagesAPI.getConversations();
      console.log('✅ Conversations loaded:', response.data);
      
      const conversations = response.data.data?.conversations || [];
      console.log('📋 Setting conversations:', conversations.length, 'conversations');
      console.log('📋 Conversation details:', conversations.map(c => ({
        id: c.id,
        partner: c.partner?.name,
        partnerId: c.partner?.id,
        otherUserId: c.otherUserId,
        lastMessage: c.lastMessage?.content?.substring(0, 20)
      })));
      setConversations(conversations);
    } catch (error) {
      console.error('❌ Failed to load conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId, otherUserId) => {
    try {
      console.log('📞 Loading messages for:', { conversationId, otherUserId });
      
      let response;
      if (otherUserId) {
        response = await messagesAPI.getDirectMessages(otherUserId);
      } else {
        // For now, we'll handle direct messages only
        return;
      }
      
      console.log('✅ Messages loaded:', response.data);
      const loadedMessages = response.data.data?.messages || [];
      console.log('📝 Setting messages:', loadedMessages.length, 'messages');
      console.log('📋 Message details:', loadedMessages.map(m => ({
        id: m.id,
        content: m.content?.substring(0, 30),
        senderId: m.senderId,
        receiverId: m.receiverId,
        createdAt: m.createdAt
      })));
      setMessages(loadedMessages);
    } catch (error) {
      console.error('❌ Failed to load messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || sending) return;

    try {
      setSending(true);
      console.log('📞 Sending message:', newMessage);

      const messageData = {
        content: newMessage.trim(),
        type: 'text',
        receiverId: activeConversation.otherUserId
      };

      const response = await messagesAPI.send(messageData);
      console.log('✅ Message sent:', response.data);

      // Add message to local state
      const newMsg = response.data.data.message;
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      
      toast.success('Message sent!');
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const startDirectConversation = async (userId) => {
    try {
      setLoading(true);
      console.log('🚀 Starting direct conversation with user:', userId);
      
      // Create a temporary conversation object
      const conversation = {
        id: `direct_${user.id}_${userId}`,
        type: 'direct',
        name: `User ${userId}`, // We'll update this when we get user details
        otherUserId: userId,
        avatar: null
      };
      
      setActiveConversation(conversation);
      console.log('✅ Active conversation set:', conversation);
      
      // Load messages for this user
      await loadMessages(null, userId);
      
      // Try to get user details to update the conversation name
      try {
        console.log('🔍 Fetching user profile for ID:', userId);
        const userResponse = await usersAPI.getProfile(userId);
        console.log('📋 User profile response:', userResponse.data);
        
        const otherUser = userResponse.data.data?.user;
        
        if (otherUser) {
          // Update conversation with real user details
          const updatedConversation = {
            ...conversation,
            name: otherUser.name,
            avatar: otherUser.avatar
          };
          setActiveConversation(updatedConversation);
          console.log('✅ Updated conversation with user details:', otherUser.name);
        } else {
          console.log('⚠️ No user data in response');
        }
      } catch (error) {
        console.log('⚠️ Could not fetch user details:', error.response?.status, error.response?.data?.message || error.message);
      }
      
    } catch (error) {
      console.error('❌ Failed to start direct conversation:', error);
      toast.error('Failed to start conversation');
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = (conversation) => {
    console.log('🎯 Selecting conversation:', conversation);
    
    // Extract the other user ID from the conversation
    const otherUserId = conversation.otherUserId || conversation.partner?.id;
    
    if (otherUserId) {
      const conversationData = {
        id: conversation.id || `direct_${user.id}_${otherUserId}`,
        type: 'direct',
        name: conversation.partner?.name || conversation.name || `User ${otherUserId}`,
        otherUserId: otherUserId,
        avatar: conversation.partner?.avatar || conversation.avatar
      };
      
      setActiveConversation(conversationData);
      loadMessages(conversation.id, otherUserId);
    } else {
      console.error('❌ No otherUserId found in conversation:', conversation);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearching(true);
      console.log('🔍 Searching users:', query);
      
      const response = await usersAPI.search({ q: query, limit: 10 });
      console.log('✅ Search results:', response.data);
      
      const results = response.data.data?.users || [];
      // Filter out current user
      const filteredResults = results.filter(u => u.id !== user.id);
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('❌ Search failed:', error);
      // Fallback to empty results on error
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const startNewConversation = (selectedUser) => {
    navigate(`/messages/direct/${selectedUser.id}`);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Debug messages rendering
  useEffect(() => {
    console.log('🎨 MESSAGES STATE CHANGED:', {
      messagesCount: messages.length,
      messages: messages.map(m => ({ id: m.id, content: m.content?.substring(0, 20) + '...', senderId: m.senderId }))
    });
  }, [messages]);

  // Only log render state when something meaningful changes
  useEffect(() => {
    const userIdFromPath = getUserIdFromPath();
    console.log('🎯 RENDER STATE:', { 
      loading, 
      activeConversation: activeConversation?.name, 
      messagesCount: messages.length,
      userIdFromPath,
      pathname: location.pathname
    });
  }, [loading, activeConversation?.name, messages.length, getUserIdFromPath, location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-300 font-bold uppercase tracking-wider">Loading Battle Communications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-gradient-to-br from-gray-900 via-black to-gray-900 -m-6">
      {/* Sidebar - Battle Communications */}
      <div className="w-80 border-r border-orange-500/30 bg-gradient-to-b from-gray-900 to-black flex-shrink-0">
        <div className="p-4 sm:p-6 border-b border-orange-500/30">
          <h2 className="text-lg sm:text-xl font-black text-white flex items-center mb-4 uppercase tracking-wider">
            <ChatBubbleLeftRightIcon className="w-5 h-5 mr-3 text-orange-500" />
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">BATTLE</span> COMMS
          </h2>
          
          {/* Search for Warriors */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-500" />
            <input
              type="text"
              placeholder="Search warriors to message..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchUsers(e.target.value);
              }}
              className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-medium"
            />
            
            {/* Battle Search Results */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-gray-800 border border-orange-500/30 rounded-xl shadow-2xl z-10 mt-2 max-h-48 overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => startNewConversation(user)}
                    className="w-full p-3 text-left hover:bg-gray-700 flex items-center space-x-3 border-b border-gray-700 last:border-b-0 transition-all duration-200"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center border-2 border-orange-500">
                      <UserIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-black text-white text-sm uppercase tracking-wider">{user.name}</p>
                      <p className="text-xs text-orange-400 capitalize font-bold">
                        {user.role === 'mentor' ? 'ELITE COMMANDER' : user.role}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="overflow-y-auto h-full">
          {conversations.length === 0 && !getUserIdFromPath() ? (
            <div className="p-6 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-orange-500">
                <ChatBubbleLeftRightIcon className="w-10 h-10 text-white" />
              </div>
              <p className="text-gray-300 font-bold mb-2 uppercase tracking-wider">No Battle Communications</p>
              <p className="text-sm text-gray-400 font-medium">Search for warriors above or use "Battle Comms" buttons from your dashboard!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {conversations.map((conversation, index) => (
                <button
                  key={conversation.id || `conversation-${index}`}
                  onClick={() => selectConversation(conversation)}
                  className={clsx(
                    'w-full p-4 text-left hover:bg-gray-800 transition-all duration-200',
                    activeConversation?.id === conversation.id && 'bg-gradient-to-r from-orange-900/30 to-red-900/30 border-r-4 border-orange-500'
                  )}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center border-2 border-orange-500">
                      <UserIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-white truncate uppercase tracking-wider text-sm">
                        {conversation.partner?.name || conversation.name || 'Unknown Warrior'}
                      </p>
                      <p className="text-sm text-gray-400 truncate font-medium">
                        {conversation.lastMessage?.content || conversation.lastMessage || 'No battle messages yet'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Battle Communication Area */}
      <div className="flex-1 flex flex-col bg-black">
        {activeConversation ? (
          <>
            {/* Battle Communication Header */}
            <div className="p-4 sm:p-6 border-b border-orange-500/30 bg-gradient-to-r from-gray-900 to-black flex-shrink-0">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center border-2 border-orange-500">
                  {activeConversation.avatar ? (
                    <img 
                      src={activeConversation.avatar} 
                      alt={activeConversation.name}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  ) : (
                    <UserIcon className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-white uppercase tracking-wider text-lg">
                    {activeConversation.name || `Warrior ${activeConversation.otherUserId}`}
                  </h3>
                  <p className="text-sm text-orange-400 font-bold uppercase tracking-wider">⚔️ Battle Communication Active</p>
                </div>
              </div>
            </div>

            {/* Battle Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-black to-gray-900">
              {messages.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-orange-500">
                    <ChatBubbleLeftRightIcon className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-gray-300 font-bold mb-2 uppercase tracking-wider">No Battle Messages</p>
                  <p className="text-sm text-gray-400 font-medium">Send the first battle communication!</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={message.id || `message-${index}`}
                    className={clsx(
                      'flex',
                      message.senderId === user.id ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={clsx(
                        'max-w-xs lg:max-w-md px-4 py-3 rounded-xl font-medium',
                        message.senderId === user.id
                          ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white border border-orange-500'
                          : 'bg-gray-800 border border-gray-700 text-gray-200'
                      )}
                    >
                      <p>{message.content}</p>
                      <p className={clsx(
                        'text-xs mt-2 font-medium',
                        message.senderId === user.id ? 'text-orange-100' : 'text-gray-400'
                      )}>
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Battle Message Input */}
            <div className="p-4 sm:p-6 border-t border-orange-500/30 bg-gradient-to-r from-gray-900 to-black flex-shrink-0">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Send battle message..."
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className={clsx(
                    'px-4 py-3 rounded-xl font-black transition-all duration-200 flex-shrink-0',
                    !newMessage.trim() || sending
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600'
                      : 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:shadow-lg hover:shadow-orange-500/25 border border-orange-500'
                  )}
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
            <div className="text-center max-w-md px-8">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-orange-500">
                <ChatBubbleLeftRightIcon className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-wider">
                Select <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Battle</span> Communication
              </h3>
              <p className="text-gray-300 font-medium">Choose a warrior from the sidebar to begin strategic communications</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesSimple;
