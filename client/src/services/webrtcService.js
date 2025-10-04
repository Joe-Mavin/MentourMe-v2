import webrtcConfigService from './webrtcConfig';
import socketService from './socket';

/**
 * WebRTC Service for handling peer-to-peer video calls
 * Manages peer connections, media streams, and signaling
 */
class WebRTCService {
  constructor() {
    this.localStream = null;
    this.peerConnections = new Map(); // Map of participantId -> RTCPeerConnection
    this.remoteStreams = new Map(); // Map of participantId -> MediaStream
    this.config = null;
    this.callId = null;
    this.isInitiator = false;
    
    // Event handlers
    this.onRemoteStreamAdded = null;
    this.onRemoteStreamRemoved = null;
    this.onConnectionStateChange = null;
    this.onError = null;
  }

  /**
   * Initialize WebRTC service for a call
   */
  async initialize(callId, isInitiator = false, userId = null) {
    try {
      console.log('🚀 Initializing WebRTC service for call:', callId);
      
      this.callId = callId;
      this.isInitiator = isInitiator;
      this.userId = userId;
      
      // Get WebRTC configuration
      this.config = await webrtcConfigService.getPeerConnectionConfig();
      console.log('📡 WebRTC config loaded:', this.config);
      
      // Setup socket listeners for signaling
      this.setupSignalingListeners();
      
      // Get user media
      await this.getUserMedia();
      
      console.log('✅ WebRTC service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize WebRTC service:', error);
      this.onError?.(error);
      return false;
    }
  }

  /**
   * Get user media (camera and microphone)
   */
  async getUserMedia(constraints = { video: true, audio: true }) {
    try {
      console.log('🎥 Getting user media...');
      
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Local stream obtained:', this.localStream.id);
      
      return this.localStream;
    } catch (error) {
      console.error('❌ Failed to get user media:', error);
      throw error;
    }
  }

