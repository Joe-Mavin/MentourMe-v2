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
      <div className={clsx('flex flex-col h-full bg-gradient-to-b from-gray-900 to-black', className)}>
        <div className="p-6 border-b border-orange-500/30">
          <h2 className="text-xl font-black text-white uppercase tracking-wider">
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">BATTLE</span> COMMS
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500"></div>
            <p className="text-sm text-gray-300 font-bold uppercase tracking-wider">Loading Battle Communications...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={clsx('flex flex-col h-full bg-gradient-to-b from-gray-900 to-black', className)}>
        <div className="p-6 border-b border-orange-500/30">
          <h2 className="text-xl font-black text-white uppercase tracking-wider">
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">BATTLE</span> COMMS
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm px-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-500">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-sm text-gray-300 mb-4 font-medium">Battle communications network failed</p>
            <button
              onClick={loadConversations}
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-black uppercase tracking-wider hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-200 border border-orange-500 text-sm"
            >
              Reconnect Battle Network
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('flex flex-col h-full bg-gradient-to-b from-gray-900 to-black', className)}>
      {/* Battle Communications Header */}
      <div className="p-4 sm:p-6 border-b border-orange-500/30">
        <h2 className="text-lg sm:text-xl font-black text-white mb-4 uppercase tracking-wider">
          <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">BATTLE</span> COMMS
        </h2>
        
        {/* Search Battle Communications */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-500" />
          <input
            type="text"
            placeholder="Search battle communications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-medium"
          />
        </div>
      </div>

      {/* Battle Communications List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center mb-6 border-4 border-orange-500">
              <UserIcon className="w-10 h-10 text-white" />
            </div>
            <p className="text-sm text-gray-300 text-center font-medium mb-4">
              {searchTerm ? 'No battle communications found' : 'No active battle communications'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-black uppercase tracking-wider hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-200 border border-orange-500 text-xs"
              >
                Clear Battle Search
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
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
        'flex items-center p-4 hover:bg-gray-800 cursor-pointer transition-all duration-200',
        isActive && 'bg-gradient-to-r from-orange-900/30 to-red-900/30 border-r-4 border-orange-500'
      )}
    >
      {/* Battle Avatar */}
      <div className="relative flex-shrink-0 mr-4">
        {conversationAvatar ? (
          <img
            src={conversationAvatar}
            alt={conversationName}
            className="w-12 h-12 rounded-xl object-cover border-2 border-orange-500/30"
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

      {/* Battle Communication Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className={clsx(
            'text-sm font-black truncate uppercase tracking-wider',
            hasUnread ? 'text-white' : 'text-gray-300'
          )}>
            {conversationName}
          </h3>
          <div className="flex items-center space-x-2">
            {lastMessageTime && (
              <span className={clsx(
                'text-xs font-medium',
                hasUnread ? 'text-orange-400' : 'text-gray-500'
              )}>
                {lastMessageTime}
              </span>
            )}
            {hasUnread && (
              <div className="w-6 h-6 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center border border-orange-500 shadow-lg">
                <span className="text-xs font-black text-white">
                  {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {messagePreview && (
          <p className={clsx(
            'text-sm truncate font-medium',
            hasUnread ? 'text-gray-300' : 'text-gray-400'
          )}>
            {conversation.lastMessage?.senderId === currentUserId && (
              <span className="text-orange-400 font-black">⚔️ You: </span>
            )}
            {messagePreview}
          </p>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
