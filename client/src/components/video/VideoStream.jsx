import React, { useRef, useEffect, useState } from 'react';
import {
  MicrophoneIcon,
  VideoCameraIcon,
  UserIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline';
import {
  MicrophoneIcon as MicrophoneSolidIcon,
  VideoCameraIcon as VideoCameraSolidIcon
} from '@heroicons/react/24/solid';
import clsx from 'clsx';

const VideoStream = ({
  stream,
  isLocal = false,
  isMuted = false,
  isVideoEnabled = true,
  isAudioEnabled = true,
  participantName = '',
  participantId,
  isMainStream = false,
  onStreamClick,
  showControls = false,
  className = ''
}) => {
  const videoRef = useRef(null);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      setIsVideoLoading(false);
    } else if (videoRef.current && !stream) {
      // CRITICAL: Clear video srcObject to release camera/microphone
      videoRef.current.srcObject = null;
      setIsVideoLoading(false);
    }

    // Cleanup function to run when component unmounts or stream changes
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stream]);

  // Audio level detection for visual feedback
  useEffect(() => {
    if (!stream || !isAudioEnabled) {
      setAudioLevel(0);
      return;
    }

    let audioContext;
    let analyser;
    let microphone;
    let dataArray;
    let animationFrame;

    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
      
      microphone.connect(analyser);

      const updateAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
        setAudioLevel(average / 255); // Normalize to 0-1
        animationFrame = requestAnimationFrame(updateAudioLevel);
      };

      updateAudioLevel();
    } catch (error) {
      console.warn('Audio level detection not supported:', error);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [stream, isAudioEnabled]);

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={clsx(
        'relative rounded-lg overflow-hidden bg-gray-900',
        isMainStream ? 'aspect-video' : 'aspect-square',
        onStreamClick && 'cursor-pointer',
        className
      )}
      onClick={() => onStreamClick?.(participantId)}
    >
      {/* Video element */}
      {isVideoEnabled && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal || isMuted}
          className={clsx(
            'w-full h-full object-cover',
            isLocal && 'transform scale-x-[-1]' // Mirror local video
          )}
          onLoadedMetadata={() => setIsVideoLoading(false)}
        />
      ) : (
        /* Avatar placeholder when video is disabled */
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
              {participantName ? (
                <span className="text-xl font-medium text-white">
                  {getInitials(participantName)}
                </span>
              ) : (
                <UserIcon className="w-8 h-8 text-gray-300" />
              )}
            </div>
            <p className="text-white text-sm font-medium">
              {participantName || 'Participant'}
            </p>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isVideoLoading && isVideoEnabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}

      {/* Audio level indicator */}
      {isAudioEnabled && audioLevel > 0.1 && (
        <div className="absolute top-3 left-3">
          <div className="flex items-center space-x-1">
            <SpeakerWaveIcon className="w-4 h-4 text-green-500" />
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map(level => (
                <div
                  key={level}
                  className={clsx(
                    'w-1 bg-green-500 rounded-full transition-all duration-100',
                    audioLevel * 5 >= level ? 'h-3' : 'h-1'
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status indicators */}
      <div className="absolute top-3 right-3 flex space-x-1">
        {/* Audio status */}
        <div
          className={clsx(
            'p-1 rounded-full',
            isAudioEnabled 
              ? 'bg-green-600 bg-opacity-80' 
              : 'bg-red-600 bg-opacity-80'
          )}
          title={isAudioEnabled ? 'Microphone on' : 'Microphone off'}
        >
          {isAudioEnabled ? (
            <MicrophoneIcon className="w-3 h-3 text-white" />
          ) : (
            <MicrophoneSolidIcon className="w-3 h-3 text-white" />
          )}
        </div>

        {/* Video status */}
        <div
          className={clsx(
            'p-1 rounded-full',
            isVideoEnabled 
              ? 'bg-green-600 bg-opacity-80' 
              : 'bg-red-600 bg-opacity-80'
          )}
          title={isVideoEnabled ? 'Camera on' : 'Camera off'}
        >
          {isVideoEnabled ? (
            <VideoCameraIcon className="w-3 h-3 text-white" />
          ) : (
            <VideoCameraSolidIcon className="w-3 h-3 text-white" />
          )}
        </div>
      </div>

      {/* Participant name overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
        <div className="flex items-center justify-between">
          <span className="text-white text-sm font-medium truncate">
            {isLocal ? 'You' : participantName || 'Participant'}
          </span>
          
          {/* Connection quality indicator */}
          <div className="flex space-x-1">
            <div className="w-1 h-2 bg-green-500 rounded-full"></div>
            <div className="w-1 h-3 bg-green-500 rounded-full"></div>
            <div className="w-1 h-4 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Local stream indicator */}
      {isLocal && (
        <div className="absolute top-3 left-3">
          <span className="bg-blue-600 bg-opacity-80 text-white text-xs px-2 py-1 rounded-full">
            You
          </span>
        </div>
      )}

      {/* Click overlay for non-main streams */}
      {!isMainStream && onStreamClick && (
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 hover:opacity-100 transition-opacity duration-200">
            <div className="bg-white bg-opacity-20 rounded-full p-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoStream;

