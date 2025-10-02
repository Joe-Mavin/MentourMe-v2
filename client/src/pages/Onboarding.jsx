import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Select from 'react-select';
import { useAuth } from '../context/AuthContext';
import { onboardingAPI, authAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const schema = yup.object({
  age: yup
    .number()
    .typeError('Age must be a number')
    .min(13, 'You must be at least 13 years old')
    .max(120, 'Please enter a valid age')
    .required('Age is required'),
  goals: yup
    .array()
    .min(1, 'Please select at least one goal')
    .required('Goals are required'),
  struggles: yup
    .array()
    .min(1, 'Please select at least one struggle or challenge')
    .required('Struggles are required'),
  availability: yup
    .object()
    .required('Please select your availability'),
  timeZone: yup
    .string()
    .required('Please select your timezone'),
  preferredCommunicationStyle: yup
    .string()
    .required('Please select your preferred communication style'),
  interests: yup
    .array()
    .min(1, 'Please select at least one interest')
    .required('Interests are required'),
  experience: yup
    .string()
    .when('$userRole', {
      is: 'mentor',
      then: (schema) => schema.required('Please describe your experience'),
      otherwise: (schema) => schema,
    }),
});

const goalOptions = [
  { value: 'overcome_addiction', label: 'Overcome Addiction' },
  { value: 'build_confidence', label: 'Build Self-Confidence' },
  { value: 'career_development', label: 'Career Development' },
  { value: 'improve_relationships', label: 'Improve Relationships' },
  { value: 'stress_management', label: 'Stress Management' },
  { value: 'fitness_health', label: 'Fitness & Health' },
  { value: 'financial_goals', label: 'Financial Goals' },
  { value: 'education_learning', label: 'Education & Learning' },
  { value: 'work_life_balance', label: 'Work-Life Balance' },
  { value: 'personal_growth', label: 'Personal Growth' },
];

const struggleOptions = [
  { value: 'addiction_recovery', label: 'Addiction Recovery' },
  { value: 'social_anxiety', label: 'Social Anxiety' },
  { value: 'depression', label: 'Depression' },
  { value: 'procrastination', label: 'Procrastination' },
  { value: 'self_doubt', label: 'Self-Doubt' },
  { value: 'relationship_issues', label: 'Relationship Issues' },
  { value: 'time_management', label: 'Time Management' },
  { value: 'stress_burnout', label: 'Stress & Burnout' },
  { value: 'motivation', label: 'Lack of Motivation' },
  { value: 'perfectionism', label: 'Perfectionism' },
];

const interestOptions = [
  { value: 'fitness', label: 'Fitness' },
  { value: 'reading', label: 'Reading' },
  { value: 'meditation', label: 'Meditation' },
  { value: 'art', label: 'Art' },
  { value: 'music', label: 'Music' },
  { value: 'cooking', label: 'Cooking' },
  { value: 'travel', label: 'Travel' },
  { value: 'sports', label: 'Sports' },
  { value: 'technology', label: 'Technology' },
  { value: 'entrepreneurship', label: 'Entrepreneurship' },
  { value: 'writing', label: 'Writing' },
  { value: 'photography', label: 'Photography' },
];

const communicationStyles = [
  { value: 'supportive', label: 'Supportive & Encouraging' },
  { value: 'direct', label: 'Direct & Straightforward' },
  { value: 'motivational', label: 'Motivational & Energetic' },
  { value: 'analytical', label: 'Analytical & Data-Driven' },
];

const timeZones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'UTC', label: 'UTC' },
];

