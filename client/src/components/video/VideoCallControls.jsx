import React, { useState } from 'react';
import {
  MicrophoneIcon,
  VideoCameraIcon,
  PhoneXMarkIcon,
  ComputerDesktopIcon,
  SpeakerWaveIcon,
  ChatBubbleLeftIcon,
  Cog6ToothIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import {
  MicrophoneIcon as MicrophoneSolidIcon,
  VideoCameraIcon as VideoCameraSolidIcon,
  SpeakerWaveIcon as SpeakerWaveSolidIcon,
  ComputerDesktopIcon as ComputerDesktopSolidIcon
} from '@heroicons/react/24/solid';
import clsx from 'clsx';

const VideoCallControls = ({
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  isSpeakerOn,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleSpeaker,
  onEndCall,
  onToggleChat,
  showChat,
  callDuration,
  participantCount = 1
}) => {
  const [showEndCallConfirm, setShowEndCallConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState({
    audio: false,
    video: false,
    screen: false,
    speaker: false
  });
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAsyncAction = async (action, type) => {
    console.log(`Executing ${type} action...`);
    setIsLoading(prev => ({ ...prev, [type]: true }));
    try {
      if (typeof action === 'function') {
        await action();
        console.log(`${type} action completed successfully`);
      } else {
        console.error(`${type} action is not a function:`, action);
      }
    } catch (error) {
      console.error(`Error in ${type} action:`, error);
    } finally {
      setIsLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleEndCall = () => {
    if (showEndCallConfirm) {
      onEndCall();
    } else {
      setShowEndCallConfirm(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowEndCallConfirm(false), 3000);
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-90 text-white p-4 z-50">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {/* Call info */}
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <p className="font-medium">{formatDuration(callDuration)}</p>
            <p className="text-gray-300 text-xs">
              {participantCount} participant{participantCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Main controls */}
        <div className="flex items-center space-x-3">
          {/* Audio toggle */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Audio button clicked!');
                if (!isLoading.audio && onToggleAudio) {
                  if (typeof onToggleAudio === 'function') {
                    onToggleAudio();
                  } else {
                    console.error('onToggleAudio is not a function:', onToggleAudio);
                  }
                }
              }}
              disabled={isLoading.audio}
              className={clsx(
                'p-3 rounded-full transition-all duration-200 relative cursor-pointer',
                isAudioEnabled
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white',
                isLoading.audio && 'opacity-50 cursor-not-allowed'
              )}
              title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
            >
              {isLoading.audio ? (
                <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
              ) : isAudioEnabled ? (
                <MicrophoneIcon className="h-6 w-6" />
              ) : (
                <MicrophoneSolidIcon className="h-6 w-6" />
              )}
            </button>
            {!isAudioEnabled && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900" />
            )}
          </div>

          {/* Video toggle */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Video button clicked!');
                if (!isLoading.video && onToggleVideo) {
                  if (typeof onToggleVideo === 'function') {
                    onToggleVideo();
                  } else {
                    console.error('onToggleVideo is not a function:', onToggleVideo);
                  }
                }
              }}
              disabled={isLoading.video}
              className={clsx(
                'p-3 rounded-full transition-all duration-200 cursor-pointer',
                isVideoEnabled
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white',
                isLoading.video && 'opacity-50 cursor-not-allowed'
              )}
              title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {isLoading.video ? (
                <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
              ) : isVideoEnabled ? (
                <VideoCameraIcon className="h-6 w-6" />
              ) : (
                <VideoCameraSolidIcon className="h-6 w-6" />
              )}
            </button>
            {!isVideoEnabled && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900" />
            )}
          </div>

          {/* Screen share toggle */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Screen share button clicked!');
                if (!isLoading.screen && onToggleScreenShare) {
                  if (typeof onToggleScreenShare === 'function') {
                    handleAsyncAction(onToggleScreenShare, 'screen');
                  } else {
                    console.error('onToggleScreenShare is not a function:', onToggleScreenShare);
                  }
                }
              }}
              disabled={isLoading.screen}
              className={clsx(
                'p-3 rounded-full transition-all duration-200 cursor-pointer',
                isScreenSharing
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-white',
                isLoading.screen && 'opacity-50 cursor-not-allowed'
              )}
              title={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
            >
              {isLoading.screen ? (
                <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
              ) : isScreenSharing ? (
                <ComputerDesktopSolidIcon className="h-6 w-6" />
              ) : (
                <ComputerDesktopIcon className="h-6 w-6" />
              )}
            </button>
            {isScreenSharing && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-gray-900 animate-pulse" />
            )}
          </div>

          {/* Speaker toggle */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Speaker button clicked!');
              if (!isLoading.speaker && onToggleSpeaker) {
                if (typeof onToggleSpeaker === 'function') {
                  onToggleSpeaker();
                } else {
                  console.error('onToggleSpeaker is not a function:', onToggleSpeaker);
                }
              }
            }}
            disabled={isLoading.speaker}
            className={clsx(
              'p-3 rounded-full transition-all duration-200 cursor-pointer',
              isSpeakerOn
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-600 hover:bg-gray-700 text-white',
              isLoading.speaker && 'opacity-50 cursor-not-allowed'
            )}
            title={isSpeakerOn ? 'Turn off speaker' : 'Turn on speaker'}
          >
            {isLoading.speaker ? (
              <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
            ) : isSpeakerOn ? (
              <SpeakerWaveIcon className="h-6 w-6" />
            ) : (
              <SpeakerWaveSolidIcon className="h-6 w-6" />
            )}
          </button>

          {/* Chat toggle */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Chat button clicked!');
              if (onToggleChat && typeof onToggleChat === 'function') {
                onToggleChat();
              } else {
                console.error('onToggleChat is not a function:', onToggleChat);
              }
            }}
            className={clsx(
              'p-3 rounded-full transition-all duration-200 cursor-pointer',
              showChat
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            )}
            title="Toggle chat"
          >
            <ChatBubbleLeftIcon className="h-6 w-6" />
          </button>

          {/* End call */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('End call button clicked!');
                if (typeof handleEndCall === 'function') {
                  handleEndCall();
                } else {
                  console.error('handleEndCall is not a function');
                }
              }}
              className={clsx(
                'p-3 rounded-full transition-all duration-200 transform cursor-pointer',
                showEndCallConfirm
                  ? 'bg-red-700 hover:bg-red-800 scale-110'
                  : 'bg-red-600 hover:bg-red-700',
                'text-white shadow-lg'
              )}
              title={showEndCallConfirm ? 'Click again to confirm' : 'End call'}
            >
              <PhoneXMarkIcon className="h-6 w-6" />
            </button>
            {showEndCallConfirm && (
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Click again to end call
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
              </div>
            )}
          </div>
        </div>

        {/* Additional controls */}
        <div className="flex items-center space-x-2">
          {/* Connection status indicator */}
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-gray-300 hidden sm:inline">Connected</span>
          </div>
          
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Add more options functionality here
              console.log('More options clicked');
            }}
            className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors duration-200 cursor-pointer"
            title="More options"
          >
            <EllipsisHorizontalIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallControls;

