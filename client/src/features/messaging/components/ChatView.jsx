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
      <div className={clsx('flex flex-col items-center justify-center h-full bg-gradient-to-br from-black via-gray-900 to-black', className)}>
        <div className="text-center max-w-md px-8">
          <div className="w-24 h-24 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center mb-8 border-4 border-orange-500 mx-auto">
            <UserIcon className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-wider">
            Select <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Battle</span> Communication
          </h3>
          <p className="text-gray-300 font-medium">Choose a warrior from the sidebar to begin strategic communications</p>
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
    <div className={clsx('flex flex-col h-full bg-black', className)}>
      {/* Battle Communication Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-orange-500/30 bg-gradient-to-r from-gray-900 to-black flex-shrink-0">
        <div className="flex items-center flex-1 min-w-0">
          {/* Battle Avatar */}
          <div className="relative flex-shrink-0 mr-4">
            {conversationAvatar ? (
              <img
                src={conversationAvatar}
                alt={conversationName}
                className="w-12 h-12 rounded-xl object-cover border-2 border-orange-500"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center border-2 border-orange-500">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
            )}
            
            {/* Battle Status Indicator */}
            {isOnline && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-black rounded-full shadow-lg"></div>
            )}
          </div>

          {/* Warrior Name and Status */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider truncate">{conversationName}</h2>
            {isOnline && (
              <p className="text-sm text-green-400 font-bold uppercase tracking-wider">⚔️ Battle Ready</p>
            )}
          </div>
        </div>

        {/* Battle Actions */}
        <div className="flex items-center space-x-2">
          <button
            className="p-2 sm:p-3 text-gray-300 hover:text-orange-400 hover:bg-gray-800 rounded-xl transition-all duration-200 border border-gray-700 hover:border-orange-500/50"
            title="Battle voice call"
          >
            <PhoneIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            className="p-2 sm:p-3 text-gray-300 hover:text-orange-400 hover:bg-gray-800 rounded-xl transition-all duration-200 border border-gray-700 hover:border-orange-500/50"
            title="Battle video call"
          >
            <VideoCameraIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            className="p-2 sm:p-3 text-gray-300 hover:text-orange-400 hover:bg-gray-800 rounded-xl transition-all duration-200 border border-gray-700 hover:border-orange-500/50"
            title="Battle intel"
          >
            <InformationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
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

        {/* Battle Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="px-4 sm:px-6 py-3">
            <TypingIndicator users={typingUsers} />
          </div>
        )}

        {/* Battle Message Input */}
        <div className="border-t border-orange-500/30 bg-gradient-to-r from-gray-900 to-black flex-shrink-0">
          <MessageInput
            onSendMessage={handleSendMessage}
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
            disabled={loading.sending}
            placeholder={`Send battle message to ${conversationName}...`}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatView;
