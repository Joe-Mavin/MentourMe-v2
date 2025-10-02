import React, { useEffect, useRef, useState } from 'react';
import { useMessaging } from '../context/MessagingContext';
import { useAuth } from '../../../context/AuthContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import {
  getConversationName,
  getConversationAvatar,
  isUserOnline,
  shouldAutoScroll,
  scrollToBottom
} from '../utils/messageUtils';
import { 
  PhoneIcon, 
  VideoCameraIcon, 
  InformationCircleIcon,
  UserIcon 
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const ChatView = ({ className }) => {
  const { user } = useAuth();
  const {
    activeConversation,
    messages,
    loading,
    typingUsers,
    onlineUsers,
    loadMoreMessages,
    sendMessage,
    startTyping,
    stopTyping,
    pagination
  } = useMessaging();

  const messagesContainerRef = useRef(null);
  const [shouldAutoScrollToBottom, setShouldAutoScrollToBottom] = useState(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldAutoScrollToBottom && messages.length > 0) {
      scrollToBottom(messagesContainerRef);
    }
  }, [messages, shouldAutoScrollToBottom]);

  // Handle scroll to detect if user is at bottom
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const isAtBottom = shouldAutoScroll(messagesContainerRef);
      setShouldAutoScrollToBottom(isAtBottom);
    }
  };


  // Load more messages when scrolling to top
  const handleLoadMore = () => {
    if (pagination.hasMore && !loading.messages) {
      loadMoreMessages();
    }
  };

  const handleSendMessage = async (content, type = 'text', attachments = []) => {
    if (!activeConversation) return;
    
    await sendMessage(activeConversation.id, content, type, attachments);
    setShouldAutoScrollToBottom(true);
  };

  const handleTypingStart = () => {
    if (activeConversation) {
      startTyping(activeConversation.id);
    }
  };

  const handleTypingStop = () => {
    if (activeConversation) {
      stopTyping(activeConversation.id);
    }
  };

  if (!activeConversation) {
    return (
      <div className={clsx('flex flex-col items-center justify-center h-full bg-gray-50', className)}>
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <UserIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
          <p className="text-sm text-gray-500">Choose a conversation from the sidebar to start messaging</p>
        </div>
      </div>
    );
  }

  const conversationName = getConversationName(activeConversation, user.id);
  const conversationAvatar = getConversationAvatar(activeConversation, user.id);
  
  // Check if the other user is online (for direct messages)
  const otherParticipant = activeConversation.participants?.find(p => p.id !== user.id);
  const isOnline = otherParticipant ? isUserOnline(otherParticipant.id, onlineUsers) : false;

  return (
    <div className={clsx('flex flex-col h-full bg-white', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center">
          {/* Avatar */}
          <div className="relative flex-shrink-0 mr-3">
            {conversationAvatar ? (
              <img
                src={conversationAvatar}
                alt={conversationName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-gray-600" />
              </div>
            )}
            
            {/* Online indicator */}
            {isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>

          {/* Name and status */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{conversationName}</h2>
            {isOnline && (
              <p className="text-sm text-green-600">Online</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Voice call"
          >
            <PhoneIcon className="w-5 h-5" />
          </button>
          <button
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Video call"
          >
            <VideoCameraIcon className="w-5 h-5" />
          </button>
          <button
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Conversation info"
          >
            <InformationCircleIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col min-h-0">
        <MessageList
          ref={messagesContainerRef}
          messages={messages}
          currentUserId={user.id}
          loading={loading.messages}
          hasMore={pagination.hasMore}
          onScroll={handleScroll}
          onLoadMore={handleLoadMore}
          className="flex-1"
        />

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="px-4 py-2">
            <TypingIndicator users={typingUsers} />
          </div>
        )}

        {/* Message Input */}
        <div className="border-t border-gray-200 bg-white">
          <MessageInput
            onSendMessage={handleSendMessage}
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
            disabled={loading.sending}
            placeholder={`Message ${conversationName}...`}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatView;
