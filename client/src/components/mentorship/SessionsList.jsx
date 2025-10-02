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
import api from '../../services/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const SessionsList = ({ mentorshipId = null }) => {
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
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-red-100 text-red-800'
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading sessions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'upcoming', name: 'Upcoming' },
            { id: 'completed', name: 'Completed' },
            { id: 'cancelled', name: 'Cancelled' },
            { id: 'all', name: 'All' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={clsx(
                'py-2 px-1 border-b-2 font-medium text-sm',
                filter === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
              <div key={session.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {session.title}
                      </h3>
                      <span className={clsx(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        getStatusColor(session.status)
                      )}>
                        {session.status.replace('_', ' ')}
                      </span>
                    </div>

                    {session.description && (
                      <p className="text-gray-600 mb-3">{session.description}</p>
                    )}

                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{date}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>{time} ({session.duration} min)</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MeetingIcon className="w-4 h-4" />
                        <span className="capitalize">{session.meetingType.replace('_', ' ')}</span>
                      </div>
                    </div>

                    {/* Participants */}
                    <div className="flex items-center space-x-4 mt-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                          {session.mentor?.avatar ? (
                            <img 
                              src={session.mentor.avatar} 
                              alt={session.mentor.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <UserGroupIcon className="w-3 h-3 text-gray-500" />
                          )}
                        </div>
                        <span className="text-xs text-gray-600">{session.mentor?.name}</span>
                      </div>
                      <span className="text-gray-400">↔</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                          {session.mentee?.avatar ? (
                            <img 
                              src={session.mentee.avatar} 
                              alt={session.mentee.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <UserGroupIcon className="w-3 h-3 text-gray-500" />
                          )}
                        </div>
                        <span className="text-xs text-gray-600">{session.mentee?.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {session.status === 'scheduled' && (
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleStatusUpdate(session.id, 'confirmed')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Confirm session"
                      >
                        <CheckCircleIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(session.id, 'cancelled')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Cancel session"
                      >
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <CalendarIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Sessions Found
          </h3>
          <p className="text-gray-600">
            {filter === 'upcoming' 
              ? "You don't have any upcoming sessions scheduled."
              : `No ${filter} sessions found.`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default SessionsList;
