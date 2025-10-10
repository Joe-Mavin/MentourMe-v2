import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { mentorshipAPI } from '../services/api';
import DirectVideoCall from '../components/mentorship/DirectVideoCall';
import SessionScheduler from '../components/mentorship/SessionScheduler';
import SessionsList from '../components/mentorship/SessionsList';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  StarIcon,
  CalendarIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const MentorshipDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeMentorships, setActiveMentorships] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showScheduler, setShowScheduler] = useState(false);
  const [selectedMentorship, setSelectedMentorship] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch active mentorships
      const mentorshipsResponse = await mentorshipAPI.getActiveMentorships();
      setActiveMentorships(mentorshipsResponse.data.data.mentorships);

      // Fetch pending requests
      const requestsResponse = await mentorshipAPI.getRequests({ status: 'pending' });
      setPendingRequests(requestsResponse.data.data.requests);

      // Fetch stats
      const statsResponse = await mentorshipAPI.getStats();
      setStats(statsResponse.data.data.stats);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load mentorship data');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResponse = async (requestId, action, notes = '') => {
    try {
      await mentorshipAPI.respondToRequest(requestId, {
        action,
        mentorNotes: notes
      });

      toast.success(`Request ${action}ed successfully!`);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error(`Failed to ${action} request:`, error);
      toast.error(error.response?.data?.message || `Failed to ${action} request`);
    }
  };

  const handleScheduleSession = (mentorship = null) => {
    setSelectedMentorship(mentorship);
    setShowScheduler(true);
  };

  const handleSessionScheduled = (session) => {
    toast.success('Session scheduled successfully!');
    // Optionally refresh data or update local state
    fetchDashboardData();
  };

  const isMentor = user?.role === 'mentor';
  const isMentee = user?.role === 'user';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        <div className="ml-4">
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  const MentorshipCard = ({ mentorship }) => {
    const otherUser = isMentor ? mentorship.mentee : mentorship.mentor;
    const myRole = isMentor ? 'mentor' : 'mentee';
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              {otherUser.avatar ? (
                <img 
                  src={otherUser.avatar} 
                  alt={otherUser.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <UserGroupIcon className="w-6 h-6 text-gray-500" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {otherUser.name}
              </h3>
              <p className="text-sm text-gray-500 capitalize">
                Your {isMentor ? 'mentee' : 'mentor'}
              </p>
              <div className="flex items-center mt-1">
                <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-xs text-green-600">Active since {new Date(mentorship.respondedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>


        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            onClick={() => navigate(`/messages/direct/${otherUser.id}`)}
            className="flex items-center justify-center px-2 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1" />
            <span className="text-xs font-medium">Message</span>
          </button>
          <button
            onClick={() => handleScheduleSession(mentorship)}
            className="flex items-center justify-center px-2 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
          >
            <CalendarIcon className="w-4 h-4 mr-1" />
            <span className="text-xs font-medium">Schedule</span>
          </button>
          <div className="text-center p-2 bg-gray-50 rounded">
            <PhoneIcon className="w-4 h-4 mx-auto mb-1 text-gray-400" />
            <span className="text-gray-600 text-xs">0 calls</span>
          </div>
        </div>

        {/* Direct video call component */}
        <DirectVideoCall 
          mentorship={mentorship}
          onCallInitiated={(callContext) => {
            console.log('Call initiated:', callContext);
          }}
        />
      </div>
    );
  };

  const RequestCard = ({ request, showActions = true }) => {
    const [responding, setResponding] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [notes, setNotes] = useState('');
    const [pendingAction, setPendingAction] = useState(null);

    const otherUser = isMentor ? request.mentee : request.mentor;
    const isReceived = isMentor ? request.mentorId === user?.id : request.menteeId === user?.id;

    const handleResponse = async (action) => {
      if (action === 'reject' && !notes.trim()) {
        setShowNotesModal(true);
        setPendingAction(action);
        return;
      }

      setResponding(true);
      try {
        await handleRequestResponse(request.id, action, notes);
        setShowNotesModal(false);
        setNotes('');
        setPendingAction(null);
      } finally {
        setResponding(false);
      }
    };

    return (
      <>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                {otherUser.avatar ? (
                  <img 
                    src={otherUser.avatar} 
                    alt={otherUser.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <UserGroupIcon className="w-5 h-5 text-gray-500" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-base font-medium text-gray-900">
                  {otherUser.name}
                </h4>
                <p className="text-sm text-gray-500">
                  {isReceived ? 'Wants you as their mentor' : 'Mentor request sent'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(request.requestedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className={clsx(
                'px-2 py-1 rounded-full text-xs font-medium',
                request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              )}>
                {request.status}
              </span>
            </div>
          </div>

          {request.message && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">"{request.message}"</p>
            </div>
          )}

          {showActions && isReceived && request.status === 'pending' && (
            <div className="mt-4 flex items-center space-x-3">
              <button
                onClick={() => handleResponse('accept')}
                disabled={responding}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                Accept
              </button>
              <button
                onClick={() => handleResponse('reject')}
                disabled={responding}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                <XCircleIcon className="w-4 h-4 mr-2" />
                Decline
              </button>
            </div>
          )}
        </div>

        {/* Notes modal for rejection */}
        {showNotesModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Add a note (optional)
                </h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Let them know why you're declining..."
                  maxLength={500}
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {notes.length}/500
                </div>
                
                <div className="flex items-center justify-end space-x-3 mt-4">
                  <button
                    onClick={() => {
                      setShowNotesModal(false);
                      setNotes('');
                      setPendingAction(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleResponse(pendingAction)}
                    disabled={responding}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {responding ? 'Declining...' : 'Decline Request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mentorship Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage your mentorship relationships and sessions
          </p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Active Mentorships"
              value={activeMentorships.length}
              icon={UserGroupIcon}
              color="blue"
            />
            <StatCard
              title="Pending Requests"
              value={pendingRequests.length}
              subtitle={isMentor ? "Received" : "Sent"}
              icon={ClockIcon}
              color="yellow"
            />
            <StatCard
              title="Total Sessions"
              value="0"
              subtitle="This month"
              icon={PhoneIcon}
              color="green"
            />
            <StatCard
              title="Average Rating"
              value="N/A"
              icon={StarIcon}
              color="purple"
            />
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: AcademicCapIcon },
              { id: 'mentorships', name: 'Active Mentorships', icon: UserGroupIcon },
              { id: 'sessions', name: 'Sessions', icon: CalendarIcon },
              { id: 'requests', name: 'Requests', icon: ExclamationCircleIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex items-center py-2 px-1 border-b-2 font-medium text-sm',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
                {tab.id === 'requests' && pendingRequests.length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <PlusIcon className="w-5 h-5 mr-3 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    {isMentor ? 'Find New Mentees' : 'Find a Mentor'}
                  </span>
                </button>
                <button 
                  onClick={() => {
                    if (activeMentorships.length > 0) {
                      handleScheduleSession(); // Let user choose from dropdown
                    } else {
                      toast.error('You need an active mentorship to schedule a session');
                    }
                  }}
                  className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <CalendarIcon className="w-5 h-5 mr-3 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Schedule Session</span>
                </button>
                <button className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 mr-3 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">View Messages</span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="text-center py-8 text-gray-500">
                <ClockIcon className="w-8 h-8 mx-auto mb-2" />
                <p>No recent activity</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mentorships' && (
          <div className="space-y-6">
            {activeMentorships.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeMentorships.map((mentorship) => (
                  <MentorshipCard key={mentorship.id} mentorship={mentorship} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <UserGroupIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Active Mentorships
                </h3>
                <p className="text-gray-600 mb-6">
                  {isMentor 
                    ? "You don't have any mentees yet. Start by reviewing pending requests or finding mentees to guide."
                    : "You don't have a mentor yet. Send a request to connect with experienced mentors in your field."
                  }
                </p>
                <button className="btn btn-primary">
                  {isMentor ? 'Find Mentees' : 'Find a Mentor'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Your Sessions</h2>
                <button
                  onClick={() => {
                    if (activeMentorships.length > 0) {
                      handleScheduleSession(); // Let user choose from dropdown
                    } else {
                      toast.error('You need an active mentorship to schedule a session');
                    }
                  }}
                  className="btn btn-primary"
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Schedule New Session
                </button>
              </div>
              <SessionsList />
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-6">
            {pendingRequests.length > 0 ? (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ExclamationCircleIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Pending Requests
                </h3>
                <p className="text-gray-600">
                  {isMentor 
                    ? "You don't have any pending mentorship requests at the moment."
                    : "You haven't sent any mentorship requests yet."
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Session Scheduler Modal */}
      {showScheduler && (
        <SessionScheduler
          mentorship={selectedMentorship}
          mentorships={activeMentorships}
          onClose={() => {
            setShowScheduler(false);
            setSelectedMentorship(null);
          }}
          onSessionScheduled={handleSessionScheduled}
        />
      )}
    </div>
  );
};

export default MentorshipDashboard;
