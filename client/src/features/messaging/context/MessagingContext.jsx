import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { messagesAPI } from '../../../services/api';
import socketService from '../../../services/socket';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';

// Action types
const MESSAGING_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_CONVERSATIONS: 'SET_CONVERSATIONS',
  ADD_CONVERSATION: 'ADD_CONVERSATION',
  UPDATE_CONVERSATION: 'UPDATE_CONVERSATION',
  SET_ACTIVE_CONVERSATION: 'SET_ACTIVE_CONVERSATION',
  SET_MESSAGES: 'SET_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_MESSAGE: 'UPDATE_MESSAGE',
  SET_TYPING_USERS: 'SET_TYPING_USERS',
  SET_ONLINE_USERS: 'SET_ONLINE_USERS',
  CLEAR_UNREAD_COUNT: 'CLEAR_UNREAD_COUNT'
};

// Initial state
const initialState = {
  conversations: [],
  activeConversation: null,
  messages: [],
  typingUsers: [],
  onlineUsers: [],
  loading: {
    conversations: false,
    messages: false,
    sending: false
  },
  error: null,
  pagination: {
    hasMore: true,
    page: 1,
    limit: 50
  }
};

// Reducer function
function messagingReducer(state, action) {
  switch (action.type) {
    case MESSAGING_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.type]: action.payload.value
        }
      };

    case MESSAGING_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload
      };

    case MESSAGING_ACTIONS.SET_CONVERSATIONS:
      return {
        ...state,
        conversations: action.payload,
        loading: {
          ...state.loading,
          conversations: false
        }
      };

    case MESSAGING_ACTIONS.ADD_CONVERSATION:
      return {
        ...state,
        conversations: [action.payload, ...state.conversations]
      };

    case MESSAGING_ACTIONS.UPDATE_CONVERSATION:
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.id
            ? { ...conv, ...action.payload.updates }
            : conv
        )
      };

    case MESSAGING_ACTIONS.SET_ACTIVE_CONVERSATION:
      return {
        ...state,
        activeConversation: action.payload,
        messages: [],
        pagination: {
          ...initialState.pagination
        }
      };

    case MESSAGING_ACTIONS.SET_MESSAGES:
      return {
        ...state,
        messages: action.payload.append 
          ? [...action.payload.messages, ...state.messages]
          : action.payload.messages,
        pagination: {
          ...state.pagination,
          hasMore: action.payload.hasMore || false,
          page: action.payload.append ? state.pagination.page + 1 : 1
        },
        loading: {
          ...state.loading,
          messages: false
        }
      };

    case MESSAGING_ACTIONS.ADD_MESSAGE:
      // Prevent duplicate messages
      if (state.messages.find(msg => msg.id === action.payload.id)) {
        return state;
      }
      return {
        ...state,
        messages: [...state.messages, action.payload],
        loading: {
          ...state.loading,
          sending: false
        }
      };

    case MESSAGING_ACTIONS.UPDATE_MESSAGE:
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id
            ? { ...msg, ...action.payload.updates }
            : msg
        )
      };

    case MESSAGING_ACTIONS.SET_TYPING_USERS:
      if (action.payload.type === 'add') {
        return {
          ...state,
          typingUsers: [...state.typingUsers.filter(u => u.userId !== action.payload.user.userId), action.payload.user]
        };
      } else if (action.payload.type === 'remove') {
        return {
          ...state,
          typingUsers: state.typingUsers.filter(u => u.userId !== action.payload.userId)
        };
      }
      return {
        ...state,
        typingUsers: Array.isArray(action.payload) ? action.payload : state.typingUsers
      };

    case MESSAGING_ACTIONS.SET_ONLINE_USERS:
      if (action.payload.type === 'add') {
        return {
          ...state,
          onlineUsers: [...state.onlineUsers.filter(u => u.id !== action.payload.user.id), action.payload.user]
        };
      } else if (action.payload.type === 'remove') {
        return {
          ...state,
          onlineUsers: state.onlineUsers.filter(u => u.id !== action.payload.userId)
        };
      }
      return {
        ...state,
        onlineUsers: Array.isArray(action.payload) ? action.payload : state.onlineUsers
      };

    case MESSAGING_ACTIONS.CLEAR_UNREAD_COUNT:
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      };

    default:
      return state;
  }
}

// Create context
const MessagingContext = createContext();

