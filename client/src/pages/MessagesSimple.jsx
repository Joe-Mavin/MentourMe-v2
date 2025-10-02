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
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading messages..." />
      </div>
    );
  }

  return (
    <div className="h-full flex bg-gray-50 -m-6">
      {/* Sidebar - Conversations */}
      <div className="w-80 border-r border-gray-200 bg-white flex-shrink-0">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-3">
            <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
            Messages
          </h2>
          
          {/* Search for users */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search users to message..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchUsers(e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
            
            {/* Search results dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1 max-h-48 overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => startNewConversation(user)}
                    className="w-full p-3 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="overflow-y-auto h-full">
          {conversations.length === 0 && !getUserIdFromPath() ? (
            <div className="p-4 text-center text-gray-500">
              <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p>No conversations yet</p>
              <p className="text-sm">Search for users above or use "Message" buttons from your mentorship dashboard!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {conversations.map((conversation, index) => (
                <button
                  key={conversation.id || `conversation-${index}`}
                  onClick={() => selectConversation(conversation)}
                  className={clsx(
                    'w-full p-4 text-left hover:bg-gray-50 transition-colors',
                    activeConversation?.id === conversation.id && 'bg-primary-50 border-r-2 border-primary-500'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {conversation.partner?.name || conversation.name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {conversation.lastMessage?.content || conversation.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  {activeConversation.avatar ? (
                    <img 
                      src={activeConversation.avatar} 
                      alt={activeConversation.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {activeConversation.name || `User ${activeConversation.otherUserId}`}
                  </h3>
                  <p className="text-sm text-gray-500">Click to start messaging</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>No messages yet</p>
                  <p className="text-sm">Send the first message!</p>
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
                        'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
                        message.senderId === user.id
                          ? 'bg-primary-500 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      )}
                    >
                      <p>{message.content}</p>
                      <p className={clsx(
                        'text-xs mt-1',
                        message.senderId === user.id ? 'text-primary-100' : 'text-gray-500'
                      )}>
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p>Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesSimple;
