import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.eventHandlers = new Map();
    this.intentionalDisconnect = false;
  }

  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    // Reset intentional disconnect flag when connecting
    this.intentionalDisconnect = false;

    // Get server URL from environment with smart fallbacks
    const getServerUrl = () => {
      // First, check for explicit WebSocket URL
      if (import.meta.env.VITE_WS_URL) {
        return import.meta.env.VITE_WS_URL;
      }
      
      // Then check for explicit socket server URL
      if (import.meta.env.VITE_SOCKET_URL) {
        return import.meta.env.VITE_SOCKET_URL;
      }
      
      // Then check for API URL and convert to WebSocket
      if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL.replace('/api', '').replace('http', 'ws');
      }
      
      // Then check for general server URL
      if (import.meta.env.VITE_SERVER_URL) {
        return import.meta.env.VITE_SERVER_URL;
      }
      
      // Development vs production fallback
      if (import.meta.env.DEV) {
        return 'http://localhost:5000'; // Direct connection in dev
      }
      
      return 'https://mentourme-v2.onrender.com'; // Production fallback
    };
    
    const serverUrl = getServerUrl();
    
    console.log('Connecting to socket server:', serverUrl, 'isDev:', import.meta.env.DEV);
    
    this.socket = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected', { socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      this.emit('disconnected', { reason });
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
      this.emit('connect_error', error);
      this.handleReconnect();
    });

    // Message events
    this.socket.on('message', (message) => {
      this.emit('message', message);
    });

    this.socket.on('new_direct_message', (message) => {
      console.log('Received new direct message:', message);
      this.emit('new_direct_message', message);
    });

    this.socket.on('new_room_message', (message) => {
      console.log('Received new room message:', message);
      this.emit('new_room_message', message);
    });

    this.socket.on('message_sent', (message) => {
      console.log('Message sent confirmation:', message);
      this.emit('message_sent', message);
    });

    this.socket.on('message_delivered', (data) => {
      console.log('Message delivered:', data);
      this.emit('message_delivered', data);
    });

    this.socket.on('messages_delivered', (data) => {
      console.log('Messages delivered:', data);
      this.emit('messages_delivered', data);
    });

    this.socket.on('messages_read', (data) => {
      console.log('Messages read:', data);
      this.emit('messages_read', data);
    });

    this.socket.on('message_error', (error) => {
      console.error('Message error:', error);
      toast.error(error.error || 'Failed to send message');
      this.emit('message_error', error);
    });

    // Typing events
    this.socket.on('user_typing', (data) => {
      console.log('User typing:', data);
      this.emit('user_typing', data);
    });

    this.socket.on('user_stopped_typing', (data) => {
      console.log('User stopped typing:', data);
      this.emit('user_stopped_typing', data);
    });

    // User status events
    this.socket.on('user_status_change', (data) => {
      console.log('User status change:', data);
      this.emit('user_status_change', data);
    });

    this.socket.on('user_online', (data) => {
      console.log('User came online:', data);
      this.emit('user_online', data);
    });

    this.socket.on('user_offline', (data) => {
      console.log('User went offline:', data);
      this.emit('user_offline', data);
    });

    // Conversation events
    this.socket.on('conversation_updated', (conversation) => {
      this.emit('conversation_updated', conversation);
    });

    // Video call events
    this.socket.on('incoming_call', (data) => {
      this.emit('incoming_call', data);
    });

    this.socket.on('call_answered', (data) => {
      this.emit('call_answered', data);
    });

    this.socket.on('call_ended', (data) => {
      this.emit('call_ended', data);
    });

    this.socket.on('call_participant_joined', (data) => {
      this.emit('call_participant_joined', data);
    });

    this.socket.on('call_participant_left', (data) => {
      this.emit('call_participant_left', data);
    });

    // WebRTC signaling events - Simple names to match our implementation
    this.socket.on('offer', (data) => {
      console.log('🔌 Socket received offer:', data);
      this.emit('offer', data);
    });

    this.socket.on('answer', (data) => {
      console.log('🔌 Socket received answer:', data);
      this.emit('answer', data);
    });

    this.socket.on('ice-candidate', (data) => {
      console.log('🔌 Socket received ICE candidate:', data);
      this.emit('ice-candidate', data);
    });

    // Legacy WebRTC events for backward compatibility
    this.socket.on('webrtc_offer', (data) => {
      this.emit('webrtc_offer', data);
    });

    this.socket.on('webrtc_answer', (data) => {
      this.emit('webrtc_answer', data);
    });

    this.socket.on('webrtc_ice_candidate', (data) => {
      this.emit('webrtc_ice_candidate', data);
    });
  }

  handleReconnect() {
    // Don't reconnect if socket was intentionally disconnected
    if (this.intentionalDisconnect) {
      console.log('Skipping reconnect - socket was intentionally disconnected');
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      
      setTimeout(() => {
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.reconnect();
      }, delay);
    } else {
      toast.error('Failed to reconnect to server. Please refresh the page.');
    }
  }

  reconnect() {
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.connect(token);
    }
  }

  disconnect() {
    if (this.socket) {
      this.intentionalDisconnect = true;
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Reset intentional disconnect flag when connecting
  resetDisconnectFlag() {
    this.intentionalDisconnect = false;
  }

  // Event handling
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);
  }

  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).delete(handler);
    }
  }

  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Messaging methods
  sendMessage(data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('send_message', {
        ...data,
        timestamp: new Date().toISOString()
      });
      console.log('Sending message via socket:', data);
    } else {
      console.warn('Cannot send message: Socket not connected');
      throw new Error('Socket not connected');
    }
  }

  sendDirectMessage(receiverId, content, type = 'text') {
    if (this.socket && this.socket.connected) {
      this.socket.emit('send_direct_message', {
        receiverId,
        content,
        type,
        timestamp: new Date().toISOString()
      });
      console.log('Sending direct message:', { receiverId, content, type });
    } else {
      console.warn('Cannot send direct message: Socket not connected');
      throw new Error('Socket not connected');
    }
  }

  sendRoomMessage(roomId, content, type = 'text') {
    if (this.socket && this.socket.connected) {
      this.socket.emit('send_room_message', {
        roomId,
        content,
        type,
        timestamp: new Date().toISOString()
      });
      console.log('Sending room message:', { roomId, content, type });
    } else {
      console.warn('Cannot send room message: Socket not connected');
      throw new Error('Socket not connected');
    }
  }

  startTyping(conversationId, receiverId = null, roomId = null) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing_start', {
        conversationId,
        receiverId,
        roomId,
        timestamp: new Date().toISOString()
      });
    }
  }

  stopTyping(conversationId, receiverId = null, roomId = null) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing_stop', {
        conversationId,
        receiverId,
        roomId,
        timestamp: new Date().toISOString()
      });
    }
  }

  markMessageAsRead(messageId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('mark_message_read', {
        messageId,
        timestamp: new Date().toISOString()
      });
    }
  }

  joinConversation(conversationId) {
    if (this.socket && this.socket.connected) {
      if (conversationId.startsWith('room_')) {
        const roomId = conversationId.replace('room_', '');
        this.socket.emit('join_room', { roomId });
        console.log('Joining room:', roomId);
      } else {
        this.socket.emit('join_conversation', { conversationId });
      }
    }
  }

  leaveConversation(conversationId) {
    if (this.socket && this.socket.connected) {
      if (conversationId.startsWith('room_')) {
        const roomId = conversationId.replace('room_', '');
        this.socket.emit('leave_room', { roomId });
        console.log('Leaving room:', roomId);
      } else {
        this.socket.emit('leave_conversation', { conversationId });
      }
    }
  }

  // WebRTC methods
  initiateCall(targetUserId, callType = 'video', roomId = null) {
    if (this.socket && this.socket.connected) {
      const callData = {
        targetUserId,
        callType,
        roomId,
        timestamp: new Date().toISOString()
      };
      
      this.socket.emit('initiate_call', callData);
      console.log(`Initiating ${callType} call`, callData);
      return true;
    } else {
      console.error('Socket not connected, cannot initiate call');
      return false;
    }
  }

  acceptCall(callId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('accept_call', { callId });
      console.log(`Accepting call ${callId}`);
    }
  }

  rejectCall(callId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('reject_call', { callId });
      console.log(`Rejecting call ${callId}`);
    }
  }

  endCall(callId, reason = 'user_ended') {
    if (this.socket && this.socket.connected) {
      this.socket.emit('end_call', { 
        callId, 
        reason,
        timestamp: new Date().toISOString()
      });
      console.log(`Ending call ${callId} with reason: ${reason}`);
      return true;
    } else {
      console.error('Socket not connected, cannot end call');
      return false;
    }
  }

  sendSignal(callId, signal) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('webrtc_signal', { callId, signal });
    }
  }

  notifyScreenShareStart(callId, participantId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('screen_share_started', {
        callId,
        participantId,
        timestamp: new Date().toISOString()
      });
    }
  }

  notifyScreenShareStop(callId, participantId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('screen_share_stopped', {
        callId,
        participantId,
        timestamp: new Date().toISOString()
      });
    }
  }

  reportCallQuality(callId, qualityData) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('call_quality_report', {
        callId,
        ...qualityData,
        timestamp: new Date().toISOString()
      });
    }
  }

  sendWebRTCOffer(participantId, offer) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('webrtc_offer', {
        participantId,
        offer,
        timestamp: new Date().toISOString()
      });
    }
  }

  sendWebRTCAnswer(participantId, answer) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('webrtc_answer', {
        participantId,
        answer,
        timestamp: new Date().toISOString()
      });
    }
  }

  sendICECandidate(participantId, candidate) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('webrtc_ice_candidate', {
        participantId,
        candidate,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Enhanced error handling for WebRTC
  handleWebRTCError(callId, error, context) {
    console.error(`WebRTC Error in ${context}:`, error);
    
    if (this.socket && this.socket.connected) {
      this.socket.emit('webrtc_error', {
        callId,
        error: {
          name: error.name,
          message: error.message,
          code: error.code
        },
        context,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Room management methods
  joinRoom(roomId) {
    if (this.socket && this.socket.connected) {
      console.log('🏠 Joining room:', roomId);
      this.socket.emit('join_room', { roomId });
    } else {
      console.error('🏠 Cannot join room - socket not connected');
    }
  }

  leaveRoom(roomId) {
    if (this.socket && this.socket.connected) {
      console.log('🏠 Leaving room:', roomId);
      this.socket.emit('leave_room', { roomId });
    }
  }

  // Notify that a participant left the call
  notifyParticipantLeft(data) {
    if (this.socket && this.socket.connected) {
      console.log('📡 CLIENT: Emitting call_participant_left to server:', data);
      this.socket.emit('call_participant_left', data);
    } else {
      console.error('📡 CLIENT: Cannot emit participant left - socket not connected');
    }
  }

  // Utility methods
  getConnectionStatus() {
    return this.socket && this.socket.connected;
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }

  getSocketId() {
    return this.socket?.id;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
