/**
 * Simple WebRTC Service - Minimal, reliable implementation
 */
class SimpleWebRTC {
  constructor() {
    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.isInitiator = false;
    this.callId = null;
    this.socket = null;
    this.offerCreated = false; // Flag to prevent multiple offers
    
    // Callbacks
    this.onLocalStream = null;
    this.onRemoteStream = null;
    this.onConnectionChange = null;
    this.onError = null;
  }

  /**
   * Initialize the WebRTC connection
   */
  async initialize(socket, callId, isInitiator = false) {
    try {
      console.log('🚀 Initializing Simple WebRTC:', { callId, isInitiator });
      
      this.socket = socket;
      this.callId = callId;
      this.isInitiator = isInitiator;
      
      // Get user media first
      await this.getUserMedia();
      
      // Setup peer connection
      this.setupPeerConnection();
      
      // Join the call room
      this.socket.emit('join_room', { roomId: this.callId });
      
      // Setup socket listeners
      this.setupSocketListeners();
      
      // If initiator, create offer after a short delay
      if (this.isInitiator) {
        setTimeout(() => {
          this.createOffer();
        }, 2000); // Longer delay to ensure both participants are ready
      }
      
      console.log('✅ Simple WebRTC initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize WebRTC:', error);
      this.onError?.(error);
      return false;
    }
  }

  /**
   * Get user media
   */
  async getUserMedia() {
    try {
      console.log('🎥 Getting user media...');
      
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      console.log('✅ Got local stream');
      this.onLocalStream?.(this.localStream);
      
      return this.localStream;
    } catch (error) {
      console.error('❌ Failed to get user media:', error);
      throw error;
    }
  }

  /**
   * Setup peer connection
   */
  setupPeerConnection() {
    console.log('🔗 Setting up peer connection...');
    
    // Simple STUN configuration
    const config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };
    
    this.peerConnection = new RTCPeerConnection(config);
    
    // Add local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }
    
    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('📺 Received remote stream');
      this.remoteStream = event.streams[0];
      this.onRemoteStream?.(this.remoteStream);
    };
    
    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 Sending ICE candidate');
        this.socket.emit('ice-candidate', {
          callId: this.callId,
          candidate: event.candidate
        });
      }
    };
    
    // Handle connection state
    this.peerConnection.onconnectionstatechange = () => {
      console.log('🔄 Connection state:', this.peerConnection.connectionState);
      this.onConnectionChange?.(this.peerConnection.connectionState);
    };
    
    console.log('✅ Peer connection setup complete');
  }

  /**
   * Setup socket listeners
   */
  setupSocketListeners() {
    console.log('🔌 Setting up socket listeners...');
    
    this.socket.on('offer', async (data) => {
      console.log('📥 Received offer');
      await this.handleOffer(data.offer);
    });
    
    this.socket.on('answer', async (data) => {
      console.log('📥 Received answer');
      await this.handleAnswer(data.answer);
    });
    
    this.socket.on('ice-candidate', async (data) => {
      console.log('🧊 Received ICE candidate');
      await this.handleIceCandidate(data.candidate);
    });
  }

  /**
   * Create and send offer
   */
  async createOffer() {
    try {
      console.log('📤 Creating offer...');
      
      // Check if we already created an offer
      if (this.offerCreated) {
        console.log('⚠️ Offer already created, skipping');
        return;
      }
      
      // Check if we already have a local description
      if (this.peerConnection.localDescription) {
        console.log('⚠️ Already have local description, skipping offer creation');
        return;
      }
      
      // Check signaling state
      if (this.peerConnection.signalingState !== 'stable') {
        console.log('⚠️ Peer connection not in stable state:', this.peerConnection.signalingState);
        return;
      }
      
      this.offerCreated = true; // Mark that we're creating an offer
      
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      await this.peerConnection.setLocalDescription(offer);
      
      this.socket.emit('offer', {
        callId: this.callId,
        offer: offer
      });
      
      console.log('✅ Offer sent');
    } catch (error) {
      console.error('❌ Failed to create offer:', error);
      this.offerCreated = false; // Reset flag on error
      this.onError?.(error);
    }
  }

  /**
   * Handle incoming offer
   */
  async handleOffer(offer) {
    try {
      console.log('📥 Handling offer...');
      
      // Check if we already have a remote description
      if (this.peerConnection.remoteDescription) {
        console.log('⚠️ Already have remote description, ignoring offer');
        return;
      }
      
      // Check signaling state
      if (this.peerConnection.signalingState !== 'stable' && this.peerConnection.signalingState !== 'have-local-offer') {
        console.log('⚠️ Cannot handle offer in current state:', this.peerConnection.signalingState);
        return;
      }
      
      await this.peerConnection.setRemoteDescription(offer);
      
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      
      this.socket.emit('answer', {
        callId: this.callId,
        answer: answer
      });
      
      console.log('✅ Answer sent');
    } catch (error) {
      console.error('❌ Failed to handle offer:', error);
      this.onError?.(error);
    }
  }

  /**
   * Handle incoming answer
   */
  async handleAnswer(answer) {
    try {
      console.log('📥 Handling answer...');
      
      // Check if we already have a remote description
      if (this.peerConnection.remoteDescription) {
        console.log('⚠️ Already have remote description, ignoring answer');
        return;
      }
      
      // Check signaling state - should be have-local-offer
      if (this.peerConnection.signalingState !== 'have-local-offer') {
        console.log('⚠️ Cannot handle answer in current state:', this.peerConnection.signalingState);
        return;
      }
      
      await this.peerConnection.setRemoteDescription(answer);
      console.log('✅ Answer processed');
    } catch (error) {
      console.error('❌ Failed to handle answer:', error);
      this.onError?.(error);
    }
  }

  /**
   * Handle ICE candidate
   */
  async handleIceCandidate(candidate) {
    try {
      await this.peerConnection.addIceCandidate(candidate);
      console.log('✅ ICE candidate added');
    } catch (error) {
      console.error('❌ Failed to add ICE candidate:', error);
    }
  }

  /**
   * Toggle video
   */
  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Toggle audio
   */
  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * End call and cleanup
   */
  endCall() {
    console.log('📞 Ending call...');
    
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    // Clear remote stream
    this.remoteStream = null;
    
    // Reset flags
    this.offerCreated = false;
    
    // Remove socket listeners
    if (this.socket) {
      this.socket.off('offer');
      this.socket.off('answer');
      this.socket.off('ice-candidate');
    }
    
    console.log('✅ Call ended');
  }

  /**
   * Get streams
   */
  getLocalStream() {
    return this.localStream;
  }

  getRemoteStream() {
    return this.remoteStream;
  }
}

// Create singleton
const simpleWebRTC = new SimpleWebRTC();
export default simpleWebRTC;
