import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMessaging } from '../../features/messaging/context/MessagingContext';
import { roomsAPI, messagesAPI } from '../../services/api';
import socketService from '../../services/socket';
import RoomMembersModal from './RoomMembersModal';
import toast from 'react-hot-toast';
import {
  UserGroupIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
  PaperAirplaneIcon,
  FaceSmileIcon,
  PaperClipIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

const RoomChatView = ({ room }) => {
  const { user, hasRole } = useAuth();
  const { messages, sendMessage, loading } = useMessaging();
  const [newMessage, setNewMessage] = useState('');
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [roomMembers, setRoomMembers] = useState([]);
  const [roomMessages, setRoomMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (room?.id) {
      loadRoomMembers();
    }
  }, [room?.id]);

  useEffect(() => {
    if (room?.id) {
      loadRoomMessages();
    }
  }, [room?.id]);

  // Listen for membership changes
  useEffect(() => {
    const handleMembershipChange = (event) => {
      const { roomId, action } = event.detail;
      if (roomId == room?.id && action === 'joined') {
        console.log('🔄 Membership changed, refreshing room data...');
        // Refresh room data after membership change
        setTimeout(() => {
          loadRoomMembers();
          loadRoomMessages();
        }, 500); // Small delay to ensure server state is updated
      }
    };

    window.addEventListener('roomMembershipChanged', handleMembershipChange);
    return () => window.removeEventListener('roomMembershipChanged', handleMembershipChange);
  }, [room?.id]);

  useEffect(() => {
    if (room) {
      // Join room for real-time updates
      socketService.joinConversation(`room_${room.id}`);
    }
    
    return () => {
      if (room) {
        socketService.leaveConversation(`room_${room.id}`);
      }
    };
  }, [room]);

  // Real-time message handling
  useEffect(() => {
    const handleNewMessage = (message) => {
      if (message.roomId === room?.id) {
        setRoomMessages(prev => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some(msg => msg.id === message.id);
          if (!exists) {
            return [...prev, message];
          }
          return prev;
        });
      }
    };

    const handleMessageUpdate = (message) => {
      if (message.roomId === room?.id) {
        setRoomMessages(prev => prev.map(msg => 
          msg.id === message.id ? message : msg
        ));
      }
    };

    const handleMessageDelete = (messageId) => {
      setRoomMessages(prev => prev.filter(msg => msg.id !== messageId));
    };

    const handleTypingStart = (data) => {
      if (data.roomId === room?.id && data.userId !== user?.id) {
        setTypingUsers(prev => {
          const exists = prev.some(u => u.id === data.userId);
          if (!exists) {
            return [...prev, { id: data.userId, name: data.userName }];
          }
          return prev;
        });
      }
    };

    const handleTypingStop = (data) => {
      if (data.roomId === room?.id) {
        setTypingUsers(prev => prev.filter(u => u.id !== data.userId));
      }
    };

    socketService.on('new_room_message', handleNewMessage);
    socketService.on('message_updated', handleMessageUpdate);
    socketService.on('message_deleted', handleMessageDelete);
    socketService.on('user_typing', handleTypingStart);
    socketService.on('user_stopped_typing', handleTypingStop);
    socketService.on('user_joined_room', (data) => {
      if (data.roomId === room?.id) {
        console.log('🎉 User joined room:', data.user.name);
        toast.success(`${data.user.name} joined the room`);
        loadRoomMembers(); // Refresh member list
      }
    });
    socketService.on('user_left_room', (data) => {
      if (data.roomId === room?.id) {
        console.log('👋 User left room:', data.user.name);
        toast(`${data.user.name} left the room`, { icon: '👋' });
        loadRoomMembers(); // Refresh member list
      }
    });

    return () => {
      socketService.off('new_room_message', handleNewMessage);
      socketService.off('message_updated', handleMessageUpdate);
      socketService.off('message_deleted', handleMessageDelete);
      socketService.off('user_typing', handleTypingStart);
      socketService.off('user_stopped_typing', handleTypingStop);
      socketService.off('user_joined_room');
      socketService.off('user_left_room');
    };
  }, [room?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [roomMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadRoomMembers = async () => {
    if (!room) return;
    
    try {
      const response = await roomsAPI.getMembers(parseInt(room.id), { page: 1, limit: 50 });
      setRoomMembers(response.data?.data?.members || []);
    } catch (error) {
      console.log('Could not load room members:', error);
      setRoomMembers([]);
    }
  };

  const loadRoomMessages = async () => {
    if (!room?.id) return;
    
    try {
      setMessagesLoading(true);
      console.log(`🔍 CHECKING ROOM MESSAGE ACCESS: User ${user?.id} in room ${room.id}`);
      const response = await messagesAPI.getRoomMessages(room.id, { page: 1, limit: 50 });
      console.log(`✅ RAW RESPONSE:`, response);
      console.log(`✅ RESPONSE DATA:`, response.data);
      console.log(`✅ MESSAGES ARRAY:`, response.data?.data?.messages);
      
      const messages = response.data?.data?.messages || response.data?.messages || [];
      console.log(`✅ Loaded room messages: ${messages.length}`);
      setRoomMessages(messages);
    } catch (error) {
      console.log(`⚠️ Could not load room messages: ${error.response?.status}`, error.response?.data);
      if (error.response?.status === 403) {
        console.log('User is not a member of this room, showing empty state');
        setRoomMessages([]);
        // Don't show error toast for 403 - it's expected when not a member
      } else {
        // Show error for other types of errors
        console.error('Error loading room messages:', error);
      }
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !room) return;

    const messageText = newMessage.trim();
    const tempId = `temp_${Date.now()}`;
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      if (socketService.getConnectionStatus()) {
        socketService.socket.emit('typing_stop', {
          roomId: room.id,
          userId: user.id
        });
      }
    }

    // Optimistic update - add message immediately
    const optimisticMessage = {
      id: tempId,
      content: messageText,
      senderId: user.id,
      roomId: room.id,
      type: 'text',
      createdAt: new Date().toISOString(),
      sender: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        role: user.role
      },
      replyToId: replyingTo?.id,
      parentMessage: replyingTo,
      isOptimistic: true
    };

    setRoomMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setReplyingTo(null);

    try {
      const response = await messagesAPI.send({
        content: messageText,
        type: 'text',
        roomId: room.id
      });

      console.log('Message sent successfully to room:', room.id, response);

      // Remove optimistic message and add real message
      setRoomMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== tempId);
        return [...filtered, response.data.message];
      });

      scrollToBottom();
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Remove optimistic message on error
      setRoomMessages(prev => prev.filter(msg => msg.id !== tempId));
      
      // Handle specific error cases
      if (error.response?.status === 403) {
        toast.error('You are not a member of this room. Please join the room first.');
        // Optionally refresh the page or redirect to room list
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else if (error.response?.status === 404) {
        toast.error('Room not found.');
      } else {
        toast.error('Failed to send message. Please try again.');
      }
    }
  };
  const handleEditMessage = async (messageId, newContent) => {
    try {
      await messagesAPI.editMessage(messageId, newContent);
      // Update the message in local state
      setRoomMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: newContent, editedAt: new Date() }
          : msg
      ));
    } catch (error) {
      console.error('Failed to edit message:', error);
      throw error;
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await messagesAPI.deleteMessage(messageId);
      // Remove the message from local state
      setRoomMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  };

  const handleReplyToMessage = (message) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Handle typing indicators
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      // Emit typing start event
      if (socketService.getConnectionStatus()) {
        socketService.socket.emit('typing_start', {
          roomId: room.id,
          userId: user.id,
          userName: user.name
        });
      }
    } else if (isTyping && e.target.value.length === 0) {
      setIsTyping(false);
      // Emit typing stop event
      if (socketService.getConnectionStatus()) {
        socketService.socket.emit('typing_stop', {
          roomId: room.id,
          userId: user.id
        });
      }
    }

    // Clear existing timeout and set new one
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after 3 seconds of inactivity
    if (e.target.value.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          setIsTyping(false);
          if (socketService.getConnectionStatus()) {
            socketService.socket.emit('typing_stop', {
              roomId: room.id,
              userId: user.id
            });
          }
        }
      }, 3000);
    }
  };

  const getCategoryInfo = (category) => {
    const categoryMap = {
      mentorship: { icon: '⚔️', bgClass: 'bg-blue-900/50', textClass: 'text-blue-400' },
      goals: { icon: '🏆', bgClass: 'bg-purple-900/50', textClass: 'text-purple-400' },
      accountability: { icon: '🛡️', bgClass: 'bg-orange-900/50', textClass: 'text-orange-400' },
      support: { icon: '💚', bgClass: 'bg-green-900/50', textClass: 'text-green-400' },
      skills: { icon: '⚡', bgClass: 'bg-indigo-900/50', textClass: 'text-indigo-400' },
      networking: { icon: '🌐', bgClass: 'bg-pink-900/50', textClass: 'text-pink-400' },
      wellness: { icon: '🌱', bgClass: 'bg-teal-900/50', textClass: 'text-teal-400' }
    };
    return categoryMap[category] || { icon: '🏰', bgClass: 'bg-gray-700', textClass: 'text-gray-300' };
  };

  const canManageRoom = hasRole(['admin', 'mentor']) || 
    roomMembers.find(m => m.user?.id === user?.id && ['admin', 'moderator'].includes(m.role));

  if (!room) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-orange-500">
            <UserGroupIcon className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-wider">No Battle Room Selected</h3>
          <p className="text-lg text-gray-300 font-medium">Choose a war council room to begin strategic discussions</p>
        </div>
      </div>
    );
  }

  const categoryInfo = getCategoryInfo(room.category);

  return (
    <div className="flex flex-col h-full bg-black overflow-hidden">
      {/* Battle Room Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-orange-500/30 bg-gradient-to-r from-gray-900 to-black flex-shrink-0">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center border-2 border-orange-500 flex-shrink-0">
            <span className="text-lg sm:text-xl">{categoryInfo.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider truncate">{room.name}</h2>
            <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm text-gray-300">
              <span className="font-medium">{roomMembers.length} Warriors</span>
              <span className="hidden sm:inline">•</span>
              <span className="px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-black bg-gradient-to-r from-orange-600 to-red-600 text-white border border-orange-500 uppercase tracking-wider truncate">
                {room.category}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowMembersModal(true)}
            className="p-2 sm:p-3 text-gray-300 hover:text-orange-400 hover:bg-gray-800 rounded-xl transition-all duration-200 border border-gray-700 hover:border-orange-500/50"
            title="View battle allies"
          >
            <UserGroupIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          
          {canManageRoom && (
            <button
              className="p-2 sm:p-3 text-gray-300 hover:text-orange-400 hover:bg-gray-800 rounded-xl transition-all duration-200 border border-gray-700 hover:border-orange-500/50"
              title="Battle room settings"
            >
              <Cog6ToothIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
          
          <button
            className="p-2 sm:p-3 text-gray-300 hover:text-orange-400 hover:bg-gray-800 rounded-xl transition-all duration-200 border border-gray-700 hover:border-orange-500/50"
            title="Battle room intel"
          >
            <InformationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Battle Room Description */}
      {room.description && (
        <div className="p-4 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-orange-500/20">
          <p className="text-sm text-gray-300 font-medium">{room.description}</p>
        </div>
      )}

      {/* Battle Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 bg-gradient-to-b from-black to-gray-900 min-h-0">
        {messagesLoading ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-300 font-bold uppercase tracking-wider">Loading Battle Communications...</p>
            </div>
          </div>
        ) : roomMessages.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center mb-6 border-4 border-orange-500">
              <span className="text-3xl">{categoryInfo.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {room.name}
              </h2>
              <p className="text-sm text-gray-500 truncate">
                {room.description}
              </p>
              {/* Debug: Force Join Button */}
              <button
                onClick={async () => {
                  try {
                    console.log(`🏠 FORCE JOIN: Attempting to join room ${room.id}`);
                    const response = await roomsAPI.join(room.id);
                    console.log(`✅ FORCE JOIN: Success:`, response);
                    toast.success('Force joined room!');
                    window.location.reload(); // Reload to refresh membership
                  } catch (error) {
                    console.error(`❌ FORCE JOIN: Failed:`, error);
                    toast.error('Force join failed: ' + error.message);
                  }
                }}
                className="mt-2 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
              >
                🚨 FORCE JOIN (Debug)
              </button>
              
              {/* Debug: Send Test Message */}
              <button
                onClick={async () => {
                  try {
                    console.log(`📝 SENDING TEST MESSAGE to room ${room.id}`);
                    const response = await messagesAPI.send({
                      content: `Test message from ${user?.name} at ${new Date().toLocaleTimeString()}`,
                      roomId: room.id,
                      type: 'room'
                    });
                    console.log(`✅ TEST MESSAGE SENT:`, response);
                    toast.success('Test message sent!');
                    // Refresh messages
                    setTimeout(() => loadRoomMessages(), 500);
                  } catch (error) {
                    console.error(`❌ TEST MESSAGE FAILED:`, error);
                    toast.error('Test message failed: ' + error.message);
                  }
                }}
                className="mt-2 ml-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                📝 SEND TEST MESSAGE (Debug)
              </button>
            </div>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              This is the beginning of your {room.category} journey. Start the conversation and connect with fellow members.
            </p>
          </div>
        ) : (
          roomMessages.map((message, index) => (
            <MessageBubble
              key={`${message.id || `temp-${index}`}-${message.createdAt || Date.now()}`}
              message={message}
              isOwn={message.senderId === user?.id}
              showAvatar={index === 0 || roomMessages[index - 1]?.senderId !== message.senderId}
              onEdit={handleEditMessage}
              onDelete={handleDeleteMessage}
              onReply={handleReplyToMessage}
            />
          ))
        )}
        
        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2 px-4 py-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-sm text-gray-500">
              {typingUsers.length === 1 
                ? `${typingUsers[0].name} is typing...`
                : typingUsers.length === 2
                ? `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`
                : `${typingUsers[0].name} and ${typingUsers.length - 1} others are typing...`
              }
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Battle Message Input */}
      <div className="border-t border-orange-500/30 p-3 sm:p-6 bg-gradient-to-r from-gray-900 to-black flex-shrink-0">
        {/* Reply Preview */}
        {replyingTo && (
          <div className="mb-4 p-4 bg-gray-800 border-l-4 border-orange-500 rounded-r-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                Replying to {replyingTo.sender?.name}
              </span>
              <button
                onClick={cancelReply}
                className="text-gray-400 hover:text-orange-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-300 truncate font-medium">{replyingTo.content}</p>
          </div>
        )}
        
        {/* Mobile-Optimized Message Input */}
        <div className="space-y-3">
          {/* Message Input Row */}
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={handleInputChange}
                placeholder={replyingTo ? `Reply to ${replyingTo.sender?.name}...` : `Type your message...`}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none font-medium text-base"
                rows="1"
                style={{ 
                  minHeight: '44px', 
                  maxHeight: '100px',
                  fontSize: '16px', // Prevents zoom on iOS
                  WebkitAppearance: 'none', // Remove iOS styling
                  borderRadius: '12px', // Consistent border radius
                  touchAction: 'manipulation' // Improve touch responsiveness
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                  if (e.key === 'Escape') {
                    cancelReply();
                  }
                }}
              />
            </div>
            
            <button
              type="submit"
              disabled={!newMessage.trim()}
              onClick={handleSendMessage}
              className={clsx(
                'p-3 rounded-xl transition-all duration-200 font-black flex-shrink-0',
                newMessage.trim()
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:shadow-lg hover:shadow-orange-500/25 border border-orange-500'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600'
              )}
              title="Send message"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
          
          {/* Action Buttons Row - Mobile Friendly */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-orange-400 hover:bg-gray-700 rounded-lg transition-all duration-200"
                title="Add emoji"
              >
                <FaceSmileIcon className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-orange-400 hover:bg-gray-700 rounded-lg transition-all duration-200"
                title="Attach file"
              >
                <PaperClipIcon className="w-5 h-5" />
              </button>
            </div>
            
            {/* Character count for mobile */}
            <div className="text-xs text-gray-500">
              {newMessage.length}/500
            </div>
          </div>
        </div>
      </div>

      {/* Members Modal */}
      <RoomMembersModal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        room={room}
      />
    </div>
  );
};

