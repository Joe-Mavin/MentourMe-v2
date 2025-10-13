import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Select from 'react-select';
import { tasksAPI, onboardingAPI, usersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { XMarkIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const schema = yup.object({
  menteeId: yup
    .number()
    .nullable()
    .typeError('Please select a valid mentee'),
  title: yup
    .string()
    .required('Task title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: yup
    .string()
    .required('Task description is required')
    .min(10, 'Description must be at least 10 characters'),
  priority: yup
    .string()
    .required('Please select a priority'),
  dueDate: yup
    .date()
    .nullable()
    .min(new Date(), 'Due date must be in the future'),
  estimatedHours: yup
    .number()
    .nullable()
    .min(0.5, 'Minimum 0.5 hours')
    .max(100, 'Maximum 100 hours')
    .typeError('Must be a valid number'),
  tags: yup.array().of(yup.string())
});

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low Priority', color: 'green' },
  { value: 'medium', label: 'Medium Priority', color: 'yellow' },
  { value: 'high', label: 'High Priority', color: 'orange' },
  { value: 'urgent', label: 'Urgent', color: 'red' }
];

const COMMON_TAGS = [
  'Personal Development',
  'Goal Setting',
  'Habit Building',
  'Skill Learning',
  'Health & Fitness',
  'Career',
  'Education',
  'Mindfulness',
  'Accountability',
  'Recovery'
];

const CreateTaskModal = ({ isOpen, onClose, onTaskCreated, editingTask = null }) => {
  const { user } = useAuth();
  const [mentees, setMentees] = useState([]);
  const [loadingMentees, setLoadingMentees] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualMenteeId, setManualMenteeId] = useState('');

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      priority: 'medium',
      tags: [],
      estimatedHours: null,
      dueDate: null
    }
  });

  const selectedTags = watch('tags') || [];

  useEffect(() => {
    if (isOpen && user?.role === 'mentor') {
      loadMentees();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (editingTask) {
      // Populate form with editing task data
      setValue('menteeId', editingTask.menteeId);
      setValue('title', editingTask.title);
      setValue('description', editingTask.description);
      setValue('priority', editingTask.priority);
      setValue('estimatedHours', editingTask.estimatedHours);
      setValue('tags', editingTask.tags || []);
      if (editingTask.dueDate) {
        setValue('dueDate', new Date(editingTask.dueDate).toISOString().split('T')[0]);
      }
    }
  }, [editingTask, setValue]);

  const loadMentees = async () => {
    try {
      setLoadingMentees(true);
      
      // Try to get recommendations first
      try {
        const response = await onboardingAPI.getRecommendations();
        const recommendations = response.data?.data?.recommendations || [];
        
        // Convert to mentee options
        const menteeOptions = recommendations
          .filter(rec => rec.user?.role === 'user')
          .map(rec => ({
            value: rec.user.id,
            label: rec.user.name,
            compatibility: rec.compatibilityScore
          }));

        if (menteeOptions.length > 0) {
          setMentees(menteeOptions);
          return;
        }
      } catch (recError) {
        console.log('Recommendations not available, falling back to user search');
      }
      
      // Fallback: Search for users with role 'user'
      try {
        const response = await usersAPI.search({ role: 'user', limit: 50 });
        const users = response.data?.data?.users || [];
        
        const menteeOptions = users.map(user => ({
          value: user.id,
          label: user.name,
          email: user.email
        }));
        
        // Add manual entry option
        menteeOptions.push({
          value: 'manual',
          label: '✏️ Enter mentee ID manually',
          isManual: true
        });
        
        setMentees(menteeOptions);
      } catch (userError) {
        console.error('Failed to load users:', userError);
        // Create a simple manual entry option
        setMentees([{
          value: 'manual',
          label: '✏️ Enter mentee ID manually',
          isManual: true
        }]);
        toast.error('Unable to load mentee list. You can enter a mentee ID manually.');
      }
    } catch (error) {
      console.error('Failed to load mentees:', error);
      toast.error('Failed to load mentees');
    } finally {
      setLoadingMentees(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      let menteeId = data.menteeId;
      
      // Handle manual mentee ID input
      if (showManualInput && manualMenteeId) {
        menteeId = parseInt(manualMenteeId);
        if (isNaN(menteeId)) {
          toast.error('Please enter a valid mentee ID');
          return;
        }
      }
      
      if (!menteeId) {
        toast.error('Please select a mentee');
        return;
      }

      const taskData = {
        ...data,
        menteeId,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null
      };

      console.log('Submitting task data:', taskData);

      if (editingTask) {
        await tasksAPI.update(editingTask.id, taskData);
        toast.success('Task updated successfully!');
      } else {
        const response = await tasksAPI.create(taskData);
        console.log('Task creation response:', response);
        toast.success('Task created successfully!');
        onTaskCreated?.(response.data.data.task);
      }
      
      handleClose();
    } catch (error) {
      console.error('Failed to save task:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to save task');
    }
  };

  const handleClose = () => {
    reset();
    setShowManualInput(false);
    setManualMenteeId('');
    onClose();
  };

  const addTag = (tag) => {
    if (!selectedTags.includes(tag)) {
      setValue('tags', [...selectedTags, tag]);
    }
  };

  const removeTag = (tagToRemove) => {
    setValue('tags', selectedTags.filter(tag => tag !== tagToRemove));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 overflow-y-auto h-full w-full z-50 p-4">
      <div className="relative top-8 mx-auto p-6 border w-full max-w-2xl shadow-2xl rounded-xl bg-gradient-to-br from-gray-900 to-black border-orange-500/30">
        {/* Battle Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-wider">
              ⚔️ {editingTask ? 'Modify Battle Mission' : 'Forge New Battle Mission'}
            </h3>
            <p className="text-gray-300 text-sm mt-1 font-medium">
              {editingTask ? 'Update mission parameters for your warrior' : 'Create a strategic mission to challenge and develop your warrior'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-orange-400 p-2 rounded-xl hover:bg-gray-800 border border-gray-700 hover:border-orange-500/50 transition-all duration-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Mentee Selection */}
          <div>
            <label className="block text-sm font-black text-orange-400 uppercase tracking-wider mb-2">Assign to Battle Apprentice *</label>
            <Controller
              name="menteeId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={mentees}
                  value={mentees.find(m => m.value === field.value)}
                  onChange={(selected) => {
                    if (selected?.value === 'manual') {
                      setShowManualInput(true);
                      field.onChange(null);
                    } else {
                      setShowManualInput(false);
                      field.onChange(selected?.value);
                    }
                  }}
                  placeholder="Select a battle apprentice..."
                  isLoading={loadingMentees}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      backgroundColor: '#1f2937',
                      borderColor: '#374151',
                      color: '#d1d5db',
                      '&:hover': {
                        borderColor: '#f97316'
                      }
                    }),
                    menu: (base) => ({
                      ...base,
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151'
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isFocused ? '#374151' : '#1f2937',
                      color: '#d1d5db',
                      '&:hover': {
                        backgroundColor: '#374151',
                        color: '#f97316'
                      }
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: '#d1d5db'
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: '#9ca3af'
                    })
                  }}
                  formatOptionLabel={(option) => (
                    <div className="flex items-center justify-between">
                      <span>{option.label}</span>
                      {option.compatibility && (
                        <span className="text-xs text-gray-500">
                          {Math.round(option.compatibility * 10) / 10} compatibility
                        </span>
                      )}
                      {option.email && (
                        <span className="text-xs text-gray-500">
                          {option.email}
                        </span>
                      )}
                    </div>
                  )}
                />
              )}
            />
            
            {/* Manual Mentee ID Input */}
            {showManualInput && (
              <div className="mt-3">
                <label className="block text-sm font-black text-orange-400 uppercase tracking-wider mb-2">
                  Enter Battle Apprentice ID
                </label>
                <input
                  type="number"
                  value={manualMenteeId}
                  onChange={(e) => setManualMenteeId(e.target.value)}
                  placeholder="Enter warrior user ID"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
                />
                <p className="text-xs text-gray-400 mt-2 font-medium">
                  Enter the numeric user ID of the battle apprentice you want to assign this mission to.
                </p>
              </div>
            )}
            
            {errors.menteeId && (
              <p className="text-red-400 text-sm mt-2 font-medium">{errors.menteeId.message}</p>
            )}
          </div>

          {/* Task Title */}
          <div>
            <label className="block text-sm font-black text-orange-400 uppercase tracking-wider mb-2">Mission Title *</label>
            <input
              {...register('title')}
              type="text"
              className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium ${
                errors.title ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-orange-500'
              }`}
              placeholder="Enter a clear, strategic mission title"
            />
            {errors.title && (
              <p className="text-red-400 text-sm mt-2 font-medium">{errors.title.message}</p>
            )}
          </div>

          {/* Task Description */}
          <div>
            <label className="block text-sm font-black text-orange-400 uppercase tracking-wider mb-2">Mission Description *</label>
            <textarea
              {...register('description')}
              rows={4}
              className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium resize-none ${
                errors.description ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-orange-500'
              }`}
              placeholder="Describe the battle objectives, strategic requirements, and victory conditions..."
            />
            {errors.description && (
              <p className="text-red-400 text-sm mt-2 font-medium">{errors.description.message}</p>
            )}
          </div>

          {/* Priority and Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-black text-orange-400 uppercase tracking-wider mb-2">Battle Priority *</label>
              <select
                {...register('priority')}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium ${
                  errors.priority ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-orange-500'
                }`}
              >
                {PRIORITY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value} className="bg-gray-800 text-gray-300">
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.priority && (
                <p className="text-red-400 text-sm mt-2 font-medium">{errors.priority.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-black text-orange-400 uppercase tracking-wider mb-2">Battle Deadline</label>
              <input
                {...register('dueDate')}
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium ${
                  errors.dueDate ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-orange-500'
                }`}
              />
              {errors.dueDate && (
                <p className="text-red-400 text-sm mt-2 font-medium">{errors.dueDate.message}</p>
              )}
            </div>
          </div>

          {/* Estimated Hours */}
          <div>
            <label className="block text-sm font-black text-orange-400 uppercase tracking-wider mb-2">Estimated Battle Hours</label>
            <input
              {...register('estimatedHours')}
              type="number"
              step="0.5"
              min="0.5"
              max="100"
              className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium ${
                errors.estimatedHours ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-orange-500'
              }`}
              placeholder="e.g., 2.5"
            />
            {errors.estimatedHours && (
              <p className="text-red-400 text-sm mt-2 font-medium">{errors.estimatedHours.message}</p>
            )}
            <p className="text-gray-400 text-sm mt-2 font-medium">
              How many battle hours do you estimate this mission will require?
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-black text-orange-400 uppercase tracking-wider mb-2">Battle Tags</label>
            
            {/* Common tags */}
            <div className="mb-3">
              <p className="text-sm text-gray-300 mb-2 font-medium">Quick Battle Categories:</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    disabled={selectedTags.includes(tag)}
                    className={`px-3 py-1 text-xs rounded-xl border transition-all duration-200 font-medium ${
                      selectedTags.includes(tag)
                        ? 'bg-orange-600/20 text-orange-400 border-orange-500/30 cursor-not-allowed'
                        : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700 hover:text-orange-400 hover:border-orange-500/50'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected tags */}
            {selectedTags.length > 0 && (
              <div className="mb-3">
                <p className="text-sm text-gray-300 mb-2 font-medium">Selected Battle Tags:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 text-sm bg-orange-600/20 text-orange-400 rounded-xl border border-orange-500/30 font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-orange-400 hover:text-orange-300 transition-colors duration-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gray-800 text-gray-300 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-gray-700 border border-gray-700 hover:border-orange-500/50 transition-all duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-black text-sm uppercase tracking-wider hover:shadow-lg hover:shadow-orange-500/25 border border-orange-500 transition-all duration-200 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" color="white" className="mr-2" />
                  {editingTask ? 'Updating Mission...' : 'Forging Mission...'}
                </>
              ) : (
                editingTask ? '⚔️ Update Mission' : '🔥 Forge Mission'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;

