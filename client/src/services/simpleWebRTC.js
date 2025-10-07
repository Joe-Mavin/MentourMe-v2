import webrtcConfigService from './webrtcConfig';

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
    this.webrtcConfig = null;
    this.connectionMonitorInterval = null;
    
    // Callbacks
    this.onLocalStream = null;
    this.onRemoteStream = null;
    this.onConnectionChange = null;
    this.onError = null;
  }

  /**
   * Initialize the WebRTC connection
   */
  async initialize(socketService, callId, isInitiator = false) {
    try {
      console.log('🚀 Initializing Simple WebRTC:', { callId, isInitiator });
      console.log('🔌 Socket service:', socketService);
      console.log('📊 Socket connected:', socketService?.getConnectionStatus());
      
      this.socket = socketService;
      this.callId = callId;
      this.isInitiator = isInitiator;
      
      // Load WebRTC configuration
      await this.loadWebRTCConfig();
      
      // Get user media first
      await this.getUserMedia();
      
      // Setup peer connection
      this.setupPeerConnection();
      
      // Join the call room using proper socket event
      if (this.socket.socket && this.socket.socket.connected) {
        this.socket.socket.emit('join_room', { roomId: this.callId });
        // Don't emit participant-joined separately - the server handles this
      }
      
      // Setup socket listeners
      this.setupSocketListeners();
      
      // If initiator, create offer after room is confirmed joined
      if (this.isInitiator) {
        // Wait for room_joined confirmation before creating offer
        this.socket.on('room_joined', () => {
          setTimeout(() => {
            console.log('🚀 Initiator creating offer after room joined');
            this.createOffer();
          }, 1000); // Shorter delay after room confirmation
        });
      }
      
      // Start connection monitoring
      this.startConnectionMonitoring();
      
      console.log('✅ Simple WebRTC initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize WebRTC:', error);
      this.onError?.(error);
      return false;
    }
  }

  /**
   * Load WebRTC configuration from backend
   */
  async loadWebRTCConfig() {
    try {
      console.log('⚙️ Loading WebRTC configuration...');
      this.webrtcConfig = await webrtcConfigService.getPeerConnectionConfig();
      console.log('✅ WebRTC config loaded:', this.webrtcConfig);
    } catch (error) {
      console.warn('⚠️ Failed to load WebRTC config, using fallback:', error);
      // Fallback configuration
      this.webrtcConfig = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };
    }
  }

  /**
   * Get user media
   */
  async getUserMedia() {
    try {
      console.log('🎥 Getting user media...');
      console.log('📱 Navigator mediaDevices available:', !!navigator.mediaDevices);
      
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      console.log('✅ Got local stream:', this.localStream.id);
      console.log('📺 Stream tracks:', this.localStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled })));
      this.onLocalStream?.(this.localStream);
      
      return this.localStream;
    } catch (error) {
      console.error('❌ Failed to get user media:', error);
      console.error('❌ Error details:', error.name, error.message);
      throw error;
    }
  }

  /**
   * Setup peer connection
   */
  setupPeerConnection() {
    console.log('🔗 Setting up peer connection...');
    console.log('⚙️ Using WebRTC config:', this.webrtcConfig);
    
    this.peerConnection = new RTCPeerConnection(this.webrtcConfig);
    
    // Add local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }
    
    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('📺 Received remote stream:', event);
      console.log('📺 Event streams:', event.streams);
      console.log('📺 Event track:', event.track);
      
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        console.log('✅ Remote stream set:', this.remoteStream.id);
        console.log('📺 Remote stream tracks:', this.remoteStream.getTracks());
        this.onRemoteStream?.(this.remoteStream);
      } else {
        console.warn('⚠️ No streams in track event');
      }
    };
    
    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 Sending ICE candidate');
        if (this.socket.socket && this.socket.socket.connected) {
          this.socket.socket.emit('ice-candidate', {
            callId: this.callId,
            candidate: event.candidate
          });
        }
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
    
    // Room management events
    this.socket.on('room_joined', (data) => {
      console.log('✅ Successfully joined room:', data);
      console.log('👥 Participant count:', data.participantCount);
    });
    
    this.socket.on('participant-joined', (data) => {
      console.log('👤 Participant joined:', data);
      console.log('👥 New participant count:', data.participantCount);
      
      // If we're the initiator and someone else joins, create an offer
      if (this.isInitiator && data.participantId !== this.socket.socket?.id) {
        console.log('🚀 Initiator creating offer for new participant');
        setTimeout(() => {
          this.createOffer();
        }, 1000);
      }
    });
    
    // Use socketService event system
    this.socket.on('offer', async (data) => {
      console.log('📥 Received offer:', data);
      if (data.offer) {
        await this.handleOffer(data.offer);
      } else {
        console.error('❌ No offer in data:', data);
      }
    });
    
    this.socket.on('answer', async (data) => {
      console.log('📥 Received answer:', data);
      if (data.answer) {
        await this.handleAnswer(data.answer);
      } else {
        console.error('❌ No answer in data:', data);
      }
    });
    
    this.socket.on('ice-candidate', async (data) => {
      console.log('🧊 Received ICE candidate:', data);
      if (data.candidate) {
        await this.handleIceCandidate(data.candidate);
      } else {
        console.error('❌ No candidate in data:', data);
      }
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
      
      if (this.socket.socket && this.socket.socket.connected) {
        this.socket.socket.emit('offer', {
          callId: this.callId,
          offer: offer
        });
      }
      
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
      
      if (this.socket.socket && this.socket.socket.connected) {
        this.socket.socket.emit('answer', {
          callId: this.callId,
          answer: answer
        });
      }
      
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
    
    // Stop connection monitoring
    this.stopConnectionMonitoring();
    
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
      this.socket.off('room_joined');
      this.socket.off('participant-joined');
    }
    
    console.log('✅ Call ended');
  }

  /**
   * Monitor connection quality
   */
  startConnectionMonitoring() {
    if (this.connectionMonitorInterval) {
      clearInterval(this.connectionMonitorInterval);
    }
    
    this.connectionMonitorInterval = setInterval(async () => {
      if (this.peerConnection) {
        try {
          const stats = await this.peerConnection.getStats();
          this.analyzeConnectionStats(stats);
        } catch (error) {
          console.warn('⚠️ Failed to get connection stats:', error);
        }
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Analyze connection statistics
   */
  analyzeConnectionStats(stats) {
    let inboundRtp = null;
    
    stats.forEach(report => {
      if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
        inboundRtp = report;
      }
    });
    
    if (inboundRtp) {
      const packetsLost = inboundRtp.packetsLost || 0;
      const packetsReceived = inboundRtp.packetsReceived || 0;
      const lossRate = packetsReceived > 0 ? (packetsLost / packetsReceived) * 100 : 0;
      
      if (lossRate > 5) {
        console.warn(`⚠️ High packet loss detected: ${lossRate.toFixed(2)}%`);
      }
    }
  }

  /**
   * Stop connection monitoring
   */
  stopConnectionMonitoring() {
    if (this.connectionMonitorInterval) {
      clearInterval(this.connectionMonitorInterval);
      this.connectionMonitorInterval = null;
    }
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
