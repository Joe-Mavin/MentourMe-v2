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
   * Get user media with mobile-specific handling
   */
  async getUserMedia() {
    try {
      console.log('🎥 Getting user media...');
      console.log('📱 Navigator mediaDevices available:', !!navigator.mediaDevices);
      console.log('📱 User agent:', navigator.userAgent);
      
      // Mobile-specific constraints
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      console.log('📱 Is mobile device:', isMobile);
      
      const constraints = {
        video: isMobile ? {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 15, max: 30 },
          facingMode: 'user' // Front camera for mobile
        } : {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };
      
      console.log('🎥 Using constraints:', constraints);
      
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('✅ Got local stream:', this.localStream.id);
      console.log('📺 Stream tracks:', this.localStream.getTracks().map(t => ({ 
        kind: t.kind, 
        enabled: t.enabled,
        readyState: t.readyState,
        label: t.label 
      })));
      this.onLocalStream?.(this.localStream);
      
      return this.localStream;
    } catch (error) {
      console.error('❌ Failed to get user media:', error);
      console.error('❌ Error details:', error.name, error.message);
      
      // Try fallback with audio only if video fails
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        console.warn('🔄 Camera permission denied, trying audio-only fallback...');
        
        // Notify user about camera permission issue
        this.onError?.({
          type: 'camera_permission_denied',
          message: 'Camera access denied. Continuing with audio only.',
          originalError: error
        });
        
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({ 
            video: false, 
            audio: true 
          });
          console.log('✅ Got audio-only stream:', this.localStream.id);
          this.onLocalStream?.(this.localStream);
          return this.localStream;
        } catch (audioError) {
          console.error('❌ Audio-only fallback also failed:', audioError);
          this.onError?.({
            type: 'media_access_failed',
            message: 'Unable to access camera or microphone. Please check permissions.',
            originalError: audioError
          });
        }
      }
      
      // Try with minimal constraints as last resort
      if (error.name === 'OverconstrainedError' || error.name === 'NotSupportedError') {
        console.warn('🔄 Constraints too strict, trying minimal constraints...');
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 320, height: 240 }, 
            audio: true 
          });
          console.log('✅ Got minimal stream:', this.localStream.id);
          this.onLocalStream?.(this.localStream);
          return this.localStream;
        } catch (minimalError) {
          console.error('❌ Minimal constraints also failed:', minimalError);
        }
      }
      
      throw error;
    }
  }

  /**
   * Ensure local media is available before creating peer connections
   */
  async ensureLocalMedia() {
    if (!this.localStream) {
      console.log('🔄 No local stream available, getting media first...');
      await this.getUserMedia();
    } else {
      console.log('✅ Local stream already available:', this.localStream.id);
    }
    return this.localStream;
  }

  /**
   * Log comprehensive WebRTC status for debugging
   */
  logWebRTCStatus(context = 'Status Check') {
    console.log(`🔍 ========== WEBRTC STATUS: ${context} ==========`);
    console.log('🔍 User Info:', {
      userId: this.userId,
      callId: this.callId,
      isInitiator: this.isInitiator
    });
    
    console.log('🔍 Connection Status:', {
      peerConnection: !!this.peerConnection,
      signalingState: this.peerConnection?.signalingState,
      connectionState: this.peerConnection?.connectionState,
      iceConnectionState: this.peerConnection?.iceConnectionState,
      iceGatheringState: this.peerConnection?.iceGatheringState
    });
    
    console.log('🔍 Stream Status:', {
      localStream: !!this.localStream,
      remoteStream: !!this.remoteStream,
      localStreamId: this.localStream?.id,
      remoteStreamId: this.remoteStream?.id,
      localTracks: this.localStream?.getTracks().length || 0,
      remoteTracks: this.remoteStream?.getTracks().length || 0
    });
    
    if (this.localStream) {
      console.log('🔍 Local Stream Details:', {
        active: this.localStream.active,
        tracks: this.localStream.getTracks().map(t => ({
          kind: t.kind,
          enabled: t.enabled,
          readyState: t.readyState,
          id: t.id
        }))
      });
    }
    
    if (this.remoteStream) {
      console.log('🔍 Remote Stream Details:', {
        active: this.remoteStream.active,
        tracks: this.remoteStream.getTracks().map(t => ({
          kind: t.kind,
          enabled: t.enabled,
          readyState: t.readyState,
          id: t.id
        }))
      });
    }
    
    console.log('🔍 Socket Status:', {
      connected: this.socket?.socket?.connected,
      socketId: this.socket?.socket?.id
    });
    
    console.log('🔍 ========================================');
  }

  /**
   * Check stream quality and provide feedback
   */
  checkStreamQuality() {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      const audioTracks = this.localStream.getAudioTracks();
      
      console.log('📊 Local stream quality check:', {
        hasVideo: videoTracks.length > 0,
        hasAudio: audioTracks.length > 0,
        videoEnabled: videoTracks.length > 0 ? videoTracks[0].enabled : false,
        audioEnabled: audioTracks.length > 0 ? audioTracks[0].enabled : false,
        videoSettings: videoTracks.length > 0 ? videoTracks[0].getSettings() : null
      });
      
      // Warn if no video
      if (videoTracks.length === 0) {
        this.onError?.({
          type: 'no_video_track',
          message: 'Video not available - audio only mode',
          severity: 'warning'
        });
      }
    }
  }

  /**
   * Setup peer connection
   */
  setupPeerConnection() {
    console.log('🔗 Setting up peer connection...');
    console.log('⚙️ Using WebRTC config:', this.webrtcConfig);
    console.log('🔗 Local stream available:', !!this.localStream);
    
    this.peerConnection = new RTCPeerConnection(this.webrtcConfig);
    
    // Add local stream with fallback
    if (this.localStream) {
      console.log('🎥 Adding local tracks to peer connection');
      console.log('🎥 Stream tracks:', this.localStream.getTracks().map(t => ({ 
        kind: t.kind, 
        enabled: t.enabled, 
        readyState: t.readyState,
        id: t.id 
      })));
      
      this.localStream.getTracks().forEach(track => {
        console.log('🎥 Adding track:', track.kind, track.enabled, track.readyState);
        this.peerConnection.addTrack(track, this.localStream);
      });
      console.log('🎥 All local tracks added to peer connection');
    } else {
      console.warn('⚠️ No local stream available during peer connection setup');
    }
    
    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('📺 ========== REMOTE STREAM RECEIVED ==========');
      console.log('📺 Event details:', {
        streams: event.streams?.length || 0,
        track: {
          kind: event.track.kind,
          enabled: event.track.enabled,
          readyState: event.track.readyState,
          id: event.track.id,
          label: event.track.label
        }
      });
      
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        console.log('✅ Remote stream set:', {
          id: this.remoteStream.id,
          active: this.remoteStream.active,
          trackCount: this.remoteStream.getTracks().length
        });
        
        const tracks = this.remoteStream.getTracks();
        console.log('📺 Remote stream tracks:', tracks.map(t => ({
          kind: t.kind,
          enabled: t.enabled,
          readyState: t.readyState,
          id: t.id,
          label: t.label
        })));
        
        // Check if we have video tracks
        const videoTracks = tracks.filter(t => t.kind === 'video');
        const audioTracks = tracks.filter(t => t.kind === 'audio');
        console.log('📺 Remote stream composition:', {
          videoTracks: videoTracks.length,
          audioTracks: audioTracks.length,
          hasVideo: videoTracks.length > 0,
          hasAudio: audioTracks.length > 0
        });
        this.onRemoteStream?.(this.remoteStream);
        
        // Log comprehensive status after receiving remote stream
        setTimeout(() => {
          this.logWebRTCStatus('After Remote Stream Received');
        }, 1000);
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
    
    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log('🔄 ========== CONNECTION STATE CHANGE ==========');
      console.log('🔄 Connection state:', this.peerConnection.connectionState);
      console.log('🔄 ICE connection state:', this.peerConnection.iceConnectionState);
      console.log('🔄 ICE gathering state:', this.peerConnection.iceGatheringState);
      console.log('🔄 Signaling state:', this.peerConnection.signalingState);
      
      // Log current streams
      console.log('🔄 Current streams status:', {
        localStream: !!this.localStream,
        remoteStream: !!this.remoteStream,
        localTracks: this.localStream?.getTracks().length || 0,
        remoteTracks: this.remoteStream?.getTracks().length || 0
      });
      
      this.onConnectionChange?.(this.peerConnection.connectionState);
    };
    
    // Handle ICE connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state changed:', this.peerConnection.iceConnectionState);
    };
    
    console.log('✅ Peer connection setup complete');
  }

  /**
   * Setup socket listeners
   */
  setupSocketListeners() {
    console.log('🔌 Setting up socket listeners...');
    console.log('🔌 Socket object:', this.socket);
    console.log('🔌 Socket connected:', this.socket?.socket?.connected);
    
    // Room management events
    this.socket.on('room_joined', (data) => {
      console.log('✅ Successfully joined room:', data);
      console.log('👥 Participant count:', data.participantCount);
    });
    
    // Listen for both types of participant events
    this.socket.on('call_participant_joined', async (data) => {
      console.log('🎉 RECEIVED call_participant_joined event:', data);
      await this.handleParticipantJoined(data);
    });
    
    this.socket.on('participant-joined', async (data) => {
      console.log('🎉 RECEIVED participant-joined event:', data);
      await this.handleParticipantJoined(data);
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
      console.log('📤 Local stream status:', !!this.localStream);
      
      // Ensure we have local media before creating offer
      await this.ensureLocalMedia();
      
      // Check if we already created an offer
      if (this.offerCreated) {
        console.log('⚠️ Offer already created, skipping');
        return;
      }
      
      // Check signaling state
      if (this.peerConnection.signalingState !== 'stable') {
        console.log('⚠️ Not in stable state for offer creation:', this.peerConnection.signalingState);
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
   * Ensure local media is available
   */
  async ensureLocalMedia() {
    if (!this.localStream) {
      console.warn('⚠️ No local stream available, attempting to get media...');
      try {
        await this.getUserMedia();
        
        // Add tracks to existing peer connection if available
        if (this.peerConnection && this.localStream) {
          console.log('🎥 Adding newly acquired tracks to existing peer connection');
          this.localStream.getTracks().forEach(track => {
            console.log('🎥 Adding track:', track.kind, track.enabled, track.readyState);
            this.peerConnection.addTrack(track, this.localStream);
          });
        }
      } catch (error) {
        console.error('❌ Failed to get media for offer handling:', error);
        throw error;
      }
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
      console.log('📥 Current local stream status:', {
        localStream: !!this.localStream,
        peerConnection: !!this.peerConnection
      });
      
      // Ensure we have local media before handling offer
      await this.ensureLocalMedia();
      this.checkStreamQuality();
      this.logWebRTCStatus('Before Handling Offer');
      
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
      
      console.log('📤 ========== CREATING ANSWER ==========');
      const answer = await this.peerConnection.createAnswer();
      console.log('📤 Answer created successfully:', {
        type: answer.type,
        sdp: answer.sdp ? 'Present' : 'Missing'
      });
      
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
      if (this.socket.socket && this.socket.socket.connected) {
        this.socket.socket.emit('answer', {
          answer: answer,
          callId: this.callId
        });
        console.log('📤 Answer sent via socket');
      } else {
        console.error('❌ Socket not connected, cannot send answer');
      }
      
      console.log('✅ ========== OFFER PROCESSING COMPLETE ==========');
      this.logWebRTCStatus('After Answer Sent');
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
      console.log('📥 ========== HANDLING ANSWER ==========');
      console.log('📥 Current signaling state:', this.peerConnection.signalingState);
      console.log('📥 Answer SDP type:', answer.type);
      console.log('📥 Has remote description:', !!this.peerConnection.remoteDescription);
      console.log('📥 Current streams before answer:', {
        localStream: !!this.localStream,
        remoteStream: !!this.remoteStream,
        localTracks: this.localStream?.getTracks().length || 0,
        remoteTracks: this.remoteStream?.getTracks().length || 0
      });
      
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

  /**
   * Handle participant joined events (both types)
   */
  async handleParticipantJoined(data) {
    console.log('👥 Participant joined - data:', data);
    console.log('🔍 Initiator status check:', {
      userId: this.userId,
      isInitiator: this.isInitiator,
      participantCount: data.participantCount,
      participantId: data.participantId,
      shouldCreateOffer: this.isInitiator && data.participantCount === 2
    });
    
    // If we're the initiator and this is the first participant to join, create offer
    if (this.isInitiator && data.participantCount === 2) {
      console.log('🚀 Creating offer for new participant...');
      console.log('⏳ Waiting for participant media setup...');
      
      // Wait for the new participant to set up their media
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Ensure our own media is ready too
      await this.ensureLocalMedia();
      this.checkStreamQuality();
      this.logWebRTCStatus('Before Creating Offer');
      
      console.log('📤 About to create offer...');
      this.createOffer();
    } else {
      console.log('⏸️ Not creating offer:', {
        reason: !this.isInitiator ? 'Not initiator' : 'Wrong participant count',
        isInitiator: this.isInitiator,
        participantCount: data.participantCount
      });
    }
  }

  /**
   * Cleanup method to stop all media tracks and close connections
   */
  cleanup() {
    console.log('🧹 ========== CLEANING UP WEBRTC ==========');
    
    // Stop all local media tracks
    if (this.localStream) {
      console.log('🛑 Stopping local media tracks...');
      this.localStream.getTracks().forEach(track => {
        console.log(`🛑 Stopping ${track.kind} track:`, track.label);
        track.stop();
      });
      this.localStream = null;
      console.log('✅ Local stream cleaned up');
    }
    
    // Stop all remote media tracks
    if (this.remoteStream) {
      console.log('🛑 Stopping remote media tracks...');
      this.remoteStream.getTracks().forEach(track => {
        console.log(`🛑 Stopping remote ${track.kind} track:`, track.label);
        track.stop();
      });
      this.remoteStream = null;
      console.log('✅ Remote stream cleaned up');
    }
    
    // Close peer connection
    if (this.peerConnection) {
      console.log('🛑 Closing peer connection...');
      this.peerConnection.close();
      this.peerConnection = null;
      console.log('✅ Peer connection closed');
    }
    
    // Reset flags
    this.isProcessingOffer = false;
    this.isProcessingAnswer = false;
    this.offerCreated = false;
    
    console.log('✅ ========== CLEANUP COMPLETE ==========');
  }

  /**
   * End call and cleanup resources
   */
  endCall() {
    console.log('📞 Ending call and cleaning up...');
    this.cleanup();
    
    // Emit end call event if socket is connected
    if (this.socket?.socket?.connected && this.callId) {
      this.socket.socket.emit('end_call', {
        callId: this.callId,
        reason: 'user_ended',
        timestamp: new Date().toISOString()
      });
      console.log('📤 End call event sent');
    }
  }
}

// Create singleton
const simpleWebRTC = new SimpleWebRTC();
export default simpleWebRTC;
