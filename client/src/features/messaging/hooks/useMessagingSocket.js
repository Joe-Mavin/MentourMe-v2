import { useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import socketService from '../../../services/socket';
import { MESSAGING_ACTIONS } from '../context/MessagingContext';

/**
 * Custom hook to handle messaging-related socket events
 */
export const useMessagingSocket = (dispatch) => {
  const { user } = useAuth();

  // Socket event handlers
  const handleNewMessage = useCallback((message) => {
    dispatch({ type: MESSAGING_ACTIONS.ADD_MESSAGE, payload: message });
    
    // Update conversation with new message
    dispatch({
      type: MESSAGING_ACTIONS.UPDATE_CONVERSATION,
      payload: {
        id: message.conversationId,
        updates: {
          lastMessage: message,
          lastMessageAt: message.createdAt,
          unreadCount: message.senderId !== user?.id ? 1 : 0
        }
      }
    });
  }, [dispatch, user?.id]);

  const handleMessageDelivered = useCallback((data) => {
    dispatch({
      type: MESSAGING_ACTIONS.UPDATE_MESSAGE,
      payload: {
        id: data.messageId,
        updates: { status: 'delivered' }
      }
    });
  }, [dispatch]);

  const handleMessageRead = useCallback((data) => {
    dispatch({
      type: MESSAGING_ACTIONS.UPDATE_MESSAGE,
      payload: {
        id: data.messageId,
        updates: { status: 'read' }
      }
    });
  }, [dispatch]);

  const handleTypingStart = useCallback((data) => {
    if (data.userId !== user?.id) {
      dispatch({
        type: MESSAGING_ACTIONS.SET_TYPING_USERS,
        payload: (prevUsers) => {
          const filtered = prevUsers.filter(u => u.userId !== data.userId);
          return [...filtered, data];
        }
      });
    }
  }, [dispatch, user?.id]);

  const handleTypingStop = useCallback((data) => {
    dispatch({
      type: MESSAGING_ACTIONS.SET_TYPING_USERS,
      payload: (prevUsers) => prevUsers.filter(u => u.userId !== data.userId)
    });
  }, [dispatch]);

  const handleUserOnline = useCallback((data) => {
    dispatch({
      type: MESSAGING_ACTIONS.SET_ONLINE_USERS,
      payload: (prevUsers) => {
        const filtered = prevUsers.filter(u => u.id !== data.userId);
        return [...filtered, { id: data.userId, ...data }];
      }
    });
  }, [dispatch]);

  const handleUserOffline = useCallback((data) => {
    dispatch({
      type: MESSAGING_ACTIONS.SET_ONLINE_USERS,
      payload: (prevUsers) => prevUsers.filter(u => u.id !== data.userId)
    });
  }, [dispatch]);

  const handleConversationUpdated = useCallback((conversation) => {
    dispatch({
      type: MESSAGING_ACTIONS.UPDATE_CONVERSATION,
      payload: {
        id: conversation.id,
        updates: conversation
      }
    });
  }, [dispatch]);

  // Register socket listeners
  useEffect(() => {
    if (!user) return;

    const events = [
      ['message', handleNewMessage],
      ['message_delivered', handleMessageDelivered],
      ['message_read', handleMessageRead],
      ['typing_start', handleTypingStart],
      ['typing_stop', handleTypingStop],
      ['user_online', handleUserOnline],
      ['user_offline', handleUserOffline],
      ['conversation_updated', handleConversationUpdated]
    ];

    // Register all events
    events.forEach(([event, handler]) => {
      socketService.on(event, handler);
    });

    return () => {
      // Cleanup all events
      events.forEach(([event, handler]) => {
        socketService.off(event, handler);
      });
    };
  }, [
    user,
    handleNewMessage,
    handleMessageDelivered,
    handleMessageRead,
    handleTypingStart,
    handleTypingStop,
    handleUserOnline,
    handleUserOffline,
    handleConversationUpdated
  ]);

  // Socket connection management
  const connectSocket = useCallback(() => {
    if (user && !socketService.isConnected()) {
      socketService.connect();
    }
  }, [user]);

  const disconnectSocket = useCallback(() => {
    socketService.disconnect();
  }, []);

  return {
    connectSocket,
    disconnectSocket,
    isConnected: socketService.isConnected()
  };
};