  /**
   * Create peer connection for a participant
   */
  createPeerConnection(participantId) {
    try {
      console.log('🔗 Creating peer connection for:', participantId);
      
      const peerConnection = new RTCPeerConnection(this.config);
      
      // Add local stream tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          peerConnection.addTrack(track, this.localStream);
        });
      }
      
      // Handle remote stream
      peerConnection.ontrack = (event) => {
        console.log('📺 Remote stream received from:', participantId);
        const [remoteStream] = event.streams;
        this.remoteStreams.set(participantId, remoteStream);
        this.onRemoteStreamAdded?.(participantId, remoteStream);
      };
      
      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 Sending ICE candidate to:', participantId);
          socketService.emit('ice-candidate', {
            callId: this.callId,
            targetId: participantId,
            candidate: event.candidate
          });
        }
      };
      
      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log(`🔄 Connection state for ${participantId}:`, peerConnection.connectionState);
        this.onConnectionStateChange?.(participantId, peerConnection.connectionState);
        
        if (peerConnection.connectionState === 'disconnected' || 
            peerConnection.connectionState === 'failed') {
          this.removePeerConnection(participantId);
        }
      };
      
      this.peerConnections.set(participantId, peerConnection);
      return peerConnection;
    } catch (error) {
      console.error('❌ Failed to create peer connection:', error);
      throw error;
    }
  }

  /**
   * Create and send offer to participant
   */
  async createOffer(participantId) {
    try {
      console.log('📤 Creating offer for:', participantId);
      
      let peerConnection = this.peerConnections.get(participantId);
      
      // If peer connection exists and is not in stable state, don't create new offer
      if (peerConnection && peerConnection.signalingState !== 'stable') {
        console.warn(`⚠️ Peer connection already in progress for ${participantId}, state: ${peerConnection.signalingState}`);
        return;
      }
      
      // Create new peer connection if needed
      if (!peerConnection) {
        peerConnection = this.createPeerConnection(participantId);
      }
      
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      socketService.emit('offer', {
        callId: this.callId,
        targetId: participantId,
        offer: offer
      });
      
      console.log('✅ Offer sent to:', participantId);
    } catch (error) {
      console.error('❌ Failed to create offer:', error);
      throw error;
    }
  }

  /**
   * Handle incoming offer
   */
  async handleOffer(participantId, offer) {
    try {
      console.log('📥 Handling offer from:', participantId);
      
      const peerConnection = this.peerConnections.get(participantId) || 
                           this.createPeerConnection(participantId);
      
      // Check if we can set remote description
      if (peerConnection.signalingState !== 'stable' && peerConnection.signalingState !== 'have-local-offer') {
        console.warn(`⚠️ Cannot handle offer, peer connection in state: ${peerConnection.signalingState}`);
        return;
      }
      
      await peerConnection.setRemoteDescription(offer);
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      socketService.emit('answer', {
        callId: this.callId,
        targetId: participantId,
        answer: answer
      });
      
      console.log('✅ Answer sent to:', participantId);
    } catch (error) {
      console.error('❌ Failed to handle offer:', error);
      throw error;
    }
  }

  /**
   * Handle incoming answer
   */
  async handleAnswer(participantId, answer) {
    try {
      console.log('📥 Handling answer from:', participantId);
      
      const peerConnection = this.peerConnections.get(participantId);
      if (peerConnection) {
        // Check if we can set remote description
        if (peerConnection.signalingState !== 'have-local-offer') {
          console.warn(`⚠️ Cannot handle answer, peer connection in state: ${peerConnection.signalingState}`);
          return;
        }
        
        await peerConnection.setRemoteDescription(answer);
        console.log('✅ Answer processed from:', participantId);
      } else {
        console.warn('⚠️ No peer connection found for participant:', participantId);
      }
    } catch (error) {
      console.error('❌ Failed to handle answer:', error);
      throw error;
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  async handleIceCandidate(participantId, candidate) {
    try {
      const peerConnection = this.peerConnections.get(participantId);
      if (peerConnection) {
        await peerConnection.addIceCandidate(candidate);
        console.log('🧊 ICE candidate added from:', participantId);
      }
    } catch (error) {
      console.error('❌ Failed to handle ICE candidate:', error);
    }
  }

  /**
   * Setup socket listeners for WebRTC signaling
   */
  setupSignalingListeners() {
    console.log('🔌 Setting up WebRTC signaling listeners');
    
    socketService.on('offer', ({ fromId, offer }) => {
      this.handleOffer(fromId, offer);
    });
    
    socketService.on('answer', ({ fromId, answer }) => {
      this.handleAnswer(fromId, answer);
    });
    
    socketService.on('ice-candidate', ({ fromId, candidate }) => {
      this.handleIceCandidate(fromId, candidate);
    });
    
    socketService.on('participant-joined', ({ participantId }) => {
      console.log('👤 Participant joined:', participantId);
      // Only the initiator creates offers, or if we have a lower ID (to prevent collision)
      if (this.isInitiator || (participantId && participantId < (this.userId || 0))) {
        setTimeout(() => {
          this.createOffer(participantId);
        }, 100); // Small delay to prevent race conditions
      }
    });
    
    socketService.on('participant-left', ({ participantId }) => {
      console.log('👋 Participant left:', participantId);
      this.removePeerConnection(participantId);
    });
  }

  /**
   * Remove peer connection and clean up
   */
  removePeerConnection(participantId) {
    const peerConnection = this.peerConnections.get(participantId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(participantId);
    }
    
    const remoteStream = this.remoteStreams.get(participantId);
    if (remoteStream) {
      this.remoteStreams.delete(participantId);
      this.onRemoteStreamRemoved?.(participantId);
    }
  }

  /**
   * Toggle local video
   */
  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Toggle local audio
   */
  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * End call and clean up all connections
   */
  endCall() {
    console.log('📞 Ending call and cleaning up...');
    
    // Close all peer connections
    this.peerConnections.forEach((peerConnection, participantId) => {
      peerConnection.close();
    });
    this.peerConnections.clear();
    
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    // Clear remote streams
    this.remoteStreams.clear();
    
    // Remove socket listeners
    socketService.off('offer');
    socketService.off('answer');
    socketService.off('ice-candidate');
    socketService.off('participant-joined');
    socketService.off('participant-left');
    
    console.log('✅ Call ended and cleaned up');
  }

  /**
   * Get current local stream
   */
  getLocalStream() {
    return this.localStream;
  }

  /**
   * Get all remote streams
   */
  getRemoteStreams() {
    return this.remoteStreams;
  }

  /**
   * Get connection state for a participant
   */
  getConnectionState(participantId) {
    const peerConnection = this.peerConnections.get(participantId);
    return peerConnection ? peerConnection.connectionState : 'disconnected';
  }
}

// Create singleton instance
const webrtcService = new WebRTCService();

export default webrtcService;
