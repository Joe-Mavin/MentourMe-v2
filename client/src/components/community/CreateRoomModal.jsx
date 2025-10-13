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
  { value: 'mentorship', label: '⚔️ Elite Command', description: 'Connect battle commanders with apprentices' },
  { value: 'goals', label: '🏆 Victory Quests', description: 'Share and conquer strategic objectives' },
  { value: 'accountability', label: '🛡️ Battle Bonds', description: 'Stay accountable with fellow warriors' },
  { value: 'support', label: '💚 Warrior Support', description: 'Rally aid and support battle comrades' },
  { value: 'skills', label: '📚 Combat Training', description: 'Master and share battle skills' },
  { value: 'networking', label: '🌐 Alliance Network', description: 'Forge strategic warrior connections' },
  { value: 'wellness', label: '🌱 Warrior Wellness', description: 'Personal growth and battle readiness' }
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
    <div className="fixed inset-0 bg-black bg-opacity-75 overflow-y-auto h-full w-full z-50 p-4">
      <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-2xl rounded-xl bg-gradient-to-br from-gray-900 to-black border-orange-500/30 my-8">
        {/* Battle Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-wider">
              🏰 Forge Battle Chamber
            </h3>
            <p className="text-gray-300 text-sm mt-1 font-medium">
              Create a strategic war room for elite warriors and battle training
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Room Name */}
          <div>
            <label className="block text-sm font-black text-orange-400 uppercase tracking-wider mb-2">Battle Chamber Name *</label>
            <input
              {...register('name')}
              type="text"
              className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium ${
                errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-orange-500'
              }`}
              placeholder="Enter battle chamber name"
            />
            {errors.name && (
              <p className="text-red-400 text-sm mt-2 font-medium">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-black text-orange-400 uppercase tracking-wider mb-2">Battle Objectives</label>
            <textarea
              {...register('description')}
              rows={3}
              className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium resize-none ${
                errors.description ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-orange-500'
              }`}
              placeholder="Describe the strategic purpose of this battle chamber and what warriors can expect to achieve together..."
            />
            {errors.description && (
              <p className="text-red-400 text-sm mt-2 font-medium">{errors.description.message}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-black text-orange-400 uppercase tracking-wider mb-2">Battle Category *</label>
            <select
              {...register('category')}
              className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium ${
                errors.category ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-orange-500'
              }`}
            >
              {CATEGORIES.map(category => (
                <option key={category.value} value={category.value} className="bg-gray-800 text-gray-300">
                  {category.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-400 text-sm mt-2 font-medium">{errors.category.message}</p>
            )}
          </div>

          {/* Privacy and Max Members */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-black text-orange-400 uppercase tracking-wider mb-2">Max Warriors</label>
              <input
                {...register('maxMembers')}
                type="number"
                min="2"
                max="1000"
                className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium ${
                  errors.maxMembers ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-orange-500'
                }`}
              />
              {errors.maxMembers && (
                <p className="text-red-400 text-sm mt-2 font-medium">{errors.maxMembers.message}</p>
              )}
            </div>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  {...register('isPrivate')}
                  type="checkbox"
                  className="rounded border-gray-600 bg-gray-800 text-orange-600 focus:ring-orange-500 focus:ring-offset-gray-900"
                />
                <span className="ml-2 text-sm text-gray-300 font-medium">Secret Battle Chamber</span>
              </label>
            </div>
          </div>

          {/* Private room info */}
          {isPrivate && (
            <div className="bg-orange-600/10 border border-orange-500/30 rounded-xl p-4">
              <p className="text-sm text-orange-400 font-medium">
                <strong className="font-black uppercase tracking-wider">🔒 Secret Battle Chambers</strong> are only visible to elite warriors. Apprentices need special invitations to join.
              </p>
            </div>
          )}

          {/* Room Rules */}
          <div>
            <label className="block text-sm font-black text-orange-400 uppercase tracking-wider mb-2">Battle Code of Honor</label>
            <textarea
              {...register('rules')}
              rows={3}
              className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium resize-none ${
                errors.rules ? 'border-red-500 focus:border-red-500' : 'border-gray-700 focus:border-orange-500'
              }`}
              placeholder="Set the warrior code and battle guidelines for this chamber..."
            />
            {errors.rules && (
              <p className="text-red-400 text-sm mt-2 font-medium">{errors.rules.message}</p>
            )}
          </div>

          {/* Invite Members */}
          <div>
            <label className="block text-sm font-black text-orange-400 uppercase tracking-wider mb-2">
              <UserPlusIcon className="w-4 h-4 inline mr-1" />
              Recruit Battle Apprentices (Optional)
            </label>
            <p className="text-xs text-gray-400 mb-2 font-medium">
              Search and recruit battle apprentices to your chamber. You can also invite warriors later.
            </p>
            
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium pr-10"
                placeholder="Search battle apprentices by name or email..."
              />
              {isSearching && (
                <div className="absolute right-3 top-2.5">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 border border-gray-700 rounded-xl max-h-40 overflow-y-auto bg-gray-800">
                {searchResults.map(user => (
                  <div
                    key={user.id}
                    onClick={() => addMember(user)}
                    className="p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-300">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                      <UserPlusIcon className="w-4 h-4 text-orange-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Selected Members */}
            {selectedMembers.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-black text-orange-400 uppercase tracking-wider mb-2">
                  ⚔️ Recruited Warriors ({selectedMembers.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center bg-orange-600/20 text-orange-400 px-3 py-1 rounded-xl text-sm border border-orange-500/30 font-medium"
                    >
                      <span>{member.name}</span>
                      <button
                        type="button"
                        onClick={() => removeMember(member.id)}
                        className="ml-2 text-orange-400 hover:text-orange-300 transition-colors duration-200"
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
                  Forging Chamber...
                </>
              ) : (
                '🏰 Forge Battle Chamber'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomModal;