// Enhanced Message Bubble Component
const MessageBubble = ({ message, isOwn, showAvatar, onEdit, onDelete, onReply }) => {
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleEdit = async () => {
    if (editContent.trim() === message.content) {
      setIsEditing(false);
      return;
    }
    
    try {
      await onEdit(message.id, editContent.trim());
      setIsEditing(false);
      toast.success('Message updated!');
    } catch (error) {
      toast.error('Failed to update message');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await onDelete(message.id);
        toast.success('Message deleted!');
      } catch (error) {
        toast.error('Failed to delete message');
      }
    }
  };

  return (
    <div 
      className={clsx('flex group', isOwn ? 'justify-end' : 'justify-start')}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={clsx('flex max-w-xs lg:max-w-md', isOwn ? 'flex-row-reverse' : 'flex-row')}>
        {showAvatar && !isOwn && (
          <img
            src={message.sender?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || 'User')}&background=6366f1&color=fff`}
            alt={message.sender?.name}
            className="w-8 h-8 rounded-full mr-2 mt-1 flex-shrink-0"
          />
        )}
        
        <div className={clsx('relative', isOwn ? 'mr-2' : showAvatar ? '' : 'ml-10')}>
          {!isOwn && showAvatar && (
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs font-medium text-gray-900">{message.sender?.name}</span>
              <span className={clsx(
                'text-xs px-1.5 py-0.5 rounded-full font-medium',
                message.sender?.role === 'mentor' ? 'bg-blue-100 text-blue-700' :
                message.sender?.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                'bg-gray-100 text-gray-600'
              )}>
                {message.sender?.role}
              </span>
            </div>
          )}
          
          <div className={clsx(
            'rounded-lg px-3 py-2 relative',
            isOwn 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-100 text-gray-900'
          )}>
            {/* Reply Preview */}
            {message.parentMessage && (
              <div className={clsx(
                'mb-2 p-2 rounded border-l-2',
                isOwn 
                  ? 'bg-primary-500 border-primary-300 text-blue-100' 
                  : 'bg-gray-50 border-gray-300 text-gray-600'
              )}>
                <div className="text-xs font-medium mb-1">
                  {message.parentMessage.sender?.name}
                </div>
                <div className="text-xs opacity-90 truncate">
                  {message.parentMessage.content}
                </div>
              </div>
            )}
            
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded resize-none bg-white text-gray-900"
                  rows="2"
                  autoFocus
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(message.content);
                    }}
                    className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEdit}
                    className="px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.editedAt && (
                  <span className={clsx(
                    'text-xs opacity-75 italic',
                    isOwn ? 'text-blue-100' : 'text-gray-500'
                  )}>
                    (edited)
                  </span>
                )}
                
                {/* Message Reactions */}
                {message.reactions && message.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {message.reactions.map((reaction, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer"
                      >
                        {reaction.emoji} {reaction.count}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className={clsx('text-xs text-gray-500 mt-1 flex items-center', isOwn ? 'justify-end' : 'justify-start')}>
            <span>{formatDistanceToNow(new Date(message.createdAt || Date.now()))} ago</span>
            {isOwn && (
              <span className="ml-1 flex items-center">
                {message.isOptimistic ? (
                  <svg className="w-3 h-3 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : message.isRead ? (
                  <span className="text-blue-500">✓✓</span>
                ) : (
                  <span className="text-gray-400">✓</span>
                )}
              </span>
            )}
          </div>

          {/* Message Actions */}
          {showActions && !isEditing && (
            <div className={clsx(
              'absolute top-0 flex space-x-1 bg-white border border-gray-200 rounded-lg shadow-lg px-1 py-1 z-10',
              isOwn ? '-left-20' : '-right-20'
            )}>
              <button
                onClick={() => onReply && onReply(message)}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="Reply"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                title="Add reaction"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              {isOwn && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          )}
          
          {/* Quick Emoji Picker */}
          {showEmojiPicker && (
            <div className={clsx(
              'absolute top-8 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-20 flex space-x-1',
              isOwn ? '-left-24' : '-right-24'
            )}>
              {['👍', '❤️', '😂', '😮', '😢', '😡'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    // Handle emoji reaction
                    console.log('React with:', emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="p-1 hover:bg-gray-100 rounded text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomChatView;
