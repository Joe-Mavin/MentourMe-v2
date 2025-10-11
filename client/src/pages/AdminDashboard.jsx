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
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-6"></div>
          <p className="text-gray-300 font-black text-xl uppercase tracking-wider">Loading Elite Command Center...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'COMMAND OVERVIEW', icon: Cog6ToothIcon },
    { id: 'mentorships', name: 'WARRIOR COMMAND', icon: AcademicCapIcon },
  ];

  return (
    <div className="min-h-screen bg-black text-white space-y-8">
      {/* Header */}
      <div className="relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,69,0,0.1)_0%,transparent_50%)]"></div>
        
        <div className="relative z-10">
          <h1 className="text-5xl font-black text-white uppercase tracking-wider mb-4">
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              👑 ELITE
            </span> COMMAND CENTER
          </h1>
          <p className="text-xl text-gray-300 font-bold">
            Supreme control over warriors, commanders, and battle arena operations
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-orange-500/30">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center py-4 px-6 border-b-4 font-black text-lg uppercase tracking-wider transition-all duration-200',
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-400 bg-gradient-to-t from-orange-900/20 to-transparent'
                  : 'border-transparent text-gray-400 hover:text-orange-400 hover:border-orange-500/50'
              )}
            >
              <tab.icon className="w-6 h-6 mr-3" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-10">

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 p-6 shadow-2xl hover:border-orange-500/50 transition-all duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center border-2 border-blue-500">
                  <UsersIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="ml-6 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-bold text-gray-400 truncate uppercase tracking-wider">
                    Total Warriors
                  </dt>
                  <dd className="text-3xl font-black text-white">
                    {stats.users.user + stats.users.mentor + stats.users.admin}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 p-6 shadow-2xl hover:border-orange-500/50 transition-all duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-800 rounded-xl flex items-center justify-center border-2 border-green-500">
                  <UserGroupIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="ml-6 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-bold text-gray-400 truncate uppercase tracking-wider">
                    Elite Commanders
                  </dt>
                  <dd className="text-3xl font-black text-white">
                    {stats.mentors.approved}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 p-6 shadow-2xl hover:border-orange-500/50 transition-all duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl flex items-center justify-center border-2 border-yellow-500">
                  <ClockIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="ml-6 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-bold text-gray-400 truncate uppercase tracking-wider">
                    Awaiting Orders
                  </dt>
                  <dd className="text-3xl font-black text-white">
                    {stats.mentors.pending}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 p-6 shadow-2xl hover:border-orange-500/50 transition-all duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center border-2 border-purple-500">
                  <CheckCircleIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="ml-6 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-bold text-gray-400 truncate uppercase tracking-wider">
                    Battle Missions
                  </dt>
                  <dd className="text-3xl font-black text-white">
                    {Object.values(stats.tasks).reduce((sum, count) => sum + count, 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Commander Approvals */}
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 p-8 shadow-2xl">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-white uppercase tracking-wider">
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              PENDING COMMANDER
            </span> APPROVALS
          </h2>
        </div>
        <div>
          {pendingMentors.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-500">
                <CheckCircleIcon className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-black text-white mb-3 uppercase tracking-wider">All Applications Processed</h3>
              <p className="text-gray-300 font-medium">
                No warriors await commander approval at this time
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingMentors.map((mentor) => (
                <div key={mentor.id} className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700 hover:border-orange-500/50 transition-all duration-200">
                  <div className="flex items-start space-x-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center border-2 border-orange-500">
                        <span className="text-white font-black text-xl">
                          {mentor.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-wider">
                        {mentor.name}
                      </h3>
                      <p className="text-orange-400 font-medium">{mentor.email}</p>
                      <p className="text-sm text-gray-400 font-medium">
                        Applied for Command: {new Date(mentor.createdAt).toLocaleDateString()}
                      </p>
                      {mentor.onboardingData?.experience && (
                        <p className="text-sm text-gray-300 mt-3 max-w-md font-medium">
                          {mentor.onboardingData.experience.substring(0, 150)}
                          {mentor.onboardingData.experience.length > 150 && '...'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => approveMentor(mentor.id, true)}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-black hover:shadow-lg hover:shadow-green-500/25 transition-all duration-200 uppercase tracking-wider border border-green-500"
                    >
                      APPROVE
                    </button>
                    <button
                      onClick={() => approveMentor(mentor.id, false)}
                      className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-black hover:shadow-lg hover:shadow-red-500/25 transition-all duration-200 uppercase tracking-wider border border-red-500"
                    >
                      REJECT
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Elite Command Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 p-8 shadow-2xl hover:border-orange-500/50 transition-all duration-200 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-blue-500">
            <UsersIcon className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-xl font-black text-white mb-3 uppercase tracking-wider">Warrior Registry</h3>
          <p className="text-gray-300 mb-6 font-medium">
            Command and oversee all platform warriors
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-black hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 uppercase tracking-wider border border-blue-500">
            VIEW WARRIORS
          </button>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 p-8 shadow-2xl hover:border-orange-500/50 transition-all duration-200 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-500">
            <UserGroupIcon className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-xl font-black text-white mb-3 uppercase tracking-wider">Battle Rooms</h3>
          <p className="text-gray-300 mb-6 font-medium">
            Control community war rooms and battle moderation
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-black hover:shadow-lg hover:shadow-green-500/25 transition-all duration-200 uppercase tracking-wider border border-green-500">
            MANAGE ROOMS
          </button>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 p-8 shadow-2xl hover:border-orange-500/50 transition-all duration-200 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-purple-500">
            <CheckCircleIcon className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-xl font-black text-white mb-3 uppercase tracking-wider">Battle Analytics</h3>
          <p className="text-gray-300 mb-6 font-medium">
            Monitor detailed arena usage and warrior statistics
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-black hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200 uppercase tracking-wider border border-purple-500">
            VIEW ANALYTICS
          </button>
        </div>
      </div>
        </div>
      )}

      {/* Warrior Command Tab */}
      {activeTab === 'mentorships' && (
        <MentorshipManagement />
      )}
    </div>
  );
};

export default AdminDashboard;

