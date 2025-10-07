import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socket';
import simpleWebRTC from '../services/simpleWebRTC';
import VideoStream from '../components/video/VideoStream';
import VideoCallControls from '../components/video/VideoCallControls';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  PhoneXMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const VideoCall = () => {
  console.log('🎬 VideoCall component loaded!');
  
  const { callId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  console.log('📋 VideoCall params:', { callId, searchParams: Object.fromEntries(searchParams) });

  // Call state
  const [callState, setCallState] = useState('connecting'); // connecting, connected, ended, failed
  const [participants, setParticipants] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  
  // Call controls state
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [mainStreamId, setMainStreamId] = useState(null);

  // WebRTC references
  const peerConnections = useRef(new Map());
  const localStreamRef = useRef(null);
  const callStartTime = useRef(null);
  const durationInterval = useRef(null);

  // Call type and target from URL params
  const callType = searchParams.get('type') || 'video';
  const targetId = searchParams.get('target');
  const isRoomCall = searchParams.get('room') === 'true';

  useEffect(() => {
    console.log('🔄 VideoCall useEffect triggered:', { user: !!user, callId });
    
    if (user && callId) {
      console.log('✅ Starting call initialization...');
      initializeCall();
    } else {
      console.log('⚠️ Missing user or callId:', { user: !!user, callId });
    }

    return () => {
      console.log('🧹 VideoCall cleanup triggered');
      cleanupCall();
    };
  }, [user, callId]);

  // Duration timer
  useEffect(() => {
    if (callState === 'connected' && !durationInterval.current) {
      callStartTime.current = Date.now();
      durationInterval.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
      }, 1000);
    }

    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
    };
  }, [callState]);

  const initializeCall = async () => {
    try {
      console.log('🚀 Initializing simple video call:', callId);
      console.log('📊 Socket status:', socketService.getConnectionStatus());
      console.log('👤 User:', user);
      
      // Determine if this user is the initiator
      const isInitiator = callId === 'new' || searchParams.get('initiator') === 'true';
      console.log('🔍 Initiator check:', { 
        callId, 
        isNew: callId === 'new', 
        initiatorParam: searchParams.get('initiator'), 
        isInitiator 
      });
      
      // Setup simple WebRTC callbacks
      simpleWebRTC.onLocalStream = (stream) => {
        console.log('📺 Got local stream');
        setLocalStream(stream);
        localStreamRef.current = stream;
      };
      
      simpleWebRTC.onRemoteStream = (stream) => {
        console.log('📺 Got remote stream');
        setRemoteStreams(new Map([['remote', stream]]));
        setCallState('connected');
        toast.success('Connected to call!');
      };
      
      simpleWebRTC.onConnectionChange = (state) => {
        console.log('🔄 Connection state:', state);
        if (state === 'connected') {
          setCallState('connected');
        } else if (state === 'failed') {
          setCallState('failed');
          toast.error('Connection failed');
        }
      };
      
      simpleWebRTC.onError = (error) => {
        console.error('❌ WebRTC error:', error);
        toast.error('Connection error: ' + error.message);
        setCallState('failed');
      };

      // Initialize simple WebRTC
      const success = await simpleWebRTC.initialize(socketService, callId, isInitiator, user?.id);
      if (!success) {
        throw new Error('Failed to initialize WebRTC');
      }
      
      // Set up additional socket listeners for UI updates
      socketService.on('participant-joined', (data) => {
        console.log('🎬 UI: Participant joined:', data);
        if (data.participantInfo && data.participantId !== user?.id) {
          setParticipants(prev => {
            const exists = prev.find(p => p.id === data.participantId);
            if (!exists) {
              return [...prev, data.participantInfo];
            }
            return prev;
          });
        }
      });
      
      socketService.on('participant-left', (data) => {
        console.log('🎬 UI: Participant left:', data);
        if (data.participantId) {
          setParticipants(prev => prev.filter(p => p.id !== data.participantId));
          setRemoteStreams(prev => {
            const newStreams = new Map(prev);
            newStreams.delete(data.participantId);
            return newStreams;
          });
        }
      });
      
      console.log('✅ Simple WebRTC initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize call:', error);
      
      let errorMessage = 'Failed to access camera/microphone. Please check permissions.';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera/microphone access denied. Please allow permissions and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera/microphone found. Please connect a device.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera/microphone is being used by another application.';
      }
      
      setCallState('failed');
      toast.error(errorMessage);
    }
  };

  const initiateCall = () => {
    try {
      if (!socketService.getConnectionStatus()) {
        setCallState('failed');
        toast.error('Not connected to server. Please check your connection.');
        return;
      }

      if (isRoomCall) {
        socketService.initiateCall(null, callType, targetId);
      } else {
        socketService.initiateCall(targetId, callType);
      }
      setCallState('connecting');
    } catch (error) {
      console.error('Failed to initiate call:', error);
      setCallState('failed');
      toast.error('Failed to initiate call');
    }
  };

  const joinCall = () => {
    try {
      if (!socketService.getConnectionStatus()) {
        setCallState('failed');
        toast.error('Not connected to server. Please check your connection.');
        return;
      }

      socketService.joinRoom(callId);
      setCallState('connecting');
    } catch (error) {
      console.error('Failed to join call:', error);
      setCallState('failed');
      toast.error('Failed to join call');
    }
  };

  const setupSocketListeners = () => {
    // WebRTC signaling events are handled by webrtcService
    // We only need to handle call management events here
    socketService.on('call_initiated', handleCallInitiated);
    socketService.on('call_ended', handleCallEnded);
    
    // Participant events for UI updates
    socketService.on('participant-joined', (data) => {
      console.log('👤 Participant joined:', data);
      const { participantId, participantInfo } = data;
      if (participantId && participantInfo && participantId !== user?.id) { // Don't add ourselves
        setParticipants(prev => {
          if (!prev.find(p => p && p.id === participantId)) {
            return [...prev, participantInfo];
          }
          return prev;
        });
      }
    });
    
    socketService.on('participant-left', (data) => {
      console.log('👋 Participant left:', data);
      const { participantId } = data;
      if (participantId) {
        setParticipants(prev => prev.filter(p => p && p.id !== participantId));
      }
    });

    return () => {
      socketService.off('call_initiated', handleCallInitiated);
      socketService.off('call_ended', handleCallEnded);
      socketService.off('participant-joined');
      socketService.off('participant-left');
    };
  };

  const handleCallInitiated = (data) => {
    setCallState('connected');
    setParticipants(data.participants || []);
  };

  const handleParticipantJoined = async (data) => {
    const { participantId, participantInfo } = data;
    setParticipants(prev => [...prev, participantInfo]);
    
    // Create peer connection for new participant
    await createPeerConnection(participantId);
  };

  const handleParticipantLeft = (data) => {
    const { participantId } = data;
    setParticipants(prev => prev.filter(p => p.id !== participantId));
    
    // Clean up peer connection
    const pc = peerConnections.current.get(participantId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(participantId);
    }
    
    // Remove remote stream
    setRemoteStreams(prev => {
      const newStreams = new Map(prev);
      newStreams.delete(participantId);
      return newStreams;
    });
  };

  const handleCallEnded = () => {
    setCallState('ended');
    toast.info('Call ended');
    setTimeout(() => navigate('/dashboard'), 2000);
  };

  const createPeerConnection = async (participantId) => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const pc = new RTCPeerConnection(configuration);
    peerConnections.current.set(participantId, pc);

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStreams(prev => new Map(prev.set(participantId, remoteStream)));
      
      if (!mainStreamId) {
        setMainStreamId(participantId);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.sendICECandidate(participantId, event.candidate);
      }
    };

    return pc;
  };

  const handleWebRTCOffer = async (data) => {
    const { fromParticipant, offer } = data;
    const pc = await createPeerConnection(fromParticipant);
    
    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    socketService.sendWebRTCAnswer(fromParticipant, answer);
  };

  const handleWebRTCAnswer = async (data) => {
    const { fromParticipant, answer } = data;
    const pc = peerConnections.current.get(fromParticipant);
    
    if (pc) {
      await pc.setRemoteDescription(answer);
    }
  };

  const handleICECandidate = async (data) => {
    const { fromParticipant, candidate } = data;
    const pc = peerConnections.current.get(fromParticipant);
    
    if (pc) {
      await pc.addIceCandidate(candidate);
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        // Start screen sharing
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
        const audioTrack = screenStream.getAudioTracks()[0];

        // Store original camera stream
        const originalVideoTrack = localStreamRef.current?.getVideoTracks()[0];
        
        // Replace video track in all peer connections
        const replacePromises = [];
        peerConnections.current.forEach(pc => {
          const videoSender = pc.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (videoSender && videoTrack) {
            replacePromises.push(videoSender.replaceTrack(videoTrack));
          }

          // Add audio track if available
          if (audioTrack) {
            const audioSender = pc.getSenders().find(s => 
              s.track && s.track.kind === 'audio'
            );
            if (!audioSender) {
              pc.addTrack(audioTrack, screenStream);
            }
          }
        });

        await Promise.all(replacePromises);
        
        // Update local stream for UI
        const newLocalStream = new MediaStream();
        newLocalStream.addTrack(videoTrack);
        if (localStreamRef.current?.getAudioTracks()[0]) {
          newLocalStream.addTrack(localStreamRef.current.getAudioTracks()[0]);
        }
        setLocalStream(newLocalStream);
        
        setIsScreenSharing(true);
        toast.success('Screen sharing started');
        
        // Notify other participants about screen sharing
        if (callId && callId !== 'new') {
          socketService.notifyScreenShareStart(callId, user?.id);
        }
        
        // Listen for screen share end (user clicks "Stop sharing" in browser)
        videoTrack.onended = async () => {
          await stopScreenSharing(originalVideoTrack);
        };
      } else {
        // Stop screen sharing
        await stopScreenSharing();
      }
    } catch (error) {
      console.error('Screen share error:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Screen sharing permission denied');
      } else if (error.name === 'NotSupportedError') {
        toast.error('Screen sharing not supported in this browser');
      } else {
        toast.error('Failed to share screen');
      }
    }
  };

  const stopScreenSharing = async (originalVideoTrack = null) => {
    try {
      // Get the original camera track or create new one
      let cameraTrack = originalVideoTrack;
      if (!cameraTrack || cameraTrack.readyState === 'ended') {
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        cameraTrack = cameraStream.getVideoTracks()[0];
      }

      // Replace screen share track with camera track in all peer connections
      const replacePromises = [];
      peerConnections.current.forEach(pc => {
        const videoSender = pc.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        if (videoSender && cameraTrack) {
          replacePromises.push(videoSender.replaceTrack(cameraTrack));
        }
      });

      await Promise.all(replacePromises);
      
      // Update local stream
      const newLocalStream = new MediaStream();
      newLocalStream.addTrack(cameraTrack);
      if (localStreamRef.current?.getAudioTracks()[0]) {
        newLocalStream.addTrack(localStreamRef.current.getAudioTracks()[0]);
      }
      
      // Stop current screen sharing tracks
      if (localStream) {
        localStream.getVideoTracks().forEach(track => {
          if (track.label.includes('screen') || track.kind === 'video') {
            track.stop();
          }
        });
      }
      
      setLocalStream(newLocalStream);
      localStreamRef.current = newLocalStream;
      setIsScreenSharing(false);
      
      // Notify other participants about screen sharing stop
      if (callId && callId !== 'new') {
        socketService.notifyScreenShareStop(callId, user?.id);
      }
      
      toast.success('Screen sharing stopped');
    } catch (error) {
      console.error('Error stopping screen share:', error);
      setIsScreenSharing(false);
      toast.error('Error stopping screen share');
    }
  };

  const endCall = async () => {
    try {
      setCallState('ending');
      
      // Notify server about call end
      if (socketService.getConnectionStatus() && callId && callId !== 'new') {
        socketService.endCall(callId);
      }
      
      // Send notification to other participants
      participants.forEach(participant => {
        if (participant.id !== user?.id) {
          socketService.emit('call_participant_left', {
            callId,
            participantId: user?.id,
            reason: 'ended_by_user'
          });
        }
      });
      
      toast.success('Call ended');
    } catch (error) {
      console.error('Error ending call:', error);
      toast.error('Error ending call');
    } finally {
      // Always cleanup and navigate
      await cleanupCall();
      setCallState('ended');
      
      // Navigate after a short delay to show the ended state
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    }
  };

  const cleanupCall = async () => {
    try {
      console.log('🧹 Cleaning up call...');
      
      // Use simple WebRTC to clean up everything
      simpleWebRTC.endCall();
      
      // Clear local state
      setLocalStream(null);
      setRemoteStreams(new Map());
      setParticipants([]);
      localStreamRef.current = null;

      console.log('✅ Call cleanup completed');
    } catch (error) {
      console.error('❌ Error during call cleanup:', error);
    }
  };

  // Control handlers
  const handleToggleAudio = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    simpleWebRTC.toggleAudio(newState);
  };

  const handleToggleVideo = () => {
    const newState = !isVideoEnabled;
    setIsVideoEnabled(newState);
    simpleWebRTC.toggleVideo(newState);
  };

  const handleToggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    toast.info('Screen sharing not yet implemented');
  };

  const handleToggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  const handleToggleChat = () => {
    toast.info('Chat not yet implemented');
  };

  const handleStreamClick = (streamId) => {
    setMainStreamId(streamId);
  };

  if (callState === 'failed') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">Call Failed</h2>
          <p className="text-gray-300 mb-6">Unable to start the call. Please check your camera and microphone permissions.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (callState === 'ended' || callState === 'ending') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <PhoneXMarkIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">Call Ended</h2>
          <p className="text-gray-300 mb-6">The call has ended. You will be redirected shortly.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {callState === 'connecting' && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center text-white">
            <LoadingSpinner size="lg" color="white" />
            <p className="mt-4 text-lg">Connecting to call...</p>
          </div>
        </div>
      )}

      {/* Video layout - Responsive */}
      <div className="h-screen flex flex-col lg:flex-row">
        {/* Main video area */}
        <div className="flex-1 relative">
          {mainStreamId && remoteStreams.has(mainStreamId) ? (
            <VideoStream
              stream={remoteStreams.get(mainStreamId)}
              isLocal={false}
              isVideoEnabled={true}
              isAudioEnabled={true}
              participantName={participants.find(p => p.id === mainStreamId)?.name}
              participantId={mainStreamId}
              isMainStream={true}
              className="w-full h-full"
            />
          ) : localStream ? (
            <VideoStream
              stream={localStream}
              isLocal={true}
              isVideoEnabled={isVideoEnabled}
              isAudioEnabled={isAudioEnabled}
              participantName={user?.name}
              participantId="local"
              isMainStream={true}
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <LoadingSpinner size="lg" color="white" />
            </div>
          )}
          
          {/* Mobile: Floating participant thumbnails */}
          <div className="lg:hidden absolute top-4 right-4 space-y-2 z-10">
            {/* Local stream thumbnail for mobile */}
            {localStream && mainStreamId !== 'local' && (
              <VideoStream
                stream={localStream}
                isLocal={true}
                isVideoEnabled={isVideoEnabled}
                isAudioEnabled={isAudioEnabled}
                participantName={user?.name}
                participantId="local"
                onStreamClick={handleStreamClick}
                className="w-20 h-28 sm:w-24 sm:h-32 rounded-lg shadow-lg border-2 border-white/20"
              />
            )}

            {/* Remote stream thumbnails for mobile */}
            {Array.from(remoteStreams.entries()).map(([participantId, stream]) => {
              if (participantId === mainStreamId) return null;
              
              const participant = participants.find(p => p && p.id === participantId);
              return (
                <VideoStream
                  key={participantId}
                  stream={stream}
                  isLocal={false}
                  isVideoEnabled={true}
                  isAudioEnabled={true}
                  participantName={participant?.name || `Participant ${participantId}`}
                  participantId={participantId}
                  onStreamClick={handleStreamClick}
                  className="w-20 h-28 sm:w-24 sm:h-32 rounded-lg shadow-lg border-2 border-white/20"
                />
              );
            })}
          </div>
        </div>

        {/* Desktop: Side panel for additional participants */}
        {(participants.length > 0 || localStream) && (
          <div className="hidden lg:block w-80 bg-gray-800 p-4 space-y-4 overflow-y-auto">
            <h3 className="text-white font-medium mb-4">
              Participants ({(participants?.length || 0) + 1})
            </h3>
            
            {/* Local stream thumbnail */}
            {localStream && mainStreamId !== 'local' && (
              <VideoStream
                stream={localStream}
                isLocal={true}
                isVideoEnabled={isVideoEnabled}
                isAudioEnabled={isAudioEnabled}
                participantName={user?.name}
                participantId="local"
                onStreamClick={handleStreamClick}
                className="w-full h-32"
              />
            )}

            {/* Remote stream thumbnails */}
            {Array.from(remoteStreams.entries()).map(([participantId, stream]) => {
              if (participantId === mainStreamId) return null;
              
              const participant = participants.find(p => p && p.id === participantId);
              return (
                <VideoStream
                  key={participantId}
                  stream={stream}
                  isLocal={false}
                  isVideoEnabled={true}
                  isAudioEnabled={true}
                  participantName={participant?.name || `Participant ${participantId}`}
                  participantId={participantId}
                  onStreamClick={handleStreamClick}
                  className="w-full h-32"
                />
              );
            })}
          </div>
        )}

        {/* Chat panel */}
        {showChat && (
          <div className="w-80 bg-white border-l border-gray-200">
            <div className="p-4 border-b">
              <h3 className="font-medium">Call Chat</h3>
            </div>
            <div className="flex-1 p-4">
              <p className="text-gray-500 text-sm">Chat feature coming soon...</p>
            </div>
          </div>
        )}
      </div>

      {/* Call controls */}
      <VideoCallControls
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
        isSpeakerOn={isSpeakerOn}
        onToggleAudio={handleToggleAudio}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onToggleSpeaker={handleToggleSpeaker}
        onEndCall={endCall}
        onToggleChat={handleToggleChat}
        callDuration={callDuration}
        participantCount={(participants?.length || 0) + 1}
      />
    </div>
  );
};

export default VideoCall;