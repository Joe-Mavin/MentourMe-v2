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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-6"></div>
          <p className="text-gray-300 font-bold uppercase tracking-wider">Loading Battle Command Center...</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, color = 'orange' }) => (
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-2xl border border-orange-500/30 p-6 hover:shadow-orange-500/10 transition-all duration-300">
      <div className="flex items-center">
        <div className="p-4 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 border-2 border-orange-500">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-3xl font-black text-orange-400">{value}</p>
          <p className="text-sm font-bold text-gray-300 uppercase tracking-wider">{title}</p>
          {subtitle && <p className="text-xs text-gray-400 font-medium">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  const MentorshipCard = ({ mentorship }) => {
    const otherUser = isMentor ? mentorship.mentee : mentorship.mentor;
    const myRole = isMentor ? 'mentor' : 'mentee';
    
    return (
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-2xl border border-orange-500/30 p-6 hover:shadow-orange-500/10 transition-all duration-300">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center border-2 border-orange-500">
              {otherUser.avatar ? (
                <img 
                  src={otherUser.avatar} 
                  alt={otherUser.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <UserGroupIcon className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-wider">
                {otherUser.name}
              </h3>
              <p className="text-sm text-orange-400 capitalize font-bold uppercase tracking-wider">
                Your {isMentor ? 'Battle Apprentice' : 'Elite Commander'}
              </p>
              <div className="flex items-center mt-2">
                <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" />
                <span className="text-xs text-green-400 font-medium">⚔️ Alliance since {new Date(mentorship.respondedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>


        {/* Battle Action Buttons */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => navigate(`/messages/direct/${otherUser.id}`)}
            className="flex flex-col items-center justify-center px-3 py-3 bg-gray-800 text-orange-400 rounded-xl hover:bg-gray-700 border border-gray-700 hover:border-orange-500/50 transition-all duration-200"
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5 mb-1" />
            <span className="text-xs font-black uppercase tracking-wider">Battle Comms</span>
          </button>
          <button
            onClick={() => handleScheduleSession(mentorship)}
            className="flex flex-col items-center justify-center px-3 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/25 border border-orange-500 transition-all duration-200"
          >
            <CalendarIcon className="w-5 h-5 mb-1" />
            <span className="text-xs font-black uppercase tracking-wider">Schedule</span>
          </button>
          <div className="flex flex-col items-center justify-center p-3 bg-gray-800 rounded-xl border border-gray-700">
            <PhoneIcon className="w-5 h-5 mb-1 text-gray-400" />
            <span className="text-gray-400 text-xs font-medium">0 battles</span>
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
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-2xl border border-orange-500/30 p-6 hover:shadow-orange-500/10 transition-all duration-300">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center border-2 border-orange-500">
                {otherUser.avatar ? (
                  <img 
                    src={otherUser.avatar} 
                    alt={otherUser.name}
                    className="w-14 h-14 rounded-xl object-cover"
                  />
                ) : (
                  <UserGroupIcon className="w-7 h-7 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-black text-white uppercase tracking-wider">
                  {otherUser.name}
                </h4>
                <p className="text-sm text-orange-400 font-bold uppercase tracking-wider">
                  {isReceived ? 'Seeks Elite Command Training' : 'Alliance Request Sent'}
                </p>
                <p className="text-xs text-gray-400 mt-1 font-medium">
                  ⚔️ {new Date(request.requestedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className={clsx(
                'px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border',
                request.status === 'pending' ? 'bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                request.status === 'accepted' ? 'bg-gradient-to-r from-green-600/20 to-green-500/20 text-green-400 border-green-500/30' :
                'bg-gradient-to-r from-red-600/20 to-red-500/20 text-red-400 border-red-500/30'
              )}>
                {request.status}
              </span>
            </div>
          </div>

          {request.message && (
            <div className="mt-4 p-4 bg-gray-800 rounded-xl border border-gray-700">
              <p className="text-sm text-gray-300 font-medium italic">"{request.message}"</p>
            </div>
          )}

          {showActions && isReceived && request.status === 'pending' && (
            <div className="mt-6 flex items-center space-x-3">
              <button
                onClick={() => handleResponse('accept')}
                disabled={responding}
                className="flex-1 inline-flex justify-center items-center px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-black uppercase tracking-wider hover:shadow-lg hover:shadow-green-500/25 border border-green-500 transition-all duration-200 disabled:opacity-50"
              >
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                Accept Alliance
              </button>
              <button
                onClick={() => handleResponse('reject')}
                disabled={responding}
                className="flex-1 inline-flex justify-center items-center px-4 py-3 bg-gray-800 text-gray-300 rounded-xl font-black uppercase tracking-wider hover:bg-gray-700 border border-gray-700 hover:border-red-500/50 transition-all duration-200 disabled:opacity-50"
              >
                <XCircleIcon className="w-5 h-5 mr-2" />
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Battle Command Center Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white uppercase tracking-wider mb-4">
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">BATTLE</span> COMMAND CENTER
          </h1>
          <p className="text-gray-300 font-medium text-lg">
            Command your elite alliances and strategic battle sessions
          </p>
        </div>

        {/* Battle Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Active Alliances"
              value={activeMentorships.length}
              icon={UserGroupIcon}
            />
            <StatCard
              title="Alliance Requests"
              value={pendingRequests.length}
              subtitle={isMentor ? "Received" : "Sent"}
              icon={ClockIcon}
            />
            <StatCard
              title="Battle Sessions"
              value="0"
              subtitle="This month"
              icon={PhoneIcon}
            />
            <StatCard
              title="Battle Rating"
              value="N/A"
              icon={StarIcon}
            />
          </div>
        )}

        {/* Battle Command Navigation */}
        <div className="border-b border-orange-500/30 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Command Overview', icon: AcademicCapIcon },
              { id: 'mentorships', name: 'Active Alliances', icon: UserGroupIcon },
              { id: 'sessions', name: 'Battle Sessions', icon: CalendarIcon },
              { id: 'requests', name: 'Alliance Requests', icon: ExclamationCircleIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex items-center py-3 px-2 border-b-2 font-black text-sm uppercase tracking-wider transition-all duration-200',
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-orange-500/50'
                )}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                {tab.name}
                {tab.id === 'requests' && pendingRequests.length > 0 && (
                  <span className="ml-2 bg-gradient-to-r from-red-600 to-red-700 text-white py-1 px-2 rounded-xl text-xs font-black">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Battle Quick Actions */}
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-2xl border border-orange-500/30 p-6">
              <h2 className="text-xl font-black text-white uppercase tracking-wider mb-6">
                <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">QUICK</span> BATTLE COMMANDS
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="flex items-center p-4 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 hover:border-orange-500/50 transition-all duration-200">
                  <PlusIcon className="w-6 h-6 mr-3 text-orange-500" />
                  <span className="text-sm font-black text-gray-300 uppercase tracking-wider">
                    {isMentor ? 'Recruit Warriors' : 'Find Elite Commander'}
                  </span>
                </button>
                <button 
                  onClick={() => {
                    if (activeMentorships.length > 0) {
                      handleScheduleSession(); // Let user choose from dropdown
                    } else {
                      toast.error('You need an active alliance to schedule a battle session');
                    }
                  }}
                  className="flex items-center p-4 bg-gradient-to-r from-orange-600 to-red-600 border border-orange-500 rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-200"
                >
                  <CalendarIcon className="w-6 h-6 mr-3 text-white" />
                  <span className="text-sm font-black text-white uppercase tracking-wider">Schedule Battle</span>
                </button>
                <button className="flex items-center p-4 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 hover:border-orange-500/50 transition-all duration-200">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 mr-3 text-orange-500" />
                  <span className="text-sm font-black text-gray-300 uppercase tracking-wider">Battle Comms</span>
                </button>
              </div>
            </div>

            {/* Battle Activity Log */}
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-2xl border border-orange-500/30 p-6">
              <h2 className="text-xl font-black text-white uppercase tracking-wider mb-6">
                <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">RECENT</span> BATTLE ACTIVITY
              </h2>
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-orange-500">
                  <ClockIcon className="w-8 h-8 text-white" />
                </div>
                <p className="text-gray-400 font-medium">No recent battle activity</p>
                <p className="text-gray-500 text-sm mt-1">Your battle log will appear here</p>
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
