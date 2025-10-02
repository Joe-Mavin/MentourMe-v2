import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, onboardingAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  UserCircleIcon,
  PencilIcon,
  CheckCircleIcon,
  CameraIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

const Profile = () => {
  const { user, updateProfile: updateAuthProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [onboardingData, setOnboardingData] = useState(null);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    location: user?.location || '',
    avatar: user?.avatar || ''
  });

  useEffect(() => {
    loadOnboardingData();
  }, []);

  const loadOnboardingData = async () => {
    try {
      const response = await onboardingAPI.get();
      setOnboardingData(response.data.data.onboardingData);
    } catch (error) {
      console.error('Failed to load onboarding data:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      await authAPI.updateProfile(profileData);
      await updateAuthProfile(profileData);
      toast.success('Profile updated successfully!');
      setEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      location: user?.location || '',
      avatar: user?.avatar || ''
    });
    setEditing(false);
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Manage your personal information and preferences</p>
        </div>
        
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="btn btn-outline"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-body text-center">
              {/* Avatar */}
              <div className="relative mb-4">
                <div className="w-32 h-32 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="w-20 h-20 text-gray-400" />
                  )}
                </div>
                
                {editing && (
                  <button className="absolute bottom-0 right-1/2 transform translate-x-1/2 translate-y-1/2 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700">
                    <CameraIcon className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Basic Info */}
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                {user?.name}
              </h2>
              <p className="text-sm text-gray-600 capitalize mb-2">
                {user?.role}
              </p>
              
              {user?.verified && (
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-4">
                  <CheckCircleIcon className="w-3 h-3 mr-1" />
                  Verified
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">
                    {user?.menteeCount || user?.mentorCount || 0}
                  </p>
                  <p className="text-xs text-gray-600">
                    {user?.role === 'mentor' ? 'Mentees' : 'Mentors'}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center">
                    <StarIcon className="w-4 h-4 text-yellow-500 mr-1" />
                    <p className="text-lg font-semibold text-gray-900">
                      {user?.rating ? user.rating.toFixed(1) : 'N/A'}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600">Rating</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
            </div>
            <div className="card-body space-y-4">
              {/* Name */}
              <div>
                <label className="form-label">Full Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="input"
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <UserCircleIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{user?.name}</span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="form-label">Email Address</label>
                <div className="flex items-center space-x-2">
                  <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">{user?.email}</span>
                  <span className="text-xs text-gray-500">(Cannot be changed)</span>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="form-label">Phone Number</label>
                {editing ? (
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="input"
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <PhoneIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{user?.phone || 'Not provided'}</span>
                  </div>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="form-label">Location</label>
                {editing ? (
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="input"
                    placeholder="Enter your location"
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <MapPinIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{user?.location || 'Not provided'}</span>
                  </div>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="form-label">Bio</label>
                {editing ? (
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="input"
                    rows={3}
                    placeholder="Tell others about yourself..."
                  />
                ) : (
                  <p className="text-gray-900">
                    {user?.bio || 'No bio provided yet.'}
                  </p>
                )}
              </div>

              {/* Joined Date */}
              <div>
                <label className="form-label">Member Since</label>
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-900">
                    {user?.createdAt 
                      ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })
                      : 'Unknown'
                    }
                  </span>
                </div>
              </div>

              {/* Action Buttons for Editing */}
              {editing && (
                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" color="white" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Onboarding Summary */}
          {onboardingData && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Preferences & Goals</h3>
              </div>
              <div className="card-body space-y-4">
                {/* Goals */}
                {onboardingData.goals && onboardingData.goals.length > 0 && (
                  <div>
                    <label className="form-label">Goals</label>
                    <div className="flex flex-wrap gap-2">
                      {onboardingData.goals.map((goal, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                        >
                          {goal}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Struggles */}
                {onboardingData.struggles && onboardingData.struggles.length > 0 && (
                  <div>
                    <label className="form-label">Areas for Improvement</label>
                    <div className="flex flex-wrap gap-2">
                      {onboardingData.struggles.map((struggle, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800"
                        >
                          {struggle}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Availability */}
                {onboardingData.availability && onboardingData.availability.length > 0 && (
                  <div>
                    <label className="form-label">Available Days</label>
                    <div className="flex flex-wrap gap-2">
                      {onboardingData.availability.map((day, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;