import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { roomsAPI, usersAPI } from '../../services/api';
import { XMarkIcon, UserPlusIcon, XCircleIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const schema = yup.object({
  name: yup
    .string()
    .required('Room name is required')
    .min(3, 'Room name must be at least 3 characters')
    .max(100, 'Room name must be less than 100 characters'),
  description: yup
    .string()
    .max(500, 'Description must be less than 500 characters'),
  category: yup
    .string()
    .required('Please select a category'),
  isPrivate: yup.boolean(),
  maxMembers: yup
    .number()
    .min(2, 'Minimum 2 members required')
    .max(1000, 'Maximum 1000 members allowed')
    .typeError('Max members must be a number'),
  rules: yup
    .string()
    .max(1000, 'Rules must be less than 1000 characters')
});

const CATEGORIES = [
  { value: 'mentorship', label: '🎯 Mentorship', description: 'Connect mentors with mentees' },
  { value: 'goals', label: '🚀 Goal Achievement', description: 'Share and track personal goals' },
  { value: 'accountability', label: '🤝 Accountability', description: 'Stay accountable with peers' },
  { value: 'support', label: '💚 Support & Help', description: 'Get help and support others' },
  { value: 'skills', label: '📚 Skill Development', description: 'Learn and share skills' },
  { value: 'networking', label: '🌐 Networking', description: 'Build professional connections' },
  { value: 'wellness', label: '🌱 Wellness & Growth', description: 'Personal development and wellness' }
];

const CreateRoomModal = ({ isOpen, onClose, onRoomCreated }) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      category: 'mentorship',
      isPrivate: false,
      maxMembers: 50,
      rules: 'Be respectful and supportive. Share experiences constructively. Keep discussions focused on growth and learning. Maintain confidentiality when sharing personal challenges.'
    }
  });

  const isPrivate = watch('isPrivate');
  
  // Member invitation state
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search for users to invite
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await usersAPI.search({ q: query, role: 'mentee', limit: 10 });
      const users = response.data?.data?.users || response.data?.users || [];
      // Filter out already selected members
      const filteredUsers = users.filter(user => 
        !selectedMembers.some(member => member.id === user.id)
      );
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Add member to selection
  const addMember = (user) => {
    setSelectedMembers(prev => [...prev, user]);
    setSearchTerm('');
    setSearchResults([]);
  };

  // Remove member from selection
  const removeMember = (userId) => {
    setSelectedMembers(prev => prev.filter(member => member.id !== userId));
  };

  const onSubmit = async (data) => {
    try {
      const response = await roomsAPI.create(data);
      const createdRoom = response.data.data.room;
      
      // If members were selected, invite them to the room
      if (selectedMembers.length > 0) {
        try {
          for (const member of selectedMembers) {
            await roomsAPI.addMember(createdRoom.id, {
              userId: member.id,
              role: 'member'
            });
          }
          toast.success(`Room created with ${selectedMembers.length} members invited!`);
        } catch (inviteError) {
          console.error('Failed to invite some members:', inviteError);
          toast.success('Room created! Some member invitations may have failed.');
        }
      } else {
        toast.success('Room created successfully!');
      }
      
      onRoomCreated?.(createdRoom);
      reset();
      setSelectedMembers([]);
      setSearchTerm('');
      setSearchResults([]);
      onClose();
    } catch (error) {
      console.error('Failed to create room:', error);
      toast.error(error.response?.data?.message || 'Failed to create room');
    }
  };

  const handleClose = () => {
    reset();
    setSelectedMembers([]);
    setSearchTerm('');
    setSearchResults([]);
    onClose();
  };

  // Handle search input with debouncing
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Debounce search
    setTimeout(() => {
      if (value === searchTerm) {
        searchUsers(value);
      }
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-lg bg-white my-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Create Community Room</h3>
            <p className="text-sm text-gray-500 mt-1">Build a space for mentorship and growth</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Room Name */}
          <div>
            <label className="form-label">Room Name *</label>
            <input
              {...register('name')}
              type="text"
              className={`input ${errors.name ? 'input-error' : ''}`}
              placeholder="Enter room name"
            />
            {errors.name && (
              <p className="form-error">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="form-label">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className={`input ${errors.description ? 'input-error' : ''}`}
              placeholder="Describe the purpose of this room and what members can expect to learn or achieve together..."
            />
            {errors.description && (
              <p className="form-error">{errors.description.message}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="form-label">Category *</label>
            <select
              {...register('category')}
              className={`input ${errors.category ? 'input-error' : ''}`}
            >
              {CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="form-error">{errors.category.message}</p>
            )}
          </div>

          {/* Privacy and Max Members */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Max Members</label>
              <input
                {...register('maxMembers')}
                type="number"
                min="2"
                max="1000"
                className={`input ${errors.maxMembers ? 'input-error' : ''}`}
              />
              {errors.maxMembers && (
                <p className="form-error">{errors.maxMembers.message}</p>
              )}
            </div>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  {...register('isPrivate')}
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Private Room</span>
              </label>
            </div>
          </div>

          {/* Private room info */}
          {isPrivate && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <strong>Private rooms</strong> are only visible to members. Users need to be invited to join.
              </p>
            </div>
          )}

          {/* Room Rules */}
          <div>
            <label className="form-label">Room Rules</label>
            <textarea
              {...register('rules')}
              rows={3}
              className={`input ${errors.rules ? 'input-error' : ''}`}
              placeholder="Set guidelines for this room..."
            />
            {errors.rules && (
              <p className="form-error">{errors.rules.message}</p>
            )}
          </div>

          {/* Invite Members */}
          <div>
            <label className="form-label">
              <UserPlusIcon className="w-4 h-4 inline mr-1" />
              Invite Mentees (Optional)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Search and add mentees to your room. You can also invite members later.
            </p>
            
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                className="input pr-10"
                placeholder="Search mentees by name or email..."
              />
              {isSearching && (
                <div className="absolute right-3 top-2.5">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-md max-h-40 overflow-y-auto">
                {searchResults.map(user => (
                  <div
                    key={user.id}
                    onClick={() => addMember(user)}
                    className="p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <UserPlusIcon className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Selected Members */}
            {selectedMembers.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Selected Members ({selectedMembers.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-sm"
                    >
                      <span>{member.name}</span>
                      <button
                        type="button"
                        onClick={() => removeMember(member.id)}
                        className="ml-1 text-primary-600 hover:text-primary-800"
                      >
                        <XCircleIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
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
                  Creating...
                </>
              ) : (
                'Create Room'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomModal;

