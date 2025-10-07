import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { videoCallsAPI } from '../../services/api';
import {
  PhoneIcon,
  VideoCameraIcon,
  PhoneXMarkIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const IncomingCallNotification = ({ socket }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [incomingCall, setIncomingCall] = useState(null);
  const [isResponding, setIsResponding] = useState(false);

  useEffect(() => {
    if (!socket) return;

    // Listen for incoming calls
    socket.on('incoming_call', (callData) => {
      console.log('Incoming call received:', callData);
      setIncomingCall(callData);
      
      // Play notification sound (optional)
      try {
        const audio = new Audio('/notification-sound.mp3');
        audio.play().catch(e => console.log('Could not play notification sound'));
      } catch (e) {
        // Ignore audio errors
      }
    });

    // Listen for call accepted/rejected events
    socket.on('call_accepted', (callData) => {
      console.log('Call accepted:', callData);
      navigate(`/video-call/${callData.callId}`);
    });

    socket.on('call_rejected', (callData) => {
      console.log('Call rejected:', callData);
      toast.error(`Call declined by ${callData.targetUserName}`);
      setIncomingCall(null);
    });

    socket.on('call_ended', (callData) => {
      console.log('Call ended:', callData);
      setIncomingCall(null);
    });

    return () => {
      socket.off('incoming_call');
      socket.off('call_accepted');
      socket.off('call_rejected');
      socket.off('call_ended');
    };
  }, [socket, navigate]);

  const acceptCall = async (callData) => {
    if (isResponding) return;
    
    setIsResponding(true);
    try {
      await videoCallsAPI.acceptCall(callData.callId);
      navigate(`/video-call/${callData.callId}?type=${callData.callType}&initiator=false`);
      setIncomingCall(null);
    } catch (error) {
      console.error('Failed to accept call:', error);
      toast.error('Failed to accept call');
    } finally {
      setIsResponding(false);
    }
  };

  const rejectCall = async (callData) => {
    if (isResponding) return;
    
    setIsResponding(true);
    try {
      await videoCallsAPI.rejectCall(callData.callId, {
        reason: 'User declined'
      });
      setIncomingCall(null);
      toast.success('Call declined');
    } catch (error) {
      console.error('Failed to reject call:', error);
      toast.error('Failed to decline call');
    } finally {
      setIsResponding(false);
    }
  };

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full">
        <div className="text-center">
          {/* Caller Avatar */}
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <UserIcon className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600" />
          </div>

          {/* Call Info */}
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
            Incoming {incomingCall.callType} call
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-1">
            {incomingCall.callerName}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mb-1">
            {incomingCall.callerRole}
          </p>
          <p className="text-xs sm:text-sm text-primary-600 mb-4 sm:mb-6">
            {incomingCall.purpose}
          </p>

          {/* Action Buttons - Stack on very small screens */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => rejectCall(incomingCall)}
              disabled={isResponding}
              className={clsx(
                'flex-1 flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 rounded-full text-white font-medium text-sm sm:text-base',
                'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500',
                isResponding && 'opacity-50 cursor-not-allowed'
              )}
            >
              <PhoneXMarkIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Decline
            </button>
            
            <button
              onClick={() => acceptCall(incomingCall)}
              disabled={isResponding}
              className={clsx(
                'flex-1 flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 rounded-full text-white font-medium text-sm sm:text-base',
                'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500',
                isResponding && 'opacity-50 cursor-not-allowed'
              )}
            >
              {incomingCall.callType === 'video' ? (
                <VideoCameraIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              ) : (
                <PhoneIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              )}
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallNotification;
