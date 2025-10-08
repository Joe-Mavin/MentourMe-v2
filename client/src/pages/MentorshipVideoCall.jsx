import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socket';
import VideoStream from '../components/video/VideoStream';
import VideoCallControls from '../components/video/VideoCallControls';
import CallFeedback from '../components/mentorship/CallFeedback';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  PhoneXMarkIcon,
  ExclamationTriangleIcon,
  UserIcon,
  ClockIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { mentorshipAPI } from '../services/api';

const MentorshipVideoCall = () => {
  const { callId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Call state
  const [callState, setCallState] = useState('connecting'); // connecting, connected, ended, failed, feedback
  const [participants, setParticipants] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [mentorship, setMentorship] = useState(null);
  const [callContext, setCallContext] = useState(null);
  
  // Call controls state
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isScreenShareSupported, setIsScreenShareSupported] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [mainStreamId, setMainStreamId] = useState(null);

  // WebRTC references
  const peerConnections = useRef(new Map());
  const localStreamRef = useRef(null);
  const callStartTime = useRef(null);
  const durationInterval = useRef(null);
  const currentUserAdded = useRef(false);

  // Call metadata from URL params
  const userRole = searchParams.get('role');
  const callPurpose = searchParams.get('purpose') || 'general_session';
  const callType = searchParams.get('type') || 'video';

  useEffect(() => {
    initializeCall();
    const cleanupSocketListeners = setupSocketListeners();

    // Global cleanup function to ensure camera is turned off
    const globalCleanup = () => {
      console.log('🧹 EMERGENCY GLOBAL CLEANUP - FORCE STOP ALL MEDIA');
      
      // Collect all possible media tracks
      const allTracks = [];
      
      if (localStreamRef.current) {
        allTracks.push(...localStreamRef.current.getTracks());
      }
      
      if (localStream) {
        allTracks.push(...localStream.getTracks());
      }
      
      // Force stop everything immediately
      allTracks.forEach((track, index) => {
        try {
          console.log(`🚨 EMERGENCY STOP track ${index}: ${track.kind}`);
          track.stop();
        } catch (e) {
          console.warn('Error in emergency stop:', e);
        }
      });
      
      console.log(`🚨 EMERGENCY STOPPED ${allTracks.length} tracks`);
    };

    // Add event listeners for page unload/refresh
    window.addEventListener('beforeunload', globalCleanup);
    window.addEventListener('unload', globalCleanup);

    return () => {
      globalCleanup();
      cleanupCall();
      if (cleanupSocketListeners) {
        cleanupSocketListeners();
      }
      
      // Remove event listeners
      window.removeEventListener('beforeunload', globalCleanup);
      window.removeEventListener('unload', globalCleanup);
    };
  }, []);

  // Check screen sharing support
  useEffect(() => {
    const checkScreenShareSupport = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const hasGetDisplayMedia = navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia;
      setIsScreenShareSupported(!isMobile && hasGetDisplayMedia);
    };

    checkScreenShareSupport();
  }, []);

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
      // Parse call context from callId
      const [, timestamp, callerId, targetUserId] = callId.split('_');
      const otherUserId = user?.id === parseInt(callerId) ? parseInt(targetUserId) : parseInt(callerId);
      
      // Fetch mentorship context
      try {
        const response = await mentorshipAPI.getActiveMentorships();
        const mentorships = response.data.data.mentorships;
        const relevantMentorship = mentorships.find(m => 
          (m.mentorId === user?.id && m.menteeId === otherUserId) ||
          (m.menteeId === user?.id && m.mentorId === otherUserId)
        );
        
        if (relevantMentorship) {
          setMentorship(relevantMentorship);
          setCallContext({
            callId,
            purpose: callPurpose,
            type: callType,
            role: userRole,
            otherUser: relevantMentorship.mentorId === user?.id ? relevantMentorship.mentee : relevantMentorship.mentor
          });
        }
      } catch (error) {
        console.error('Failed to fetch mentorship context:', error);
      }

      // Get user media
      const constraints = {
        video: callType === 'video',
        audio: true
      };

      console.log('🎥 Requesting media with constraints:', constraints);
      console.log('🎥 Available devices check...');
      
      // Check available devices first
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log('🎥 Available devices:', devices);
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        const audioDevices = devices.filter(device => device.kind === 'audioinput');
        console.log('🎥 Video devices:', videoDevices.length);
        console.log('🎥 Audio devices:', audioDevices.length);
      } catch (deviceError) {
        console.error('🎥 Failed to enumerate devices:', deviceError);
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('🎥 Successfully got media stream:', stream);
      console.log('🎥 Stream ID:', stream.id);
      console.log('🎥 Stream tracks:', stream.getTracks().map(t => ({
        kind: t.kind,
        enabled: t.enabled,
        readyState: t.readyState,
        id: t.id,
        label: t.label
      })));
      
      setLocalStream(stream);
      localStreamRef.current = stream;

      // Join the call room
      if (socketService.getConnectionStatus()) {
        socketService.joinRoom(callId);
        
        // Add current user as a participant (only once)
        if (!currentUserAdded.current) {
          const currentUserParticipant = {
            id: user?.id,
            name: user?.name,
            role: user?.role || 'user',
            joinedAt: new Date().toISOString()
          };
          
          console.log('👤 Adding current user as participant (first time):', currentUserParticipant);
          setParticipants([currentUserParticipant]);
          currentUserAdded.current = true;
        } else {
          console.log('👤 Current user already added, skipping...');
        }
        
        setCallState('connected');
      } else {
        throw new Error('Socket not connected');
      }

    } catch (error) {
      console.error('Failed to initialize call:', error);
      console.error('Media error details:', error.name, error.message);
      console.error('Error stack:', error.stack);
      
      // More specific error handling
      let errorMessage = 'Failed to access camera/microphone or connect to call';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera/microphone access denied. Please allow permissions and refresh the page.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera/microphone found. Please connect a device and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera/microphone is being used by another application. Please close other video apps.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera/microphone constraints cannot be satisfied. Please check your device settings.';
      } else if (error.message === 'Socket not connected') {
        errorMessage = 'Not connected to server. Please check your internet connection.';
      }
      
      setCallState('failed');
      toast.error(errorMessage);
    }
  };

  const setupSocketListeners = () => {
    socketService.on('call_participant_joined', handleParticipantJoined);
    socketService.on('call_participant_left', handleParticipantLeft);
    socketService.on('call_ended', handleCallEnded);
    socketService.on('webrtc_offer', handleWebRTCOffer);
    socketService.on('webrtc_answer', handleWebRTCAnswer);
    socketService.on('webrtc_ice_candidate', handleICECandidate);

    return () => {
      socketService.off('call_participant_joined', handleParticipantJoined);
      socketService.off('call_participant_left', handleParticipantLeft);
      socketService.off('call_ended', handleCallEnded);
      socketService.off('webrtc_offer', handleWebRTCOffer);
      socketService.off('webrtc_answer', handleWebRTCAnswer);
      socketService.off('webrtc_ice_candidate', handleICECandidate);
    };
  };

  const handleParticipantJoined = async (data) => {
    const { participantId, participantInfo } = data;
    
    // Only add if not already in participants and not the current user
    if (participantId !== user?.id) {
      setParticipants(prev => {
        const exists = prev.some(p => p.id === participantId);
        if (!exists) {
          console.log('👤 New participant joined:', participantInfo);
          toast.success(`${participantInfo.name || `User ${participantId}`} joined the call`);
          return [...prev, participantInfo];
        }
        return prev;
      });
      await createPeerConnection(participantId);
    }
  };

  const handleParticipantLeft = (data) => {
    const { participantId, participantName, reason } = data;
    
    console.log('📨 Received call_participant_left event:', data);
    console.log('📨 Current user ID:', user?.id, 'Participant ID:', participantId);
    
    // Only show notification if it's NOT the current user leaving
    // (This notification is for remaining participants to see who left)
    if (participantId !== user?.id) {
      const userName = participantName || `User ${participantId}`;
      console.log('📨 Showing leave notification for:', userName);
      if (reason === 'ended_by_user') {
        toast.error(`${userName} left the call`);
      } else {
        toast.info(`${userName} disconnected`);
      }
    } else {
      console.log('📨 Ignoring own participant left event');
    }
    
    setParticipants(prev => prev.filter(p => p.id !== participantId));
    
    const pc = peerConnections.current.get(participantId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(participantId);
    }
    
    setRemoteStreams(prev => {
      const newStreams = new Map(prev);
      newStreams.delete(participantId);
      return newStreams;
    });
  };

  const handleCallEnded = () => {
    setCallState('feedback');
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

    if (localStreamRef.current) {
      console.log('🎥 Adding local tracks to peer connection for participant:', participantId);
      localStreamRef.current.getTracks().forEach(track => {
        console.log('🎥 Adding track:', track.kind, track.enabled, track.readyState);
        pc.addTrack(track, localStreamRef.current);
      });
      console.log('🎥 All local tracks added to peer connection');
    } else {
      console.warn('⚠️ No local stream available when creating peer connection for:', participantId);
    }

    pc.ontrack = (event) => {
      console.log('📺 Received remote track event:', event);
      console.log('📺 Track kind:', event.track.kind);
      console.log('📺 Track enabled:', event.track.enabled);
      console.log('📺 Track readyState:', event.track.readyState);
      console.log('📺 Event streams:', event.streams);
      
      if (event.streams && event.streams[0]) {
        const [remoteStream] = event.streams;
        console.log('📺 Remote stream ID:', remoteStream.id);
        console.log('📺 Remote stream tracks:', remoteStream.getTracks().map(t => ({
          kind: t.kind,
          enabled: t.enabled,
          readyState: t.readyState,
          id: t.id
        })));
        
        setRemoteStreams(prev => new Map(prev.set(participantId, remoteStream)));
        
        if (!mainStreamId) {
          setMainStreamId(participantId);
          console.log('📺 Set main stream ID to:', participantId);
        }
      } else {
        console.warn('⚠️ No streams in track event');
      }
    };

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
    
    try {
      // Check signaling state before setting remote description
      if (pc.signalingState !== 'stable' && pc.signalingState !== 'have-local-offer') {
        console.warn('⚠️ Invalid signaling state for offer:', pc.signalingState);
        return;
      }
      
      await pc.setRemoteDescription(offer);
      
      // Check state before creating answer
      if (pc.signalingState !== 'have-remote-offer') {
        console.warn('⚠️ Not in correct state for creating answer:', pc.signalingState);
        return;
      }
      
      const answer = await pc.createAnswer();
      
      // Check state again before setting local description
      if (pc.signalingState !== 'have-remote-offer') {
        console.warn('⚠️ State changed before setting local description:', pc.signalingState);
        return;
      }
      
      await pc.setLocalDescription(answer);
      socketService.sendWebRTCAnswer(fromParticipant, answer);
    } catch (error) {
      console.error('❌ Failed to handle WebRTC offer:', error);
      
      // Don't treat this as a fatal error if we're already in stable state
      if (error.message && error.message.includes('stable')) {
        console.log('ℹ️ Connection already stable, ignoring error');
        return;
      }
    }
  };

  const handleWebRTCAnswer = async (data) => {
    const { fromParticipant, answer } = data;
    const pc = peerConnections.current.get(fromParticipant);
    
    if (pc) {
      try {
        // Check if we already have a remote description
        if (pc.remoteDescription) {
          console.log('⚠️ Already have remote description, ignoring answer');
          return;
        }
        
        // Only accept answers in have-local-offer state
        if (pc.signalingState !== 'have-local-offer') {
          console.log('⚠️ Invalid signaling state for answer:', pc.signalingState);
          
          // If we're in stable state, it means the connection was already established
          if (pc.signalingState === 'stable') {
            console.log('✅ Connection already established, ignoring answer');
            return;
          }
          
          return;
        }
        
        await pc.setRemoteDescription(answer);
        console.log('✅ Answer processed, connection should be established');
      } catch (error) {
        console.error('❌ Failed to handle WebRTC answer:', error);
        
        // Don't treat this as a fatal error if we're already in stable state
        if (error.message && error.message.includes('stable')) {
          console.log('ℹ️ Connection already stable, ignoring error');
          return;
        }
      }
    }
  };

  const handleICECandidate = async (data) => {
    const { fromParticipant, candidate } = data;
    const pc = peerConnections.current.get(fromParticipant);
    
    if (pc) {
      try {
        await pc.addIceCandidate(candidate);
        console.log('✅ ICE candidate added');
      } catch (error) {
        console.error('❌ Failed to add ICE candidate:', error);
        // Don't treat ICE candidate errors as fatal
      }
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
    if (!isScreenShareSupported) {
      toast.error('Screen sharing is not supported on mobile devices');
      return;
    }

    try {
      if (!isScreenSharing) {
        // Check if getDisplayMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          throw new Error('Screen sharing is not supported in this browser');
        }
        
        // Use direct call to avoid context binding issues
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { mediaSource: 'screen', width: { max: 1920 }, height: { max: 1080 } },
          audio: { echoCancellation: true, noiseSuppression: true }
        });
        
        const videoTrack = screenStream.getVideoTracks()[0];
        const originalVideoTrack = localStreamRef.current?.getVideoTracks()[0];
        
        const replacePromises = [];
        peerConnections.current.forEach(pc => {
          const videoSender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (videoSender && videoTrack) {
            replacePromises.push(videoSender.replaceTrack(videoTrack));
          }
        });

        await Promise.all(replacePromises);
        
        const newLocalStream = new MediaStream();
        newLocalStream.addTrack(videoTrack);
        if (localStreamRef.current?.getAudioTracks()[0]) {
          newLocalStream.addTrack(localStreamRef.current.getAudioTracks()[0]);
        }
        setLocalStream(newLocalStream);
        
        setIsScreenSharing(true);
        toast.success('Screen sharing started');
        
        videoTrack.onended = async () => {
          await stopScreenSharing(originalVideoTrack);
        };
      } else {
        await stopScreenSharing();
      }
    } catch (error) {
      console.error('Screen share error:', error);
      
      // Handle specific screen sharing errors
      if (error.name === 'NotAllowedError') {
        toast.error('Screen sharing permission denied. Please allow screen sharing and try again.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No screen available for sharing.');
      } else if (error.name === 'NotSupportedError') {
        toast.error('Screen sharing is not supported in this browser.');
      } else if (error.message && error.message.includes('getDisplayMedia')) {
        toast.error('Screen sharing API error. Please try refreshing the page.');
      } else if (error.message && error.message.includes('message channel')) {
        console.warn('⚠️ Browser extension conflict during screen sharing, retrying...');
        toast.warn('Browser extension conflict detected. Retrying...');
        // Retry once after a short delay
        setTimeout(() => {
          toggleScreenShare();
        }, 1000);
        return;
      } else {
        toast.error('Failed to share screen. Please try again.');
      }
    }
  };

  const stopScreenSharing = async (originalVideoTrack = null) => {
    try {
      let cameraTrack = originalVideoTrack;
      if (!cameraTrack || cameraTrack.readyState === 'ended') {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        cameraTrack = cameraStream.getVideoTracks()[0];
      }

      const replacePromises = [];
      peerConnections.current.forEach(pc => {
        const videoSender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (videoSender && cameraTrack) {
          replacePromises.push(videoSender.replaceTrack(cameraTrack));
        }
      });

      await Promise.all(replacePromises);
      
      const newLocalStream = new MediaStream();
      newLocalStream.addTrack(cameraTrack);
      if (localStreamRef.current?.getAudioTracks()[0]) {
        newLocalStream.addTrack(localStreamRef.current.getAudioTracks()[0]);
      }
      
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
      
      // IMMEDIATE camera cleanup - don't wait
      console.log('🚨 IMMEDIATE CAMERA STOP ON END CALL');
      const immediateCleanup = () => {
        const allTracks = [];
        
        // Get tracks from all possible sources
        if (localStreamRef.current) {
          allTracks.push(...localStreamRef.current.getTracks());
        }
        if (localStream) {
          allTracks.push(...localStream.getTracks());
        }
        
        // Force stop all tracks immediately
        allTracks.forEach((track, index) => {
          console.log(`🚨 FORCE STOP track ${index}: ${track.kind} - ${track.label} (state: ${track.readyState})`);
          try {
            track.stop();
            console.log(`✅ Track ${index} stopped - new state: ${track.readyState}`);
          } catch (e) {
            console.error(`❌ Error stopping track ${index}:`, e);
          }
        });
        
        // Clear references immediately and force garbage collection
        if (localStreamRef.current) {
          // Remove all tracks from the stream
          localStreamRef.current.getTracks().forEach(track => track.stop());
          localStreamRef.current = null;
        }
        
        setLocalStream(null);
        
        // Force clear any video elements that might be holding references
        const videoElements = document.querySelectorAll('video');
        videoElements.forEach(video => {
          if (video.srcObject) {
            video.srcObject = null;
            video.load(); // Force reload to clear any cached streams
          }
        });
        
        console.log(`🚨 IMMEDIATE CLEANUP: Stopped ${allTracks.length} tracks and cleared ${videoElements.length} video elements`);
      };
      immediateCleanup();
      
      // Notify other participants that this user is leaving BEFORE cleanup
      if (socketService.getConnectionStatus() && callId) {
        console.log('📡 Emitting call_participant_left event:', {
          callId,
          participantId: user?.id,
          participantName: user?.name,
          reason: 'ended_by_user'
        });
        
        socketService.notifyParticipantLeft({
          callId,
          participantId: user?.id,
          participantName: user?.name,
          reason: 'ended_by_user',
          timestamp: new Date().toISOString()
        });
        
        // Wait a moment for the event to be processed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // End the call for everyone if this is the last participant
        socketService.endCall(callId, 'user_ended');
      } else {
        console.error('❌ Cannot emit participant left - socket not connected or no callId');
      }
      
      await cleanupCall();
      setCallState('feedback');
    } catch (error) {
      console.error('Error ending call:', error);
      toast.error('Error ending call');
      setCallState('feedback');
    }
  };

  const cleanupCall = async () => {
    try {
      console.log('🧹 AGGRESSIVE camera cleanup starting...');
      
      // Get all active media tracks from all possible sources
      const allTracks = [];
      
      if (localStreamRef.current) {
        allTracks.push(...localStreamRef.current.getTracks());
      }
      
      if (localStream) {
        allTracks.push(...localStream.getTracks());
      }
      
      // Also check for any other active media streams
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          // Force stop all tracks
          allTracks.forEach((track, index) => {
            console.log(`🧹 Force stopping track ${index}: ${track.kind} - ${track.label}`);
            console.log(`🧹 Track state before stop: ${track.readyState}`);
            track.stop();
            console.log(`✅ Track ${index} stopped - new state: ${track.readyState}`);
          });
        } catch (e) {
          console.error('Error in aggressive track cleanup:', e);
        }
      }
      
      // Clear all stream references aggressively
      localStreamRef.current = null;
      setLocalStream(null);
      
      // Reset all media states
      setIsAudioEnabled(true);
      setIsVideoEnabled(true);
      setIsScreenSharing(false);
      
      // Force clear all video elements on the page
      const allVideoElements = document.querySelectorAll('video');
      allVideoElements.forEach((video, index) => {
        console.log(`🧹 Clearing video element ${index}`);
        if (video.srcObject) {
          const stream = video.srcObject;
          if (stream && stream.getTracks) {
            stream.getTracks().forEach(track => {
              console.log(`🧹 Stopping track from video element: ${track.kind}`);
              track.stop();
            });
          }
          video.srcObject = null;
          video.load();
        }
      });
      
      // Force garbage collection hint (if available)
      if (window.gc) {
        window.gc();
        console.log('🧹 Forced garbage collection');
      }
      
      console.log(`🧹 Stopped ${allTracks.length} media tracks total and cleared ${allVideoElements.length} video elements`);

      remoteStreams.forEach(stream => {
        stream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            console.warn('Error stopping remote stream track:', e);
          }
        });
      });
      setRemoteStreams(new Map());

      peerConnections.current.forEach((pc, participantId) => {
        try {
          if (pc.connectionState !== 'closed') {
            pc.close();
          }
        } catch (e) {
          console.warn(`Error closing peer connection for ${participantId}:`, e);
        }
      });
      peerConnections.current.clear();

      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      setParticipants([]);
      setMainStreamId(null);
      setIsScreenSharing(false);
      
      // Reset the current user added flag
      currentUserAdded.current = false;

      // Remove socket listeners first
      socketService.off('call_participant_joined', handleParticipantJoined);
      socketService.off('call_participant_left', handleParticipantLeft);
      socketService.off('call_ended', handleCallEnded);
      socketService.off('webrtc_offer', handleWebRTCOffer);
      socketService.off('webrtc_answer', handleWebRTCAnswer);
      socketService.off('webrtc_ice_candidate', handleICECandidate);

      // Leave socket room AFTER a delay to allow participant left event to be processed
      if (callId && socketService.getConnectionStatus()) {
        setTimeout(() => {
          console.log('🏠 Leaving call room (delayed):', callId);
          socketService.leaveRoom(callId);
        }, 200);
      }
      
      console.log('Call cleanup completed');
    } catch (error) {
      console.error('Error during call cleanup:', error);
    }
  };

  const handleStreamClick = (streamId) => {
    setMainStreamId(streamId);
  };

  const handleFeedbackSubmitted = (feedbackData) => {
    toast.success('Thank you for your feedback!');
    setTimeout(() => {
      navigate('/mentorship/dashboard');
    }, 2000);
  };

  const getPurposeText = (purpose) => {
    const purposes = {
      'general_session': 'General Session',
      'goal_review': 'Goal Review',
      'problem_solving': 'Problem Solving',
      'skill_development': 'Skill Development',
      'career_guidance': 'Career Guidance',
      'project_review': 'Project Review',
      'check_in': 'Check-in',
      'emergency': 'Urgent Help'
    };
    return purposes[purpose] || 'Mentorship Session';
  };

  if (callState === 'failed') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md">
          <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">Call Failed</h2>
          <p className="text-gray-300 mb-6">Unable to start the mentorship call. Please check your camera and microphone permissions.</p>
          <button
            onClick={() => navigate('/mentorship/dashboard')}
            className="btn btn-primary"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (callState === 'feedback') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <CallFeedback
          callId={callId}
          callDuration={callDuration}
          mentorship={mentorship}
          callPurpose={callPurpose}
          onFeedbackSubmitted={handleFeedbackSubmitted}
        />
      </div>
    );
  }

  if (callState === 'ended' || callState === 'ending') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <PhoneXMarkIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">Call Ended</h2>
          <p className="text-gray-300 mb-6">The mentorship session has ended. Redirecting to feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Call Header with Context */}
      <div className="absolute top-0 left-0 right-0 bg-gray-800 bg-opacity-90 text-white p-4 z-40">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <AcademicCapIcon className="w-5 h-5 text-primary-400" />
              <span className="text-sm font-medium">Mentorship Session</span>
            </div>
            <div className="text-sm text-gray-300">
              {getPurposeText(callPurpose)}
            </div>
            {callContext?.otherUser && (
              <div className="flex items-center space-x-2">
                <UserIcon className="w-4 h-4" />
                <span className="text-sm">with {callContext.otherUser.name}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-300">
            <div className="flex items-center space-x-1">
              <ClockIcon className="w-4 h-4" />
              <span>{Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}</span>
            </div>
            <span className="capitalize">{userRole}</span>
          </div>
        </div>
      </div>

      {callState === 'connecting' && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center text-white">
            <LoadingSpinner size="lg" color="white" />
            <p className="mt-4 text-lg">Connecting to mentorship session...</p>
            {callContext?.otherUser && (
              <p className="mt-2 text-gray-300">Waiting for {callContext.otherUser.name} to join</p>
            )}
          </div>
        </div>
      )}

      {/* Video layout */}
      <div className="h-screen flex pt-16">
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
        </div>

        {/* Side panel for additional participants */}
        {(participants.length > 0 || localStream) && (
          <div className="w-80 bg-gray-800 p-4 space-y-4 overflow-y-auto">
            <h3 className="text-white font-medium mb-4">
              Session Participants ({participants.length + 1})
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
              
              const participant = participants.find(p => p.id === participantId);
              return (
                <VideoStream
                  key={participantId}
                  stream={stream}
                  isLocal={false}
                  isVideoEnabled={true}
                  isAudioEnabled={true}
                  participantName={participant?.name}
                  participantId={participantId}
                  onStreamClick={handleStreamClick}
                  className="w-full h-32"
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Call controls */}
      <VideoCallControls
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
        isScreenShareSupported={isScreenShareSupported}
        isSpeakerOn={isSpeakerOn}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onToggleSpeaker={() => setIsSpeakerOn(!isSpeakerOn)}
        onEndCall={endCall}
        onToggleChat={() => setShowChat(!showChat)}
        showChat={showChat}
        callDuration={callDuration}
        participantCount={participants.length + 1}
      />
    </div>
  );
};

export default MentorshipVideoCall;
