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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-8 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Mentee Selection */}
          <div>
            <label className="form-label">Assign to Mentee *</label>
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
                  placeholder="Select a mentee..."
                  isLoading={loadingMentees}
                  className="react-select-container"
                  classNamePrefix="react-select"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter Mentee ID
                </label>
                <input
                  type="number"
                  value={manualMenteeId}
                  onChange={(e) => setManualMenteeId(e.target.value)}
                  placeholder="Enter mentee user ID"
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the numeric user ID of the mentee you want to assign this task to.
                </p>
              </div>
            )}
            
            {errors.menteeId && (
              <p className="form-error">{errors.menteeId.message}</p>
            )}
          </div>

          {/* Task Title */}
          <div>
            <label className="form-label">Task Title *</label>
            <input
              {...register('title')}
              type="text"
              className={`input ${errors.title ? 'input-error' : ''}`}
              placeholder="Enter a clear, specific task title"
            />
            {errors.title && (
              <p className="form-error">{errors.title.message}</p>
            )}
          </div>

          {/* Task Description */}
          <div>
            <label className="form-label">Task Description *</label>
            <textarea
              {...register('description')}
              rows={4}
              className={`input ${errors.description ? 'input-error' : ''}`}
              placeholder="Describe what needs to be accomplished, including any specific requirements or steps..."
            />
            {errors.description && (
              <p className="form-error">{errors.description.message}</p>
            )}
          </div>

          {/* Priority and Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Priority *</label>
              <select
                {...register('priority')}
                className={`input ${errors.priority ? 'input-error' : ''}`}
              >
                {PRIORITY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.priority && (
                <p className="form-error">{errors.priority.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Due Date</label>
              <input
                {...register('dueDate')}
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className={`input ${errors.dueDate ? 'input-error' : ''}`}
              />
              {errors.dueDate && (
                <p className="form-error">{errors.dueDate.message}</p>
              )}
            </div>
          </div>

          {/* Estimated Hours */}
          <div>
            <label className="form-label">Estimated Hours</label>
            <input
              {...register('estimatedHours')}
              type="number"
              step="0.5"
              min="0.5"
              max="100"
              className={`input ${errors.estimatedHours ? 'input-error' : ''}`}
              placeholder="e.g., 2.5"
            />
            {errors.estimatedHours && (
              <p className="form-error">{errors.estimatedHours.message}</p>
            )}
            <p className="form-help">
              How many hours do you estimate this task will take?
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="form-label">Tags</label>
            
            {/* Common tags */}
            <div className="mb-3">
              <p className="text-sm text-gray-600 mb-2">Quick add:</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    disabled={selectedTags.includes(tag)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-primary-100 text-primary-700 border-primary-300 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
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
                <p className="text-sm text-gray-600 mb-2">Selected tags:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 text-sm bg-primary-100 text-primary-800 rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-primary-600 hover:text-primary-800"
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
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" color="white" className="mr-2" />
                  {editingTask ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingTask ? 'Update Task' : 'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;

