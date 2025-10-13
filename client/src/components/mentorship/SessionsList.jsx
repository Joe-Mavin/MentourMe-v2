import React, { useState, useEffect, useCallback } from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  VideoCameraIcon,
  PhoneIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const SessionsList = ({ mentorshipId = null }) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filter === 'upcoming') {
        params.append('upcoming', 'true');
        params.append('status', 'scheduled,confirmed');
      } else if (filter !== 'all') {
        params.append('status', filter);
      }

      console.log('Fetching sessions with params:', params.toString());
      const response = await api.get(`/mentorship/sessions?${params.toString()}`);
      setSessions(response.data.data.sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
      // Fallback to empty array on error
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [filter, mentorshipId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Listen for real-time session updates
  useEffect(() => {
    const socket = window.socket;
    if (socket) {
      const handleSessionUpdate = (data) => {
        console.log('📅 Real-time session update:', data);
        if (data.type === 'session_created') {
          // Refresh sessions list
          fetchSessions();
        }
      };

      socket.on('session_update', handleSessionUpdate);
      
      return () => {
        socket.off('session_update', handleSessionUpdate);
      };
    }
  }, [fetchSessions]);

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-gradient-to-r from-blue-600/20 to-blue-500/20 text-blue-400 border border-blue-500/30',
      confirmed: 'bg-gradient-to-r from-green-600/20 to-green-500/20 text-green-400 border border-green-500/30',
      in_progress: 'bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      completed: 'bg-gradient-to-r from-gray-600/20 to-gray-500/20 text-gray-400 border border-gray-500/30',
      cancelled: 'bg-gradient-to-r from-red-600/20 to-red-500/20 text-red-400 border border-red-500/30',
      no_show: 'bg-gradient-to-r from-red-600/20 to-red-500/20 text-red-400 border border-red-500/30'
    };
    return colors[status] || colors.scheduled;
  };

  const getMeetingTypeIcon = (type) => {
    switch (type) {
      case 'video': return VideoCameraIcon;
      case 'audio': return PhoneIcon;
      case 'in_person': return UserGroupIcon;
      default: return VideoCameraIcon;
    }
  };

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const handleStatusUpdate = async (sessionId, newStatus) => {
    try {
      await api.put(`/api/sessions/${sessionId}`, { status: newStatus });
      toast.success(`Session ${newStatus} successfully`);
      fetchSessions();
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error('Failed to update session');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
        <p className="mt-2 text-gray-300 font-medium">Loading battle sessions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Battle Session Filter Tabs */}
      <div className="border-b border-orange-500/30">
        <nav className="-mb-px flex flex-wrap gap-2 sm:gap-0 sm:space-x-6">
          {[
            { id: 'upcoming', name: 'Upcoming Battles' },
            { id: 'completed', name: 'Victory Log' },
            { id: 'cancelled', name: 'Cancelled' },
            { id: 'all', name: 'All Sessions' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={clsx(
                'py-2 px-3 border-b-2 font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 whitespace-nowrap',
                filter === tab.id
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-orange-500/50'
              )}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Sessions List */}
      {sessions.length > 0 ? (
        <div className="space-y-4">
          {sessions.map((session) => {
            const { date, time } = formatDateTime(session.scheduledAt);
            const MeetingIcon = getMeetingTypeIcon(session.meetingType);
            
            return (
              <div key={session.id} className="bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-2xl border border-orange-500/30 p-4 sm:p-6 hover:shadow-orange-500/10 transition-all duration-300">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                      <h3 className="text-lg font-black text-white uppercase tracking-wider">
                        ⚔️ {session.title}
                      </h3>
                      <span className={clsx(
                        'px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider self-start',
                        getStatusColor(session.status)
                      )}>
                        {session.status.replace('_', ' ')}
                      </span>
                    </div>

                    {session.description && (
                      <p className="text-gray-300 mb-4 font-medium">{session.description}</p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-400 mb-4">
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="w-4 h-4 text-orange-500" />
                        <span className="font-medium">{date}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="w-4 h-4 text-orange-500" />
                        <span className="font-medium">{time} ({session.duration} min)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MeetingIcon className="w-4 h-4 text-orange-500" />
                        <span className="capitalize font-medium">{session.meetingType.replace('_', ' ')}</span>
                      </div>
                    </div>

                    {/* Battle Participants */}
                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center border border-orange-500">
                              {session.mentor?.avatar ? (
                                <img 
                                  src={session.mentor.avatar} 
                                  alt={session.mentor.name}
                                  className="w-8 h-8 rounded-xl object-cover"
                                />
                              ) : (
                                <UserGroupIcon className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-300 font-medium">
                                {session.mentor?.name}
                              </span>
                              {user?.id === session.mentorId && (
                                <span className="text-xs text-blue-400 font-black uppercase tracking-wider">(You - Elite Commander)</span>
                              )}
                            </div>
                          </div>
                          <span className="text-orange-500 font-black hidden sm:block">⚔️</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center border border-orange-500">
                              {session.mentee?.avatar ? (
                                <img 
                                  src={session.mentee.avatar} 
                                  alt={session.mentee.name}
                                  className="w-8 h-8 rounded-xl object-cover"
                                />
                              ) : (
                                <UserGroupIcon className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-300 font-medium">
                                {session.mentee?.name}
                              </span>
                              {user?.id === session.menteeId && (
                                <span className="text-xs text-green-400 font-black uppercase tracking-wider">(You - Battle Apprentice)</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Battle Session Indicator */}
                        <div className="text-xs text-gray-400 bg-gray-900 px-3 py-2 rounded-lg border border-gray-600">
                          <span className="font-black uppercase tracking-wider">Battle Session with:</span>
                          <div className="text-orange-400 font-bold mt-1">
                            {user?.id === session.mentorId ? session.mentee?.name : session.mentor?.name}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Battle Action Buttons */}
                  {session.status === 'scheduled' && (
                    <div className="flex flex-col sm:flex-row gap-2 mt-4 lg:mt-0 lg:ml-4">
                      <button
                        onClick={() => handleStatusUpdate(session.id, 'confirmed')}
                        className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-black text-sm uppercase tracking-wider hover:shadow-lg hover:shadow-green-500/25 border border-green-500 transition-all duration-200"
                        title="Confirm battle session"
                      >
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        Confirm Battle
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(session.id, 'cancelled')}
                        className="flex items-center justify-center px-4 py-2 bg-gray-800 text-gray-300 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-gray-700 border border-gray-700 hover:border-red-500/50 transition-all duration-200"
                        title="Cancel battle session"
                      >
                        <XCircleIcon className="w-4 h-4 mr-2" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-orange-500/30 p-8 sm:p-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-orange-500">
            <CalendarIcon className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-wider mb-4">
            No Battle Sessions Found
          </h3>
          <p className="text-gray-300 font-medium">
            {filter === 'upcoming' 
              ? "You don't have any upcoming battle sessions scheduled."
              : `No ${filter === 'completed' ? 'victory log' : filter} sessions found.`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default SessionsList;
