import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { videoCallsAPI } from '../../services/api';
import {
  PhoneIcon,
  VideoCameraIcon,
  ClockIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  LightBulbIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const DirectVideoCall = ({ mentorship, onCallInitiated }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isInitiating, setIsInitiating] = useState(false);
  const [showPurposeModal, setShowPurposeModal] = useState(false);
  const [selectedPurpose, setSelectedPurpose] = useState('general_session');
  const [callType, setCallType] = useState('video');

  const isMentor = mentorship.mentorId === user?.id;
  const otherUser = isMentor ? mentorship.mentee : mentorship.mentor;
  const myRole = isMentor ? 'mentor' : 'mentee';
  const otherRole = isMentor ? 'mentee' : 'mentor';

  const callPurposes = [
    {
      id: 'general_session',
      name: 'General Session',
      description: 'Regular mentorship discussion',
      icon: ChatBubbleLeftRightIcon,
      color: 'blue'
    },
    {
      id: 'goal_review',
      name: 'Goal Review',
      description: 'Review and set goals',
      icon: AcademicCapIcon,
      color: 'green'
    },
    {
      id: 'problem_solving',
      name: 'Problem Solving',
      description: 'Work through challenges',
      icon: LightBulbIcon,
      color: 'yellow'
    },
    {
      id: 'skill_development',
      name: 'Skill Development',
      description: 'Focus on specific skills',
      icon: BriefcaseIcon,
      color: 'purple'
    },
    {
      id: 'career_guidance',
      name: 'Career Guidance',
      description: 'Career planning and advice',
      icon: BriefcaseIcon,
      color: 'indigo'
    },
    {
      id: 'project_review',
      name: 'Project Review',
      description: 'Review current projects',
      icon: ClockIcon,
      color: 'gray'
    },
    {
      id: 'check_in',
      name: 'Quick Check-in',
      description: 'Brief progress update',
      icon: UserIcon,
      color: 'pink'
    },
    {
      id: 'emergency',
      name: 'Urgent Help',
      description: 'Need immediate assistance',
      icon: ExclamationTriangleIcon,
      color: 'red'
    }
  ];

  const initiateCall = async () => {
    if (!selectedPurpose) {
      toast.error('Please select a call purpose');
      return;
    }

    setIsInitiating(true);
    try {
      console.log('🚀 Initiating call with data:', {
        targetUserId: otherUser.id,
        callType,
        purpose: selectedPurpose,
        sessionType: 'mentorship'
      });
      
      const response = await videoCallsAPI.initiateCall({
        targetUserId: otherUser.id,
        callType,
        purpose: selectedPurpose,
        sessionType: 'mentorship'
      });
      
      console.log('📤 API Response:', response);

      const callContext = response.data?.data?.callContext || response.data?.callContext;
      
      if (!callContext || !callContext.callId) {
        throw new Error('Invalid response: missing call context');
      }
      
      toast.success(`${callType === 'video' ? 'Video' : 'Audio'} call initiated!`);
      
      // Navigate to video call page
      navigate(`/video-call/${callContext.callId}?type=${callType}&role=${myRole}&purpose=${selectedPurpose}&initiator=true`);
      
      if (onCallInitiated) {
        onCallInitiated(callContext);
      }
      
      setShowPurposeModal(false);
    } catch (error) {
      console.error('❌ Failed to initiate call - Full error:', error);
      console.error('❌ Error response:', error?.response);
      console.error('❌ Error data:', error?.response?.data);
      console.error('❌ Error message:', error?.message);
      console.error('❌ Error stack:', error?.stack);
      
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to initiate call';
      toast.error(errorMessage);
    } finally {
      setIsInitiating(false);
    }
  };

  const handleCallClick = (type) => {
    setCallType(type);
    setShowPurposeModal(true);
  };

  const getPurposeColor = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
      pink: 'bg-pink-100 text-pink-800 border-pink-200',
      red: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[color] || colors.blue;
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              {otherUser.avatar ? (
                <img 
                  src={otherUser.avatar} 
                  alt={otherUser.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="w-6 h-6 text-gray-500" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {otherUser.name}
              </h3>
              <p className="text-sm text-gray-500 capitalize">
                Your {otherRole}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleCallClick('audio')}
              disabled={isInitiating}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              title="Start audio call"
            >
              <PhoneIcon className="w-4 h-4 mr-2" />
              Audio Call
            </button>
            
            <button
              onClick={() => handleCallClick('video')}
              disabled={isInitiating}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              title="Start video call"
            >
              <VideoCameraIcon className="w-4 h-4 mr-2" />
              Video Call
            </button>
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          <p>Start a direct {callType} call with your {otherRole} for mentorship sessions, goal reviews, or problem-solving discussions.</p>
        </div>
      </div>

      {/* Purpose Selection Modal */}
      {showPurposeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Select Call Purpose
                </h3>
                <button
                  onClick={() => setShowPurposeModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mb-6">
                Choose the purpose of your {callType} call with {otherUser.name}. This helps both parties prepare and makes the session more productive.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {callPurposes.map((purpose) => {
                  const IconComponent = purpose.icon;
                  return (
                    <button
                      key={purpose.id}
                      onClick={() => setSelectedPurpose(purpose.id)}
                      className={clsx(
                        'p-4 border-2 rounded-lg text-left transition-all duration-200',
                        selectedPurpose === purpose.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={clsx(
                          'p-2 rounded-lg',
                          getPurposeColor(purpose.color)
                        )}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900">
                            {purpose.name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {purpose.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">Call Type:</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCallType('audio')}
                      className={clsx(
                        'px-3 py-1 rounded-md text-sm font-medium',
                        callType === 'audio'
                          ? 'bg-primary-100 text-primary-800'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      Audio
                    </button>
                    <button
                      onClick={() => setCallType('video')}
                      className={clsx(
                        'px-3 py-1 rounded-md text-sm font-medium',
                        callType === 'video'
                          ? 'bg-primary-100 text-primary-800'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      Video
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowPurposeModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={initiateCall}
                    disabled={isInitiating || !selectedPurpose}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {isInitiating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                        Starting Call...
                      </>
                    ) : (
                      `Start ${callType === 'video' ? 'Video' : 'Audio'} Call`
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DirectVideoCall;
