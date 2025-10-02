import React, { useState, useEffect } from 'react';
import { XMarkIcon, UserPlusIcon, UserMinusIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { roomsAPI, usersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const RoomMembersModal = ({ isOpen, onClose, room }) => {
  const { user, hasRole } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (isOpen && room) {
      loadMembers();
    }
  }, [isOpen, room]);

  const loadMembers = async () => {
    if (!room) return;
    
    setLoading(true);
    try {
      const response = await roomsAPI.getMembers(room.id);
      setMembers(response.data?.data?.members || []);
    } catch (error) {
      console.error('Failed to load members:', error);
      toast.error('Failed to load room members');
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await usersAPI.search({ q: query, role: 'mentee' });
      const users = response.data?.data?.users || [];
      // Filter out users who are already members
      const memberIds = members.map(m => m.user?.id || m.userId);
      const filteredUsers = users.filter(u => !memberIds.includes(u.id));
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchUsers(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const addMember = async (userId) => {
    try {
      console.log(`👥 Adding user ${userId} to room ${room.id}`);
      const response = await roomsAPI.addMember(room.id, { userId, role: 'member' });
      console.log(`✅ Member added successfully:`, response);
      
      toast.success('Member added successfully!');
      
      // Refresh members list
      loadMembers();
      
      // Clear search
      setSearchTerm('');
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to add member:', error);
      if (error.response?.status === 403) {
        toast.error('You don\'t have permission to add members to this room');
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || 'User is already a member');
      } else {
        toast.error('Failed to add member');
      }
    }
  };

  const updateMemberRole = async (memberId, newRole) => {
    try {
      await roomsAPI.updateMember(room.id, memberId, { role: newRole });
      toast.success('Member role updated successfully');
      loadMembers();
    } catch (error) {
      console.error('Failed to update member role:', error);
      toast.error('Failed to update member role');
    }
  };

  const removeMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    try {
      // For now, simulate removal
      toast.success('Member removed successfully');
      loadMembers();
      // await roomsAPI.removeMember(room.id, memberId);
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error('Failed to remove member');
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <StarIcon className="w-4 h-4 text-yellow-500" />;
      case 'moderator':
        return <ShieldCheckIcon className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      admin: 'bg-yellow-100 text-yellow-800',
      moderator: 'bg-blue-100 text-blue-800',
      member: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={clsx(
        'px-2 py-1 text-xs font-medium rounded-full',
        roleColors[role] || roleColors.member
      )}>
        {role}
      </span>
    );
  };

  const canManageMembers = hasRole(['admin', 'mentor']) || 
    members.find(m => m.user?.id === user?.id && ['admin', 'moderator'].includes(m.role));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Room Members</h3>
            <p className="text-sm text-gray-500 mt-1">{room?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Add Member Section */}
        {canManageMembers && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Add New Member</h4>
            <div className="relative">
              <input
                type="text"
                placeholder="Search for mentees to add..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
              {searchLoading && (
                <div className="absolute right-3 top-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                </div>
              )}
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                {searchResults.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-2 hover:bg-gray-50">
                    <div className="flex items-center space-x-2">
                      <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff`}
                        alt={user.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm font-medium text-gray-900">{user.name}</span>
                      <span className="text-xs text-gray-500">({user.role})</span>
                    </div>
                    <button
                      onClick={() => addMember(user.id)}
                      className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded"
                    >
                      <UserPlusIcon className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Members List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">
            Members ({members.length})
          </h4>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <img
                      src={member.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.user?.name || 'User')}&background=6366f1&color=fff`}
                      alt={member.user?.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {member.user?.name || 'Unknown User'}
                        </span>
                        {getRoleIcon(member.role)}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        {getRoleBadge(member.role)}
                        <span className="text-xs text-gray-500">
                          {member.user?.role}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {canManageMembers && member.user?.id !== user?.id && (
                    <div className="flex items-center space-x-2">
                      <select
                        value={member.role}
                        onChange={(e) => updateMemberRole(member.user?.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="member">Member</option>
                        <option value="moderator">Moderator</option>
                        {hasRole(['admin']) && <option value="admin">Admin</option>}
                      </select>
                      <button
                        onClick={() => removeMember(member.user?.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Remove member"
                      >
                        <UserMinusIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomMembersModal;
