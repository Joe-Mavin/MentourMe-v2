import React, { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { MessagingProvider, useMessaging } from '../context/MessagingContext';
import { useAuth } from '../../../context/AuthContext';
import ConversationList from './ConversationList';
import ChatView from './ChatView';
import clsx from 'clsx';

// Inner component that has access to MessagingContext
const MessagingLayoutInner = ({ className }) => {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const { setActiveConversation, conversations } = useMessaging();

  // Handle direct message routes
  useEffect(() => {
    if (location.pathname.includes('/direct/') && id && user) {
      // Find existing conversation or create a new one
      const existingConversation = conversations.find(conv => 
        conv.type === 'direct' && 
        conv.participants?.some(p => p.id === parseInt(id))
      );

      if (existingConversation) {
        setActiveConversation(existingConversation);
      } else {
        // Create a temporary conversation object
        const tempConversation = {
          id: `direct_${user.id}_${id}`,
          type: 'direct',
          participants: [
            { id: user.id, name: user.name, avatar: user.avatar },
            { id: parseInt(id), name: `User ${id}`, avatar: null }
          ],
          messages: [],
          unreadCount: 0
        };
        setActiveConversation(tempConversation);
      }
    }
  }, [id, location.pathname, user, conversations, setActiveConversation]);

  return (
    <div className={clsx('h-full flex bg-gradient-to-br from-gray-900 via-black to-gray-900', className)}>
      {/* Sidebar - Battle Communications List */}
      <div className="w-80 border-r border-orange-500/30 bg-gradient-to-b from-gray-900 to-black flex-shrink-0">
        <ConversationList />
      </div>

      {/* Main battle communications area */}
      <div className="flex-1 bg-black">
        <ChatView />
      </div>
    </div>
  );
};

const MessagingLayout = ({ className }) => {
  return (
    <MessagingProvider>
      <MessagingLayoutInner className={className} />
    </MessagingProvider>
  );
};

export default MessagingLayout;
