import React, { useState, useEffect } from 'react';
import { useMessaging } from '../context/MessagingContext';
import { useAuth } from '../../../context/AuthContext';
import {
  getConversationName,
  getConversationAvatar,
  getMessagePreview,
  formatConversationTime,
  isUserOnline
} from '../utils/messageUtils';
import { MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const ConversationList = ({ className }) => {
  const { user } = useAuth();
  const {
    conversations,
    activeConversation,
    loading,
    error,
    onlineUsers,
    loadConversations,
    setActiveConversation
  } = useMessaging();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);

  // Load conversations on mount
  useEffect(() => {
    console.log('ConversationList: Loading conversations on mount');
    loadConversations();
  }, [loadConversations]);

  // Filter conversations based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(conversation => {
        const name = getConversationName(conversation, user.id).toLowerCase();
        const lastMessage = getMessagePreview(conversation.lastMessage).toLowerCase();
        const search = searchTerm.toLowerCase();
        
        return name.includes(search) || lastMessage.includes(search);
      });
      setFilteredConversations(filtered);
    }
  }, [conversations, searchTerm, user.id]);

  const handleConversationClick = (conversation) => {
    setActiveConversation(conversation);
  };

  if (loading.conversations) {
    return (
      <div className={clsx('flex flex-col h-full', className)}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="text-sm text-gray-500">Loading conversations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={clsx('flex flex-col h-full', className)}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-3">Failed to load conversations</p>
            <button
              onClick={loadConversations}
              className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('flex flex-col h-full bg-white', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Messages</h2>
        
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <UserIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 text-center">
              {searchTerm ? 'No conversations found' : 'No conversations yet'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 text-sm text-primary-600 hover:text-primary-700"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={activeConversation?.id === conversation.id}
                currentUserId={user.id}
                onlineUsers={onlineUsers}
                onClick={() => handleConversationClick(conversation)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ConversationItem = ({ conversation, isActive, currentUserId, onlineUsers, onClick }) => {
  const conversationName = getConversationName(conversation, currentUserId);
  const conversationAvatar = getConversationAvatar(conversation, currentUserId);
  const messagePreview = getMessagePreview(conversation.lastMessage);
  const lastMessageTime = formatConversationTime(conversation.lastMessageAt);
  const hasUnread = conversation.unreadCount > 0;
  
  // Check if the other user is online (for direct messages)
  const otherParticipant = conversation.participants?.find(p => p.id !== currentUserId);
  const isOnline = otherParticipant ? isUserOnline(otherParticipant.id, onlineUsers) : false;

  return (
    <div
      onClick={onClick}
      className={clsx(
        'flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors',
        isActive && 'bg-primary-50 border-r-2 border-primary-500'
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0 mr-3">
        {conversationAvatar ? (
          <img
            src={conversationAvatar}
            alt={conversationName}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
            <UserIcon className="w-6 h-6 text-gray-600" />
          </div>
        )}
        
        {/* Online indicator */}
        {isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className={clsx(
            'text-sm font-medium truncate',
            hasUnread ? 'text-gray-900' : 'text-gray-700'
          )}>
            {conversationName}
          </h3>
          <div className="flex items-center space-x-2">
            {lastMessageTime && (
              <span className={clsx(
                'text-xs',
                hasUnread ? 'text-primary-600 font-medium' : 'text-gray-500'
              )}>
                {lastMessageTime}
              </span>
            )}
            {hasUnread && (
              <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-white">
                  {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {messagePreview && (
          <p className={clsx(
            'text-sm truncate',
            hasUnread ? 'text-gray-600 font-medium' : 'text-gray-500'
          )}>
            {conversation.lastMessage?.senderId === currentUserId && 'You: '}
            {messagePreview}
          </p>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
