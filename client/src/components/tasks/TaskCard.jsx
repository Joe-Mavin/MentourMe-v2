import React, { useState } from 'react';
import { 
  ClockIcon, 
  CalendarIcon, 
  FlagIcon,
  UserIcon,
  EllipsisHorizontalIcon,
  CheckCircleIcon,
  PlayIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow, format } from 'date-fns';
import clsx from 'clsx';

const TaskCard = ({ 
  task, 
  currentUser, 
  onStatusUpdate, 
  onEdit, 
  onDelete, 
  onVerify 
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'verified':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPriorityIcon = (priority) => {
    const className = `h-4 w-4 ${getPriorityColor(priority)}`;
    return <FlagIcon className={className} />;
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && 
                   !['completed', 'verified'].includes(task.status);

  const canEdit = currentUser.id === task.mentorId;
  const canProgress = currentUser.id === task.menteeId && 
                      ['pending', 'in_progress'].includes(task.status);
  const canVerify = (currentUser.id === task.mentorId || currentUser.role === 'admin') && 
                    task.status === 'completed';

  const handleStatusUpdate = (newStatus) => {
    onStatusUpdate(task.id, newStatus);
    setShowMenu(false);
  };

  return (
    <div className={clsx(
      'bg-white rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md',
      isOverdue && 'border-red-200 bg-red-50',
      task.status === 'completed' && 'border-green-200',
      task.status === 'verified' && 'border-emerald-200'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {task.title}
          </h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className={clsx(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
              getStatusColor(task.status)
            )}>
              {task.status.replace('_', ' ').toUpperCase()}
            </span>
            <div className="flex items-center space-x-1">
              {getPriorityIcon(task.priority)}
              <span className={clsx('text-xs font-medium', getPriorityColor(task.priority))}>
                {task.priority.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="relative ml-3">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <EllipsisHorizontalIcon className="h-5 w-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-6 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
              {canProgress && task.status === 'pending' && (
                <button
                  onClick={() => handleStatusUpdate('in_progress')}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Start Task
                </button>
              )}
              
              {canProgress && task.status === 'in_progress' && (
                <button
                  onClick={() => handleStatusUpdate('completed')}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Mark Complete
                </button>
              )}

              {canVerify && (
                <>
                  <button
                    onClick={() => onVerify(task.id, true)}
                    className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Verify Task
                  </button>
                  <button
                    onClick={() => onVerify(task.id, false)}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    Reject Task
                  </button>
                </>
              )}

              {canEdit && (
                <>
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      onEdit(task);
                      setShowMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Edit Task
                  </button>
                  <button
                    onClick={() => {
                      onDelete(task.id);
                      setShowMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    Delete Task
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {task.description}
      </p>

      {/* Details */}
      <div className="space-y-2">
        {/* Participants */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <UserIcon className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {currentUser.role === 'mentor' ? 'Assigned to:' : 'From:'} 
              </span>
              <span className="font-medium">
                {currentUser.role === 'mentor' ? task.mentee?.name : task.mentor?.name}
              </span>
            </div>
          </div>
        </div>

        {/* Due date and time info */}
        <div className="flex items-center justify-between text-sm">
          {task.dueDate && (
            <div className={clsx(
              'flex items-center space-x-1',
              isOverdue ? 'text-red-600' : 'text-gray-600'
            )}>
              <CalendarIcon className="h-4 w-4" />
              <span>
                Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
                {isOverdue && ' (Overdue)'}
              </span>
            </div>
          )}

          <div className="flex items-center space-x-1 text-gray-500">
            <ClockIcon className="h-4 w-4" />
            <span>
              {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Estimated vs actual hours */}
        {(task.estimatedHours || task.actualHours) && (
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            {task.estimatedHours && (
              <span>Est: {task.estimatedHours}h</span>
            )}
            {task.actualHours && (
              <span>Actual: {task.actualHours}h</span>
            )}
          </div>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {task.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Verification notes */}
        {task.verificationNotes && (
          <div className="mt-3 p-2 bg-gray-50 rounded border">
            <p className="text-xs font-medium text-gray-700 mb-1">Verification Notes:</p>
            <p className="text-sm text-gray-600">{task.verificationNotes}</p>
          </div>
        )}

        {/* Completion timestamp */}
        {task.completedAt && (
          <div className="text-xs text-gray-500">
            Completed {formatDistanceToNow(new Date(task.completedAt), { addSuffix: true })}
          </div>
        )}

        {task.verifiedAt && (
          <div className="text-xs text-gray-500">
            Verified {formatDistanceToNow(new Date(task.verifiedAt), { addSuffix: true })}
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

export default TaskCard;