const daysOfWeek = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const Onboarding = () => {
  const { user, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [existingData, setExistingData] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    context: { userRole: user?.role },
    defaultValues: {
      availability: {},
      goals: [],
      struggles: [],
      interests: [],
      timeZone: 'America/New_York',
      preferredCommunicationStyle: 'supportive',
    },
  });

  const availability = watch('availability');

  // Load existing onboarding data if any
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const response = await onboardingAPI.get();
        const data = response.data.data.onboardingData;
        
        if (data) {
          setExistingData(data);
          
          // Populate form with existing data
          setValue('age', data.age);
          setValue('goals', data.goals || []);
          setValue('struggles', data.struggles || []);
          setValue('interests', data.interests || []);
          setValue('availability', data.availability || {});
          setValue('timeZone', data.timeZone || 'America/New_York');
          setValue('preferredCommunicationStyle', data.preferredCommunicationStyle || 'supportive');
          setValue('experience', data.experience || '');
        }
      } catch (error) {
        // No existing data, which is fine for new users
        console.log('No existing onboarding data found');
      }
    };

    loadExistingData();
  }, [setValue]);

  const handleAvailabilityChange = (day, timeSlot, value) => {
    const currentAvailability = availability || {};
    
    if (!currentAvailability[day]) {
      currentAvailability[day] = [];
    }

    if (timeSlot === 'start') {
      currentAvailability[day][0] = value;
    } else {
      currentAvailability[day][1] = value;
    }

    setValue('availability', { ...currentAvailability });
  };

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      // Transform data for API
      const submitData = {
        ...data,
        goals: data.goals.map(g => typeof g === 'object' ? g.value : g),
        struggles: data.struggles.map(s => typeof s === 'object' ? s.value : s),
        interests: data.interests.map(i => typeof i === 'object' ? i.value : i),
      };

      await onboardingAPI.submit(submitData);
      
      // ✅ FIX: Refresh user profile data to include onboarding information
      const refreshResult = await refreshUserData();
      if (!refreshResult.success) {
        console.warn('Could not refresh profile after onboarding:', refreshResult.error);
      }

      toast.success('Onboarding completed successfully!');
      
      // ✅ FIX: Navigate to role-based dashboard after onboarding completion
      const userRole = user?.role || 'user';
      navigate(`/dashboard/${userRole}`, { replace: true });
    } catch (error) {
      toast.error('Failed to save onboarding data. Please try again.');
      console.error('Onboarding error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatSelectValue = (options, values) => {
    if (!values) return [];
    return values.map(value => 
      options.find(option => option.value === value) || { value, label: value }
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome to MentourMe! 🎉
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Let's set up your profile to find the perfect {user?.role === 'mentor' ? 'mentees' : 'mentor'} for you.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
          </div>
          <div className="card-body space-y-6">
            {/* Age */}
            <div>
              <label className="form-label">Age</label>
              <input
                {...register('age')}
                type="number"
                min="13"
                max="120"
                className={`input ${errors.age ? 'input-error' : ''}`}
                placeholder="Enter your age"
              />
              {errors.age && (
                <p className="form-error">{errors.age.message}</p>
              )}
            </div>

            {/* Timezone */}
            <div>
              <label className="form-label">Timezone</label>
              <Controller
                name="timeZone"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={timeZones}
                    value={timeZones.find(tz => tz.value === field.value)}
                    onChange={(selected) => field.onChange(selected?.value)}
                    placeholder="Select your timezone"
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                )}
              />
              {errors.timeZone && (
                <p className="form-error">{errors.timeZone.message}</p>
              )}
            </div>

            {/* Communication Style */}
            <div>
              <label className="form-label">Preferred Communication Style</label>
              <Controller
                name="preferredCommunicationStyle"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={communicationStyles}
                    value={communicationStyles.find(style => style.value === field.value)}
                    onChange={(selected) => field.onChange(selected?.value)}
                    placeholder="Select your preferred communication style"
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                )}
              />
              {errors.preferredCommunicationStyle && (
                <p className="form-error">{errors.preferredCommunicationStyle.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Goals */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Goals</h2>
            <p className="text-sm text-gray-600">What do you want to achieve?</p>
          </div>
          <div className="card-body">
            <Controller
              name="goals"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  isMulti
                  options={goalOptions}
                  value={formatSelectValue(goalOptions, field.value)}
                  onChange={(selected) => field.onChange(selected?.map(s => s.value) || [])}
                  placeholder="Select your goals (you can choose multiple)"
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              )}
            />
            {errors.goals && (
              <p className="form-error">{errors.goals.message}</p>
            )}
          </div>
        </div>

        {/* Struggles */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Challenges</h2>
            <p className="text-sm text-gray-600">What challenges are you facing?</p>
          </div>
          <div className="card-body">
            <Controller
              name="struggles"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  isMulti
                  options={struggleOptions}
                  value={formatSelectValue(struggleOptions, field.value)}
                  onChange={(selected) => field.onChange(selected?.map(s => s.value) || [])}
                  placeholder="Select your challenges (you can choose multiple)"
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              )}
            />
            {errors.struggles && (
              <p className="form-error">{errors.struggles.message}</p>
            )}
          </div>
        </div>

        {/* Interests */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Interests</h2>
            <p className="text-sm text-gray-600">What are you passionate about?</p>
          </div>
          <div className="card-body">
            <Controller
              name="interests"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  isMulti
                  options={interestOptions}
                  value={formatSelectValue(interestOptions, field.value)}
                  onChange={(selected) => field.onChange(selected?.map(s => s.value) || [])}
                  placeholder="Select your interests (you can choose multiple)"
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              )}
            />
            {errors.interests && (
              <p className="form-error">{errors.interests.message}</p>
            )}
          </div>
        </div>

        {/* Availability */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Availability</h2>
            <p className="text-sm text-gray-600">When are you typically available for {user?.role === 'mentor' ? 'mentoring sessions' : 'mentorship meetings'}?</p>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {daysOfWeek.map((day) => (
                <div key={day.key} className="flex items-center space-x-4">
                  <div className="w-24">
                    <span className="text-sm font-medium text-gray-700">{day.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="time"
                      className="input text-sm"
                      value={availability?.[day.key]?.[0] || ''}
                      onChange={(e) => handleAvailabilityChange(day.key, 'start', e.target.value)}
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      className="input text-sm"
                      value={availability?.[day.key]?.[1] || ''}
                      onChange={(e) => handleAvailabilityChange(day.key, 'end', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
            {errors.availability && (
              <p className="form-error">{errors.availability.message}</p>
            )}
          </div>
        </div>

        {/* Experience (for mentors) */}
        {user?.role === 'mentor' && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">Experience</h2>
              <p className="text-sm text-gray-600">Tell us about your experience and why you want to be a mentor</p>
            </div>
            <div className="card-body">
              <textarea
                {...register('experience')}
                rows={4}
                className={`input ${errors.experience ? 'input-error' : ''}`}
                placeholder="Describe your relevant experience, qualifications, and what drives you to help others..."
              />
              {errors.experience && (
                <p className="form-error">{errors.experience.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" color="white" className="mr-2" />
                Saving...
              </>
            ) : (
              'Complete Onboarding'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Onboarding;

