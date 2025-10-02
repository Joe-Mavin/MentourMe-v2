import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import MentorshipManagement from '../components/admin/MentorshipManagement';
import { 
  UsersIcon, 
  UserGroupIcon, 
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingMentors, setPendingMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load dashboard statistics
      const statsResponse = await adminAPI.getStats();
      setStats(statsResponse.data.data);

      // Load pending mentors
      const mentorsResponse = await adminAPI.getPendingMentors({ limit: 5 });
      setPendingMentors(mentorsResponse.data.data.mentors);

    } catch (error) {
      toast.error('Failed to load admin dashboard data');
      console.error('Admin dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveMentor = async (mentorId, approved) => {
    try {
      await adminAPI.approveMentor(mentorId, { approved });
      toast.success(`Mentor ${approved ? 'approved' : 'rejected'} successfully`);
      loadDashboardData();
    } catch (error) {
      toast.error('Failed to update mentor status');
      console.error('Approve mentor error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading admin dashboard..." />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Cog6ToothIcon },
    { id: 'mentorships', name: 'Mentorships', icon: AcademicCapIcon },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-lg text-gray-600">
          Manage users, mentors, and platform activity
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
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
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Users
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.users.user + stats.users.mentor + stats.users.admin}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Mentors
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.mentors.approved}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending Approvals
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.mentors.pending}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Tasks
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {Object.values(stats.tasks).reduce((sum, count) => sum + count, 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Mentor Approvals */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">Pending Mentor Approvals</h2>
        </div>
        <div className="card-body">
          {pendingMentors.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pending approvals</h3>
              <p className="mt-1 text-sm text-gray-500">
                All mentor applications have been processed
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingMentors.map((mentor) => (
                <div key={mentor.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-medium text-sm">
                          {mentor.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {mentor.name}
                      </h3>
                      <p className="text-sm text-gray-500">{mentor.email}</p>
                      <p className="text-xs text-gray-400">
                        Applied: {new Date(mentor.createdAt).toLocaleDateString()}
                      </p>
                      {mentor.onboardingData?.experience && (
                        <p className="text-sm text-gray-600 mt-2 max-w-md">
                          {mentor.onboardingData.experience.substring(0, 150)}
                          {mentor.onboardingData.experience.length > 150 && '...'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => approveMentor(mentor.id, true)}
                      className="btn btn-sm btn-success"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => approveMentor(mentor.id, false)}
                      className="btn btn-sm btn-danger"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-body text-center">
            <UsersIcon className="mx-auto h-8 w-8 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Manage Users</h3>
            <p className="text-sm text-gray-600 mb-4">
              View and manage all platform users
            </p>
            <button className="btn btn-primary">View Users</button>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <UserGroupIcon className="mx-auto h-8 w-8 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Community Rooms</h3>
            <p className="text-sm text-gray-600 mb-4">
              Manage community rooms and moderation
            </p>
            <button className="btn btn-primary">Manage Rooms</button>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <CheckCircleIcon className="mx-auto h-8 w-8 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Platform Analytics</h3>
            <p className="text-sm text-gray-600 mb-4">
              View detailed platform usage statistics
            </p>
            <button className="btn btn-primary">View Analytics</button>
          </div>
        </div>
      </div>
        </div>
      )}

      {/* Mentorships Tab */}
      {activeTab === 'mentorships' && (
        <MentorshipManagement />
      )}
    </div>
  );
};

export default AdminDashboard;

