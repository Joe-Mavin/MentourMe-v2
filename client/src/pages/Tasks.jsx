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
        toast.error('Failed to delete task');
        console.error('Delete task error:', error);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">
            {hasRole('mentor') 
              ? 'Create and manage tasks for your mentees'
              : 'Track your progress and complete assigned tasks'
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View mode toggle */}
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'px-3 py-1 text-sm rounded-md transition-colors',
                viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              )}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'px-3 py-1 text-sm rounded-md transition-colors',
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              )}
            >
              List
            </button>
          </div>

          {hasRole('mentor') && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Task
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
        <div className="lg:col-span-3 space-y-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            {filters.map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={clsx(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2',
                  filter === filterOption.key
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                )}
              >
                <span>{filterOption.label}</span>
                <span className={clsx(
                  'px-2 py-0.5 rounded-full text-xs',
                  filter === filterOption.key
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                )}>
                  {filterOption.count}
                </span>
              </button>
            ))}
          </div>

          {/* Priority Filter */}
          <div className="flex items-center space-x-3">
            <FunnelIcon className="h-4 w-4 text-gray-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {priorityFilters.map(filter => (
                <option key={filter.key} value={filter.key}>
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
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading tasks..." />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms or filters'
                : hasRole('mentor') 
                  ? 'Create your first task to start tracking progress'
                  : 'No tasks have been assigned to you yet'
              }
            </p>
            {hasRole('mentor') && !searchTerm && (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Your First Task
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

