import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  VideoCameraIcon,
  PhoneIcon,
  UserGroupIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';

const SessionScheduler = ({ mentorship, onClose, onSessionScheduled }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    duration: 60,
    meetingType: 'video'
  });
  const [loading, setLoading] = useState(false);
  const [minDateTime, setMinDateTime] = useState('');

  useEffect(() => {
    // Set minimum date/time to current time + 1 hour
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const minDate = now.toISOString().slice(0, 16);
    setMinDateTime(minDate);
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter a session title');
      return;
    }

    if (!formData.scheduledAt) {
      toast.error('Please select a date and time');
      return;
    }

    try {
      setLoading(true);
      
      const sessionData = {
        mentorshipId: mentorship.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        scheduledAt: formData.scheduledAt,
        duration: parseInt(formData.duration),
        meetingType: formData.meetingType
      };

      console.log('Scheduling session:', sessionData);
      const response = await api.post('/mentorship/sessions', sessionData);
      
      if (response.data.success) {
        toast.success('Session scheduled successfully!');
        onSessionScheduled && onSessionScheduled(response.data.data.session);
        onClose();
      }
    } catch (error) {
      console.error('Error scheduling session:', error);
      const errorMessage = error.response?.data?.message || 'Failed to schedule session';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const durationOptions = [
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' }
  ];

  const meetingTypeOptions = [
    { value: 'video', label: 'Video Call', icon: VideoCameraIcon },
    { value: 'audio', label: 'Audio Call', icon: PhoneIcon },
    { value: 'in_person', label: 'In Person', icon: UserGroupIcon }
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Schedule Session
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Mentorship Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              {mentorship.mentor?.avatar ? (
                <img 
                  src={mentorship.mentor.avatar} 
                  alt={mentorship.mentor.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <UserGroupIcon className="w-5 h-5 text-gray-500" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                Session with {mentorship.mentor?.name || mentorship.mentee?.name}
              </p>
              <p className="text-sm text-gray-500">
                Mentorship established {new Date(mentorship.respondedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Session Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., Career Planning Discussion"
              maxLength={100}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="What would you like to discuss in this session?"
              maxLength={500}
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date & Time *
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                  min={minDateTime}
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
                <CalendarIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration
              </label>
              <div className="relative">
                <select
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  {durationOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ClockIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Meeting Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Meeting Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {meetingTypeOptions.map(option => {
                const Icon = option.icon;
                return (
                  <label
                    key={option.value}
                    className={`relative flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      formData.meetingType === option.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="meetingType"
                      value={option.value}
                      checked={formData.meetingType === option.value}
                      onChange={(e) => handleInputChange('meetingType', e.target.value)}
                      className="sr-only"
                    />
                    <Icon className={`w-5 h-5 mr-3 ${
                      formData.meetingType === option.value
                        ? 'text-primary-600'
                        : 'text-gray-400'
                    }`} />
                    <span className={`text-sm font-medium ${
                      formData.meetingType === option.value
                        ? 'text-primary-900'
                        : 'text-gray-900'
                    }`}>
                      {option.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Scheduling...' : 'Schedule Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SessionScheduler;