// Provider component
export const MessagingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(messagingReducer, initialState);
  const { user } = useAuth();

  // Socket event handlers with useCallback to prevent infinite loops
  const handleNewDirectMessage = useCallback((message) => {
    console.log('Handling new direct message:', message);
    dispatch({ type: MESSAGING_ACTIONS.ADD_MESSAGE, payload: message });
    
    // Update conversation with new message
    const conversationId = `direct_${Math.min(message.senderId, user?.id)}_${Math.max(message.senderId, user?.id)}`;
    dispatch({
      type: MESSAGING_ACTIONS.UPDATE_CONVERSATION,
      payload: {
        id: conversationId,
        updates: {
          lastMessage: message,
          lastMessageAt: message.createdAt,
          unreadCount: message.senderId !== user?.id ? 1 : 0
        }
      }
    });
  }, [user?.id]);

  const handleNewRoomMessage = useCallback((message) => {
    console.log('Handling new room message:', message);
    dispatch({ type: MESSAGING_ACTIONS.ADD_MESSAGE, payload: message });
    
    // Update conversation with new message
    dispatch({
      type: MESSAGING_ACTIONS.UPDATE_CONVERSATION,
      payload: {
        id: message.roomId,
        updates: {
          lastMessage: message,
          lastMessageAt: message.createdAt,
          unreadCount: message.senderId !== user?.id ? 1 : 0
        }
      }
    });
  }, [user?.id]);

  const handleMessageSent = useCallback((message) => {
    console.log('Message sent confirmation:', message);
    // Update the temporary message with the real one from server
    dispatch({ 
      type: MESSAGING_ACTIONS.UPDATE_MESSAGE, 
      payload: { 
        id: message.id, 
        updates: { 
          ...message, 
          status: 'sent' 
        } 
      } 
    });
  }, []);

  const handleMessageError = useCallback((error) => {
    console.error('Message error:', error);
    // Could update message status to 'failed' here
    dispatch({ type: MESSAGING_ACTIONS.SET_ERROR, payload: error.error });
  }, []);

  const handleMessageDelivered = useCallback((data) => {
    console.log('Message delivered:', data);
    dispatch({ 
      type: MESSAGING_ACTIONS.UPDATE_MESSAGE, 
      payload: { 
        id: data.messageId, 
        updates: { 
          status: 'delivered',
          deliveredAt: data.deliveredAt
        } 
      } 
    });
  }, []);

  const handleMessagesDelivered = useCallback((data) => {
    console.log('Messages delivered:', data);
    data.messageIds?.forEach(messageId => {
      dispatch({ 
        type: MESSAGING_ACTIONS.UPDATE_MESSAGE, 
        payload: { 
          id: messageId, 
          updates: { 
            status: 'delivered',
            deliveredAt: data.deliveredAt
          } 
        } 
      });
    });
  }, []);

  const handleMessagesRead = useCallback((data) => {
    console.log('Messages read:', data);
    data.messageIds?.forEach(messageId => {
      dispatch({ 
        type: MESSAGING_ACTIONS.UPDATE_MESSAGE, 
        payload: { 
          id: messageId, 
          updates: { 
            status: 'read',
            readAt: data.readAt
          } 
        } 
      });
    });
  }, []);

  const handleTypingStart = useCallback((data) => {
    if (data.userId !== user?.id) {
      dispatch({
        type: MESSAGING_ACTIONS.SET_TYPING_USERS,
        payload: { type: 'add', user: data }
      });
    }
  }, [user?.id]);

  const handleTypingStop = useCallback((data) => {
    dispatch({
      type: MESSAGING_ACTIONS.SET_TYPING_USERS,
      payload: { type: 'remove', userId: data.userId }
    });
  }, []);

  const handleUserStatusChange = useCallback((data) => {
    console.log('User status change in context:', data);
    if (data.status === 'online') {
      dispatch({
        type: MESSAGING_ACTIONS.SET_ONLINE_USERS,
        payload: { type: 'add', user: { id: data.userId, ...data } }
      });
    } else if (data.status === 'offline') {
      dispatch({
        type: MESSAGING_ACTIONS.SET_ONLINE_USERS,
        payload: { type: 'remove', userId: data.userId }
      });
    }
  }, []);

  const handleUserOnline = useCallback((data) => {
    console.log('User online in context:', data);
    dispatch({
      type: MESSAGING_ACTIONS.SET_ONLINE_USERS,
      payload: { type: 'add', user: { id: data.userId, ...data } }
    });
  }, []);

  const handleUserOffline = useCallback((data) => {
    console.log('User offline in context:', data);
    dispatch({
      type: MESSAGING_ACTIONS.SET_ONLINE_USERS,
      payload: { type: 'remove', userId: data.userId }
    });
  }, []);

  // Socket event registration
  useEffect(() => {
    if (!user) return;

    // Register socket listeners
    socketService.on('new_direct_message', handleNewDirectMessage);
    socketService.on('new_room_message', handleNewRoomMessage);
    socketService.on('message_sent', handleMessageSent);
    socketService.on('message_error', handleMessageError);
    socketService.on('message_delivered', handleMessageDelivered);
    socketService.on('messages_delivered', handleMessagesDelivered);
    socketService.on('messages_read', handleMessagesRead);
    socketService.on('user_typing', handleTypingStart);
    socketService.on('user_stopped_typing', handleTypingStop);
    socketService.on('user_status_change', handleUserStatusChange);
    socketService.on('user_online', handleUserOnline);
    socketService.on('user_offline', handleUserOffline);

    return () => {
      socketService.off('new_direct_message', handleNewDirectMessage);
      socketService.off('new_room_message', handleNewRoomMessage);
      socketService.off('message_sent', handleMessageSent);
      socketService.off('message_error', handleMessageError);
      socketService.off('message_delivered', handleMessageDelivered);
      socketService.off('messages_delivered', handleMessagesDelivered);
      socketService.off('messages_read', handleMessagesRead);
      socketService.off('user_typing', handleTypingStart);
      socketService.off('user_stopped_typing', handleTypingStop);
      socketService.off('user_status_change', handleUserStatusChange);
      socketService.off('user_online', handleUserOnline);
      socketService.off('user_offline', handleUserOffline);
    };
  }, [user, handleNewDirectMessage, handleNewRoomMessage, handleMessageSent, handleMessageError, handleMessageDelivered, handleMessagesDelivered, handleMessagesRead, handleTypingStart, handleTypingStop, handleUserStatusChange, handleUserOnline, handleUserOffline]);

  // API functions
  const loadConversations = useCallback(async () => {
    dispatch({ type: MESSAGING_ACTIONS.SET_LOADING, payload: { type: 'conversations', value: true } });
    
    try {
      const response = await messagesAPI.getConversations();
      const conversations = response.data?.conversations || [];
      dispatch({ type: MESSAGING_ACTIONS.SET_CONVERSATIONS, payload: conversations });
    } catch (error) {
      console.error('Failed to load conversations:', error);
      dispatch({ type: MESSAGING_ACTIONS.SET_ERROR, payload: error.message });
      toast.error('Failed to load conversations');
    }
  }, []);

  const loadMessages = useCallback(async (conversationId, page = 1, append = false) => {
    dispatch({ type: MESSAGING_ACTIONS.SET_LOADING, payload: { type: 'messages', value: true } });
    
    try {
      // Determine if this is a direct message or room conversation
      const activeConv = state.activeConversation;
      let response;
      
      if (activeConv?.type === 'direct') {
        // For direct messages, extract the other user's ID from the conversation
        const otherUserId = activeConv.participants?.find(p => p.id !== user?.id)?.id;
        if (otherUserId) {
          response = await messagesAPI.getDirectMessages(otherUserId, {
            page,
            limit: state.pagination.limit
          });
        } else {
          // If no other user found, return empty messages
          dispatch({
            type: MESSAGING_ACTIONS.SET_MESSAGES,
            payload: { messages: [], hasMore: false, append }
          });
          return;
        }
      } else if (activeConv?.type === 'room') {
        response = await messagesAPI.getRoomMessages(conversationId, {
          page,
          limit: state.pagination.limit
        });
      } else {
        // Unknown conversation type, return empty messages
        dispatch({
          type: MESSAGING_ACTIONS.SET_MESSAGES,
          payload: { messages: [], hasMore: false, append }
        });
        return;
      }
      
      const messages = response.data?.messages || response.data || [];
      const hasMore = messages.length === state.pagination.limit;
      
      dispatch({
        type: MESSAGING_ACTIONS.SET_MESSAGES,
        payload: { messages, hasMore, append }
      });
    } catch (error) {
      console.error('Failed to load messages:', error);
      // Don't show error for 404 (conversation doesn't exist yet)
      if (error.status !== 404) {
        dispatch({ type: MESSAGING_ACTIONS.SET_ERROR, payload: error.message });
        toast.error('Failed to load messages');
      } else {
        // For 404, just set empty messages (new conversation)
        dispatch({
          type: MESSAGING_ACTIONS.SET_MESSAGES,
          payload: { messages: [], hasMore: false, append }
        });
      }
    } finally {
      dispatch({ type: MESSAGING_ACTIONS.SET_LOADING, payload: { type: 'messages', value: false } });
    }
  }, [state.pagination.limit, state.activeConversation, user]);

  const sendMessage = useCallback(async (conversationId, content, type = 'text', attachments = []) => {
    dispatch({ type: MESSAGING_ACTIONS.SET_LOADING, payload: { type: 'sending', value: true } });
    
    try {
      // Create optimistic message
      const optimisticMessage = {
        id: `temp_${Date.now()}`,
        content,
        type,
        senderId: user.id,
        conversationId,
        createdAt: new Date().toISOString(),
        status: 'sending',
        attachments,
        sender: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          role: user.role
        }
      };
      
      dispatch({ type: MESSAGING_ACTIONS.ADD_MESSAGE, payload: optimisticMessage });
      
      // Determine if this is a direct message or room message
      const activeConv = state.activeConversation;
      
      if (activeConv?.type === 'direct') {
        // Extract receiver ID for direct messages
        const receiverId = activeConv.participants?.find(p => p.id !== user.id)?.id;
        if (receiverId) {
          socketService.sendDirectMessage(receiverId, content, type);
        }
      } else if (activeConv?.type === 'room') {
        // Send room message
        socketService.sendRoomMessage(conversationId, content, type);
      } else {
        // Fallback to generic send message
        socketService.sendMessage({
          conversationId,
          content,
          type,
          attachments
        });
      }
      
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      dispatch({ type: MESSAGING_ACTIONS.SET_LOADING, payload: { type: 'sending', value: false } });
    }
  }, [user, state.activeConversation]);

  const startTyping = useCallback((conversationId) => {
    const activeConv = state.activeConversation;
    if (activeConv?.type === 'direct') {
      const receiverId = activeConv.participants?.find(p => p.id !== user.id)?.id;
      socketService.startTyping(conversationId, receiverId, null);
    } else if (activeConv?.type === 'room') {
      socketService.startTyping(conversationId, null, conversationId);
    } else {
      socketService.startTyping(conversationId);
    }
  }, [state.activeConversation, user]);

  const stopTyping = useCallback((conversationId) => {
    const activeConv = state.activeConversation;
    if (activeConv?.type === 'direct') {
      const receiverId = activeConv.participants?.find(p => p.id !== user.id)?.id;
      socketService.stopTyping(conversationId, receiverId, null);
    } else if (activeConv?.type === 'room') {
      socketService.stopTyping(conversationId, null, conversationId);
    } else {
      socketService.stopTyping(conversationId);
    }
  }, [state.activeConversation, user]);

  const setActiveConversation = useCallback((conversation) => {
    dispatch({ type: MESSAGING_ACTIONS.SET_ACTIVE_CONVERSATION, payload: conversation });
    
    if (conversation) {
      // Mark as read
      dispatch({ type: MESSAGING_ACTIONS.CLEAR_UNREAD_COUNT, payload: conversation.id });
      
      // Only load messages for existing conversations (not temporary ones)
      // Temporary conversations have IDs like "direct_5_2"
      if (!conversation.id.toString().includes('direct_') && !conversation.id.toString().includes('room_')) {
        loadMessages(conversation.id);
      } else {
        // For temporary conversations, set empty messages
        dispatch({
          type: MESSAGING_ACTIONS.SET_MESSAGES,
          payload: { messages: [], hasMore: false, append: false }
        });
      }
    }
  }, [loadMessages]);

  const loadMoreMessages = useCallback(() => {
    if (state.activeConversation && state.pagination.hasMore && !state.loading.messages) {
      loadMessages(state.activeConversation.id, state.pagination.page + 1, true);
    }
  }, [state.activeConversation, state.pagination, state.loading.messages, loadMessages]);

  const value = {
    // State
    ...state,
    
    // Actions
    loadConversations,
    loadMessages,
    sendMessage,
    startTyping,
    stopTyping,
    setActiveConversation,
    loadMoreMessages,
    
    // Dispatch for advanced usage
    dispatch
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};

// Custom hook to use messaging context
export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};

export { MESSAGING_ACTIONS };
