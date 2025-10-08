import webrtcConfigService from './webrtcConfig';

/**
 * Simple WebRTC Service - Minimal, reliable implementation
 */
class SimpleWebRTC {
  constructor() {
    this.localStream = null;
    this.peerConnection = null;
    this.socket = null;
    this.callId = null;
    this.isInitialized = false;
    this.webrtcConfig = null;
    this.originalVideoTrack = null; // Store original camera track for screen sharing
    this.isProcessingOffer = false; // Prevent concurrent offer processing
    this.isProcessingAnswer = false; // Prevent concurrent answer processing
    
    // Callbacks
    this.onLocalStream = null;
    this.onRemoteStream = null;
    this.onConnectionChange = null;
    this.onError = null;
  }

  /**
   * Initialize the WebRTC connection
   */
  async initialize(socket, callId, isInitiator, userId = null) {
    try {
      console.log('🚀 Initializing Simple WebRTC:', { callId, isInitiator });
      console.log('🔌 Socket service:', socket);
      console.log('📊 Socket connected:', socket?.getConnectionStatus());
      
      this.socket = socket;
      this.callId = callId;
      this.isInitiator = isInitiator;
      this.userId = userId;
      
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
      
      // Offer creation will be handled by participant-joined event
      
      // Start connection monitoring
      this.startConnectionMonitoring();
      
      console.log('✅ Simple WebRTC initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize WebRTC:', error);
      
      // Handle specific error types
      if (error.name === 'NotAllowedError') {
        console.error('❌ Camera/microphone permission denied');
      } else if (error.name === 'NotFoundError') {
        console.error('❌ No camera/microphone found');
      } else if (error.message && error.message.includes('message channel')) {
        console.warn('⚠️ Browser extension conflict detected, continuing...');
        // Don't treat extension conflicts as fatal errors
        return true;
      }
      
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
    
    this.socket.on('call_participant_joined', (data) => {
      console.log('👤 Call participant joined:', data);
      console.log('👥 New participant count:', data.participantCount);
      console.log('🔍 Checking: isInitiator =', this.isInitiator, 'participantId =', data.participantId, 'myUserId =', this.userId);
      
      // If we're the initiator and someone else joins, create an offer
      if (this.isInitiator && data.participantId !== this.userId) {
        console.log('🚀 Initiator creating offer for new participant');
        setTimeout(() => {
          this.createOffer();
        }, 1000);
      } else {
        console.log('⏸️ Not creating offer - isInitiator:', this.isInitiator, 'same user:', data.participantId === this.userId);
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
    // Prevent concurrent offer processing
    if (this.isProcessingOffer) {
      console.log('⚠️ Already processing an offer, ignoring duplicate');
      return;
    }
    
    this.isProcessingOffer = true;
    
    try {
      console.log('📥 Handling offer...', 'Current state:', this.peerConnection.signalingState);
      
      if (!this.peerConnection) {
        console.error('❌ No peer connection available');
        return;
      }
      
      if (this.peerConnection.remoteDescription) {
        console.log('⚠️ Already have remote description, ignoring offer');
        return;
      }
      
      // Only accept offers in stable or have-local-offer state
      if (this.peerConnection.signalingState !== 'stable' && this.peerConnection.signalingState !== 'have-local-offer') {
        console.log('⚠️ Invalid signaling state for offer:', this.peerConnection.signalingState, 'Waiting...');
        
        // Wait a bit and retry if in wrong state
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (this.peerConnection.signalingState !== 'stable' && this.peerConnection.signalingState !== 'have-local-offer') {
          console.log('⚠️ Still in wrong state, skipping offer');
          return;
        }
      }
      
      await this.peerConnection.setRemoteDescription(offer);
      console.log('✅ Remote description set');
      
      // Check state before creating answer
      if (this.peerConnection.signalingState !== 'have-remote-offer') {
        console.log('⚠️ Not in correct state for creating answer:', this.peerConnection.signalingState);
        return;
      }
      
      const answer = await this.peerConnection.createAnswer();
      
      // Check state again before setting local description
      const currentState = this.peerConnection.signalingState;
      if (currentState !== 'have-remote-offer') {
        console.log('⚠️ State changed before setting local description:', currentState);
        
        // If we're in stable state, it means the connection was already established
        if (currentState === 'stable') {
          console.log('✅ Connection already in stable state, skipping answer');
          return;
        }
        
        // For other states, wait a bit and check again
        await new Promise(resolve => setTimeout(resolve, 50));
        const newState = this.peerConnection.signalingState;
        
        if (newState !== 'have-remote-offer') {
          console.log('⚠️ Still in wrong state after wait:', newState, 'Aborting answer');
          return;
        }
      }
      
      // Double-check state right before setting local description
      if (this.peerConnection.signalingState === 'have-remote-offer') {
        await this.peerConnection.setLocalDescription(answer);
      } else {
        console.log('⚠️ State changed at last moment:', this.peerConnection.signalingState, 'Skipping setLocalDescription');
        return;
      }
      console.log('✅ Answer created and set as local description');
      
      // Send answer back
      this.socket.emit('answer', {
        answer: answer,
        callId: this.callId
      });
      
      console.log('✅ Offer processed and answer sent');
    } catch (error) {
      console.error('❌ Failed to handle offer:', error);
      this.onError?.(error);
    } finally {
      this.isProcessingOffer = false;
    }
  }

  /**
   * Handle incoming answer
   */
  async handleAnswer(answer) {
    // Prevent concurrent answer processing
    if (this.isProcessingAnswer) {
      console.log('⚠️ Already processing an answer, ignoring duplicate');
      return;
    }
    
    this.isProcessingAnswer = true;
    
    try {
      console.log('📥 Handling answer...', 'Current state:', this.peerConnection.signalingState);
      
      // Check if we already have a remote description
      if (this.peerConnection.remoteDescription) {
        console.log('⚠️ Already have remote description, ignoring answer');
        return;
      }
      
      // Only accept answers in have-local-offer state
      if (this.peerConnection.signalingState !== 'have-local-offer') {
        console.log('⚠️ Invalid signaling state for answer:', this.peerConnection.signalingState, 'Expected: have-local-offer');
        
        // If we're in stable state, it means the connection was already established
        if (this.peerConnection.signalingState === 'stable') {
          console.log('✅ Connection already established, ignoring answer');
          return;
        }
        
        // Wait a bit and check again
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (this.peerConnection.signalingState !== 'have-local-offer') {
          console.log('⚠️ Still in wrong state, skipping answer');
          return;
        }
      }
      
      await this.peerConnection.setRemoteDescription(answer);
      console.log('✅ Answer processed, connection should be established');
    } catch (error) {
      console.error('❌ Failed to handle answer:', error);
      
      // Don't treat this as a fatal error if we're already in stable state
      if (error.message.includes('stable')) {
        console.log('ℹ️ Connection already stable, ignoring error');
        return;
      }
      
      this.onError?.(error);
    } finally {
      this.isProcessingAnswer = false;
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

  /**
   * Start screen sharing
   */
  async startScreenShare() {
    try {
      console.log('🖥️ Starting screen share...');
      
      // Check if getDisplayMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen sharing is not supported in this browser');
      }
      
      // Use direct call to avoid context binding issues
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          width: { max: 1920 },
          height: { max: 1080 },
          frameRate: { max: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      const videoTrack = screenStream.getVideoTracks()[0];
      
      // Store original video track for later restoration
      this.originalVideoTrack = this.localStream?.getVideoTracks()[0];
      
      // Replace video track in peer connection
      if (this.peerConnection) {
        const videoSender = this.peerConnection.getSenders().find(sender => 
          sender.track && sender.track.kind === 'video'
        );
        
        if (videoSender) {
          await videoSender.replaceTrack(videoTrack);
          console.log('✅ Video track replaced with screen share');
        }
      }

      // Update local stream
      if (this.localStream) {
        // Remove old video track
        const oldVideoTrack = this.localStream.getVideoTracks()[0];
        if (oldVideoTrack) {
          this.localStream.removeTrack(oldVideoTrack);
        }
        
        // Add screen share track
        this.localStream.addTrack(videoTrack);
        
        // Notify callback about stream update
        if (this.onLocalStream) {
          this.onLocalStream(this.localStream);
        }
      }

      // Listen for screen share end
      videoTrack.onended = () => {
        console.log('🖥️ Screen share ended by user');
        this.stopScreenShare();
        // Notify about screen sharing state change
        if (this.onScreenShareEnded) {
          this.onScreenShareEnded();
        }
      };

      console.log('✅ Screen sharing started successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to start screen sharing:', error);
      
      // Handle specific screen sharing errors
      if (error.name === 'NotAllowedError') {
        throw new Error('Screen sharing permission denied. Please allow screen sharing and try again.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No screen available for sharing.');
      } else if (error.name === 'NotSupportedError') {
        throw new Error('Screen sharing is not supported in this browser.');
      } else if (error.message && error.message.includes('getDisplayMedia')) {
        throw new Error('Screen sharing API error. Please try refreshing the page.');
      } else if (error.message && error.message.includes('message channel')) {
        console.warn('⚠️ Browser extension conflict during screen sharing, retrying...');
        // Retry once after a short delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              mediaSource: 'screen',
              width: { max: 1920 },
              height: { max: 1080 },
              frameRate: { max: 30 }
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100
            }
          });
          
          // Continue with the same logic as above...
          const videoTrack = screenStream.getVideoTracks()[0];
          this.originalVideoTrack = this.localStream?.getVideoTracks()[0];
          
          if (this.peerConnection) {
            const videoSender = this.peerConnection.getSenders().find(sender => 
              sender.track && sender.track.kind === 'video'
            );
            
            if (videoSender) {
              await videoSender.replaceTrack(videoTrack);
            }
          }

          if (this.localStream) {
            const oldVideoTrack = this.localStream.getVideoTracks()[0];
            if (oldVideoTrack) {
              this.localStream.removeTrack(oldVideoTrack);
            }
            this.localStream.addTrack(videoTrack);
            
            if (this.onLocalStream) {
              this.onLocalStream(this.localStream);
            }
          }

          videoTrack.onended = () => {
            console.log('🖥️ Screen share ended by user');
            this.stopScreenShare();
            if (this.onScreenShareEnded) {
              this.onScreenShareEnded();
            }
          };
          
          console.log('✅ Screen sharing started successfully (after retry)');
          return true;
        } catch (retryError) {
          throw new Error('Screen sharing failed after retry. Please try again.');
        }
      }
      
      throw error;
    }
  }

  /**
   * Stop screen sharing and restore camera
   */
  async stopScreenShare() {
    try {
      console.log('🖥️ Stopping screen share...');
      
      if (!this.originalVideoTrack) {
        // Get camera stream if we don't have the original track
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: false
        });
        this.originalVideoTrack = cameraStream.getVideoTracks()[0];
      }

      // Replace screen share track with camera track in peer connection
      if (this.peerConnection) {
        const videoSender = this.peerConnection.getSenders().find(sender => 
          sender.track && sender.track.kind === 'video'
        );
        
        if (videoSender && this.originalVideoTrack) {
          await videoSender.replaceTrack(this.originalVideoTrack);
          console.log('✅ Video track restored to camera');
        }
      }

      // Update local stream
      if (this.localStream) {
        // Remove screen share track
        const screenTrack = this.localStream.getVideoTracks()[0];
        if (screenTrack) {
          screenTrack.stop();
          this.localStream.removeTrack(screenTrack);
        }
        
        // Add camera track back
        if (this.originalVideoTrack) {
          this.localStream.addTrack(this.originalVideoTrack);
        }
        
        // Notify callback about stream update
        if (this.onLocalStream) {
          this.onLocalStream(this.localStream);
        }
      }

      this.originalVideoTrack = null;
      console.log('✅ Screen sharing stopped successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to stop screen sharing:', error);
      throw error;
    }
  }
}

// Create singleton
const simpleWebRTC = new SimpleWebRTC();
export default simpleWebRTC;
