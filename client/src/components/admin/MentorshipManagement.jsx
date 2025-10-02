import React, { useState, useEffect } from 'react';
import { mentorshipAPI, usersAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  UserGroupIcon,
  UserPlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const MentorshipManagement = () => {
  const [unassignedMentees, setUnassignedMentees] = useState([]);
  const [availableMentors, setAvailableMentors] = useState([]);
  const [activeMentorships, setActiveMentorships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMentee, setSelectedMentee] = useState(null);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch unassigned mentees
      const menteesResponse = await mentorshipAPI.getUnassignedMentees();
      setUnassignedMentees(menteesResponse.data.data.unassignedMentees);

      // Fetch available mentors
      const mentorsResponse = await usersAPI.search({ role: 'mentor', approved: true });
      setAvailableMentors(mentorsResponse.data.data.users || []);

      // Fetch active mentorships
      const mentorshipsResponse = await mentorshipAPI.getActiveMentorships();
      setActiveMentorships(mentorshipsResponse.data.data.mentorships || []);

    } catch (error) {
      console.error('Failed to fetch mentorship data:', error);
      toast.error('Failed to load mentorship data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignMentee = async () => {
    if (!selectedMentee || !selectedMentor) {
      toast.error('Please select both a mentee and mentor');
      return;
    }

    setAssigning(true);
    try {
      await mentorshipAPI.adminAssignMentee({
        menteeId: selectedMentee.id,
        mentorId: selectedMentor.id,
        adminNotes: adminNotes.trim() || 'Admin assignment'
      });

      toast.success(`Successfully assigned ${selectedMentee.name} to ${selectedMentor.name}!`);
      
      // Reset form and refresh data
      setSelectedMentee(null);
      setSelectedMentor(null);
      setAdminNotes('');
      setShowAssignModal(false);
      fetchData();

    } catch (error) {
      console.error('Failed to assign mentee:', error);
      toast.error(error.response?.data?.message || 'Failed to assign mentee');
    } finally {
      setAssigning(false);
    }
  };

  const openAssignModal = (mentee) => {
    setSelectedMentee(mentee);
    setShowAssignModal(true);
  };

  const filteredMentees = unassignedMentees.filter(mentee =>
    mentee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mentee.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMentors = availableMentors.filter(mentor =>
    mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mentor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
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

  const MenteeCard = ({ mentee }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            {mentee.avatar ? (
              <img 
                src={mentee.avatar} 
                alt={mentee.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <UserGroupIcon className="w-6 h-6 text-gray-500" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {mentee.name}
            </h3>
            <p className="text-sm text-gray-500">{mentee.email}</p>
            <p className="text-xs text-gray-400 mt-1">
              Joined {new Date(mentee.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => openAssignModal(mentee)}
          className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <UserPlusIcon className="w-4 h-4 mr-2" />
          Assign Mentor
        </button>
      </div>


      {mentee.onboardingData && (
        <div className="mt-4 space-y-2">
          {mentee.onboardingData.goals && (
            <div>
              <span className="text-xs font-medium text-gray-500">Goals:</span>
              <p className="text-sm text-gray-700 line-clamp-1">{mentee.onboardingData.goals}</p>
            </div>
          )}
          {mentee.onboardingData.struggles && (
            <div>
              <span className="text-xs font-medium text-gray-500">Challenges:</span>
              <p className="text-sm text-gray-700 line-clamp-1">{mentee.onboardingData.struggles}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const MentorshipCard = ({ mentorship }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          {/* Mentor */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              {mentorship.mentor.avatar ? (
                <img 
                  src={mentorship.mentor.avatar} 
                  alt={mentorship.mentor.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <UserGroupIcon className="w-4 h-4 text-blue-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{mentorship.mentor.name}</p>
              <p className="text-xs text-blue-600">Mentor</p>
            </div>
          </div>

          <div className="text-gray-400">→</div>

          {/* Mentee */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              {mentorship.mentee.avatar ? (
                <img 
                  src={mentorship.mentee.avatar} 
                  alt={mentorship.mentee.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <UserGroupIcon className="w-4 h-4 text-green-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{mentorship.mentee.name}</p>
              <p className="text-xs text-green-600">Mentee</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            Active
          </span>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Started {new Date(mentorship.respondedAt).toLocaleDateString()}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mentorship Management</h2>
          <p className="text-gray-600">Assign mentees to mentors and manage relationships</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Unassigned Mentees"
          value={unassignedMentees.length}
          icon={ExclamationTriangleIcon}
          color="red"
        />
        <StatCard
          title="Available Mentors"
          value={availableMentors.length}
          icon={UserGroupIcon}
          color="blue"
        />
        <StatCard
          title="Active Mentorships"
          value={activeMentorships.length}
          icon={CheckCircleIcon}
          color="green"
        />
        <StatCard
          title="Success Rate"
          value="N/A"
          subtitle="Coming soon"
          icon={AdjustmentsHorizontalIcon}
          color="purple"
        />
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search mentees or mentors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Unassigned Mentees */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Unassigned Mentees ({filteredMentees.length})
        </h3>
        
        {filteredMentees.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredMentees.map((mentee) => (
              <MenteeCard key={mentee.id} mentee={mentee} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
            <CheckCircleIcon className="w-12 h-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              All Mentees Assigned!
            </h3>
            <p className="text-gray-600">
              Great job! All mentees have been assigned to mentors.
            </p>
          </div>
        )}
      </div>

      {/* Active Mentorships */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Active Mentorships ({activeMentorships.length})
        </h3>
        
        {activeMentorships.length > 0 ? (
          <div className="space-y-4">
            {activeMentorships.map((mentorship) => (
              <MentorshipCard key={mentorship.id} mentorship={mentorship} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
            <UserGroupIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Active Mentorships
            </h3>
            <p className="text-gray-600">
              Start by assigning mentees to available mentors.
            </p>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Assign Mentor to {selectedMentee?.name}
                </h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Mentee Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Selected Mentee</h4>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {selectedMentee?.avatar ? (
                      <img 
                        src={selectedMentee.avatar} 
                        alt={selectedMentee.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <UserGroupIcon className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedMentee?.name}</p>
                    <p className="text-sm text-gray-500">{selectedMentee?.email}</p>
                  </div>
                </div>
              </div>

              {/* Mentor Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Mentor
                </label>
                <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2">
                  {filteredMentors.map((mentor) => (
                    <button
                      key={mentor.id}
                      onClick={() => setSelectedMentor(mentor)}
                      className={clsx(
                        'w-full p-3 rounded-lg border-2 text-left transition-colors',
                        selectedMentor?.id === mentor.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          {mentor.avatar ? (
                            <img 
                              src={mentor.avatar} 
                              alt={mentor.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <UserGroupIcon className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{mentor.name}</p>
                          <p className="text-sm text-gray-500">{mentor.email}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes (optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Add any notes about this assignment..."
                  maxLength={500}
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {adminNotes.length}/500
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignMentee}
                  disabled={assigning || !selectedMentor}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {assigning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                      Assigning...
                    </>
                  ) : (
                    'Assign Mentor'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorshipManagement;
