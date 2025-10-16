import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { tasksAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TaskCard from '../components/tasks/TaskCard';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import TaskStatsCard from '../components/tasks/TaskStatsCard';
import {
  PlusIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const Tasks = () => {
  const { user, hasRole } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    loadTasks();
    loadStats();
  }, [filter, priorityFilter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') params.status = filter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (searchTerm) params.search = searchTerm;

      const response = await tasksAPI.getAll(params);
      setTasks(response.data.data.tasks);
    } catch (error) {
      toast.error('Failed to load tasks');
      console.error('Load tasks error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await tasksAPI.getStats();
      setStats(response.data.data.stats);
    } catch (error) {
      console.error('Failed to load task stats:', error);
    }
  };

  const handleStatusUpdate = async (taskId, status, additionalData = {}) => {
    try {
      await tasksAPI.updateStatus(taskId, { status, ...additionalData });
      toast.success('Task status updated');
      loadTasks();
      loadStats();
    } catch (error) {
      toast.error('Failed to update task status');
      console.error('Update task status error:', error);
    }
  };

  const handleVerifyTask = async (taskId, approved, notes = '') => {
    const status = approved ? 'verified' : 'rejected';
    const additionalData = notes ? { verificationNotes: notes } : {};
    await handleStatusUpdate(taskId, status, additionalData);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowCreateModal(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await tasksAPI.delete(taskId);
        toast.success('Task deleted successfully');
        loadTasks();
        loadStats();
      } catch (error) {
        
        if (error.response?.status === 404) {
          toast.error('Task not found - it may have already been deleted');
        } else if (error.response?.status === 403) {
          toast.error('Access denied - you can only delete tasks you created');
        } else {
          toast.error('Failed to delete task: ' + (error.response?.data?.message || error.message));
        }
      }
    }
  };

  const handleTaskCreated = (newTask) => {
    loadTasks();
    loadStats();
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingTask(null);
  };

  const filteredTasks = tasks.filter(task => {
    if (searchTerm) {
      return task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             task.description.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const filters = [
    { key: 'all', label: 'All Tasks', count: stats ? Object.values(stats).reduce((a, b) => a + b, 0) : 0 },
    { key: 'pending', label: 'Pending', count: stats?.pending || 0 },
    { key: 'in_progress', label: 'In Progress', count: stats?.in_progress || 0 },
    { key: 'completed', label: 'Completed', count: stats?.completed || 0 },
    { key: 'verified', label: 'Verified', count: stats?.verified || 0 },
  ];

  const priorityFilters = [
    { key: 'all', label: 'All Priorities' },
    { key: 'urgent', label: 'Urgent' },
    { key: 'high', label: 'High' },
    { key: 'medium', label: 'Medium' },
    { key: 'low', label: 'Low' },
  ];

  return (
    <div className="min-h-screen bg-black text-white space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-wider">
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              BATTLE
            </span> MISSIONS
          </h1>
          <p className="mt-3 text-lg text-gray-300 font-medium">
            {hasRole('mentor') 
              ? 'Command and oversee strategic missions for your warriors'
              : 'Complete assigned missions and prove your battle prowess'
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* View mode toggle */}
          <div className="bg-gray-800 rounded-xl p-1 flex border border-gray-700">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'px-4 py-2 text-sm rounded-lg transition-all font-bold uppercase tracking-wider',
                viewMode === 'grid' 
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white border border-orange-500' 
                  : 'text-gray-400 hover:text-orange-400'
              )}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'px-4 py-2 text-sm rounded-lg transition-all font-bold uppercase tracking-wider',
                viewMode === 'list' 
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white border border-orange-500' 
                  : 'text-gray-400 hover:text-orange-400'
              )}
            >
              List
            </button>
          </div>

          {hasRole('mentor') && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-black hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-200 uppercase tracking-wider border border-orange-500 hover:scale-105"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              FORGE MISSION
            </button>
          )}
        </div>
      </div>

      {/* Stats and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Task Stats */}
        <div className="lg:col-span-1">
          <TaskStatsCard stats={stats} />
        </div>

        {/* Filters and Search */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search battle missions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-medium"
            />
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-3">
            {filters.map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={clsx(
                  'px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200 flex items-center space-x-2 uppercase tracking-wider',
                  filter === filterOption.key
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white border border-orange-500 shadow-lg shadow-orange-500/25'
                    : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 hover:text-orange-400 hover:border-orange-500/50'
                )}
              >
                <span>{filterOption.label}</span>
                <span className={clsx(
                  'px-2 py-1 rounded-full text-xs font-black',
                  filter === filterOption.key
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-700 text-gray-300'
                )}>
                  {filterOption.count}
                </span>
              </button>
            ))}
          </div>

          {/* Priority Filter */}
          <div className="flex items-center space-x-4">
            <FunnelIcon className="h-5 w-5 text-orange-500" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
            >
              {priorityFilters.map(filter => (
                <option key={filter.key} value={filter.key} className="bg-gray-800 text-white">
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Display */}
      <div>
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-300 font-bold uppercase tracking-wider">Loading Battle Missions...</p>
            </div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-orange-500">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-wider">No Battle Missions Found</h3>
            <p className="text-gray-300 mb-8 text-lg font-medium">
              {searchTerm 
                ? 'Adjust your search parameters or battle filters to find missions'
                : hasRole('mentor') 
                  ? 'Forge your first strategic mission to begin tracking warrior progress'
                  : 'No battle missions have been assigned to you yet, warrior'
              }
            </p>
            {hasRole('mentor') && !searchTerm && (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-black hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-200 uppercase tracking-wider border border-orange-500 hover:scale-105"
              >
                <PlusIcon className="h-6 w-6 mr-3" />
                FORGE YOUR FIRST MISSION
              </button>
            )}
          </div>
        ) : (
          <div className={clsx(
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          )}>
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                currentUser={user}
                onStatusUpdate={handleStatusUpdate}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onVerify={handleVerifyTask}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onTaskCreated={handleTaskCreated}
        editingTask={editingTask}
      />
    </div>
  );
};

export default Tasks;

