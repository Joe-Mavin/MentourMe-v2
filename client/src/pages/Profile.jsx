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

              {/* Battle Stats */}
              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-700">
                <div className="text-center">
                  <p className="text-3xl font-black text-orange-400">
                    {user?.menteeCount || user?.mentorCount || 0}
                  </p>
                  <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">
                    {user?.role === 'mentor' ? 'Warriors Led' : 'Commanders'}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center">
                    <StarIcon className="w-5 h-5 text-yellow-500 mr-2" />
                    <p className="text-3xl font-black text-yellow-400">
                      {user?.rating ? user.rating.toFixed(1) : 'N/A'}
                    </p>
                  </div>
                  <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Battle Rating</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Warrior Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Battle Information */}
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 p-8 shadow-2xl">
            <div className="mb-8">
              <h3 className="text-2xl font-black text-white uppercase tracking-wider">
                <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                  PERSONAL BATTLE
                </span> INFORMATION
              </h3>
            </div>
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Warrior Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
                  />
                ) : (
                  <div className="flex items-center space-x-3 bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-700">
                    <UserCircleIcon className="h-5 w-5 text-orange-500" />
                    <span className="text-white font-medium">{user?.name}</span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Battle Communications</label>
                <div className="flex items-center space-x-3 bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-700">
                  <EnvelopeIcon className="h-5 w-5 text-orange-500" />
                  <span className="text-white font-medium">{user?.email}</span>
                  <span className="text-xs text-gray-500 font-medium">(Permanent Battle ID)</span>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Emergency Contact</label>
                {editing ? (
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
                    placeholder="Enter emergency contact number"
                  />
                ) : (
                  <div className="flex items-center space-x-3 bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-700">
                    <PhoneIcon className="h-5 w-5 text-orange-500" />
                    <span className="text-white font-medium">{user?.phone || 'Not provided'}</span>
                  </div>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Battle Territory</label>
                {editing ? (
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
                    placeholder="Enter your battle territory"
                  />
                ) : (
                  <div className="flex items-center space-x-3 bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-700">
                    <MapPinIcon className="h-5 w-5 text-orange-500" />
                    <span className="text-white font-medium">{user?.location || 'Territory Unknown'}</span>
                  </div>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Battle Biography</label>
                {editing ? (
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
                    rows={4}
                    placeholder="Share your warrior story and battle experience..."
                  />
                ) : (
                  <div className="bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-700">
                    <p className="text-white font-medium">
                      {user?.bio || 'No battle story shared yet.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Joined Date */}
              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Enlisted Since</label>
                <div className="flex items-center space-x-3 bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-700">
                  <CalendarIcon className="h-5 w-5 text-orange-500" />
                  <span className="text-white font-medium">
                    {user?.createdAt 
                      ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })
                      : 'Unknown enlistment date'
                    }
                  </span>
                </div>
              </div>

              {/* Action Buttons for Editing */}
              {editing && (
                <div className="flex space-x-4 pt-6 border-t border-gray-700">
                  <button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-black hover:shadow-lg hover:shadow-green-500/25 transition-all duration-200 uppercase tracking-wider border border-green-500 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline-block mr-3"></div>
                        UPDATING PROFILE...
                      </>
                    ) : (
                      'SAVE BATTLE DATA'
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-8 py-4 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl font-black hover:shadow-lg hover:shadow-gray-500/25 transition-all duration-200 uppercase tracking-wider border border-gray-600"
                  >
                    CANCEL MODIFICATIONS
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Battle Configuration Summary */}
          {onboardingData && (
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 p-8 shadow-2xl">
              <div className="mb-8">
                <h3 className="text-2xl font-black text-white uppercase tracking-wider">
                  <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                    BATTLE CONFIGURATION
                  </span> & OBJECTIVES
                </h3>
              </div>
              <div className="space-y-8">
                {/* Goals */}
                {onboardingData.goals && onboardingData.goals.length > 0 && (
                  <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Victory Objectives</label>
                    <div className="flex flex-wrap gap-3">
                      {onboardingData.goals.map((goal, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-black bg-gradient-to-r from-blue-600 to-blue-700 text-white border border-blue-500 uppercase tracking-wider"
                        >
                          🎯 {goal}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Struggles */}
                {onboardingData.struggles && onboardingData.struggles.length > 0 && (
                  <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Battle Challenges</label>
                    <div className="flex flex-wrap gap-3">
                      {onboardingData.struggles.map((struggle, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-black bg-gradient-to-r from-orange-600 to-red-600 text-white border border-orange-500 uppercase tracking-wider"
                        >
                          ⚔️ {struggle}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Availability */}
                {onboardingData.availability && onboardingData.availability.length > 0 && (
                  <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Battle Readiness Schedule</label>
                    <div className="flex flex-wrap gap-3">
                      {onboardingData.availability.map((day, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-black bg-gradient-to-r from-green-600 to-green-700 text-white border border-green-500 uppercase tracking-wider"
                        >
                          📅 {day}
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