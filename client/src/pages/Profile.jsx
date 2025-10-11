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
    <div className="min-h-screen bg-black text-white space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-wider">
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              WARRIOR
            </span> PROFILE
          </h1>
          <p className="mt-3 text-lg text-gray-300 font-medium">Command your personal battle information and combat preferences</p>
        </div>
        
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-black hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-200 uppercase tracking-wider border border-orange-500 hover:scale-105"
          >
            <PencilIcon className="h-5 w-5 mr-2" />
            MODIFY PROFILE
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 p-6 shadow-2xl">
            <div className="text-center">
              {/* Avatar */}
              <div className="relative mb-6">
                <div className="w-40 h-40 mx-auto bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center border-4 border-orange-500 shadow-2xl shadow-orange-500/25">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-40 h-40 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="w-24 h-24 text-white" />
                  )}
                </div>
                
                {editing && (
                  <button className="absolute bottom-2 right-1/2 transform translate-x-1/2 translate-y-1/2 bg-gradient-to-r from-orange-600 to-red-600 text-white p-3 rounded-full hover:shadow-lg hover:shadow-orange-500/25 border-2 border-orange-500">
                    <CameraIcon className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Basic Info */}
              <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wider">
                {user?.name}
              </h2>
              <p className="text-lg text-orange-400 capitalize mb-4 font-bold">
                {user?.role === 'mentor' ? '⚔️ COMMANDER' : user?.role === 'admin' ? '👑 ELITE' : '🗡️ WARRIOR'}
              </p>
              
              {user?.verified && (
                <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-black bg-green-600 text-white mb-6 border border-green-500 uppercase tracking-wider">
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                  BATTLE VERIFIED
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