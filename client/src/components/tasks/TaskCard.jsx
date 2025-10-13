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
        return 'bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'in_progress':
        return 'bg-gradient-to-r from-blue-600/20 to-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'completed':
        return 'bg-gradient-to-r from-green-600/20 to-green-500/20 text-green-400 border border-green-500/30';
      case 'verified':
        return 'bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'rejected':
        return 'bg-gradient-to-r from-red-600/20 to-red-500/20 text-red-400 border border-red-500/30';
      default:
        return 'bg-gradient-to-r from-gray-600/20 to-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-400';
      case 'high':
        return 'text-orange-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-400';
      default:
        return 'text-gray-400';
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
      'bg-gradient-to-br from-gray-900 to-black rounded-xl border-2 p-4 sm:p-6 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10',
      isOverdue && 'border-red-500/50 shadow-red-500/20',
      task.status === 'completed' && 'border-green-500/50 shadow-green-500/20',
      task.status === 'verified' && 'border-emerald-500/50 shadow-emerald-500/20',
      !isOverdue && !['completed', 'verified'].includes(task.status) && 'border-orange-500/30'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-black text-white uppercase tracking-wider truncate">
            ⚔️ {task.title}
          </h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className={clsx(
              'inline-flex items-center px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider',
              getStatusColor(task.status)
            )}>
              {task.status.replace('_', ' ')}
            </span>
            <div className="flex items-center space-x-1">
              {getPriorityIcon(task.priority)}
              <span className={clsx('text-xs font-black uppercase tracking-wider', getPriorityColor(task.priority))}>
                {task.priority}
              </span>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="relative ml-3">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-400 hover:text-orange-400 rounded-xl hover:bg-gray-800 border border-gray-700 hover:border-orange-500/50 transition-all duration-200"
          >
            <EllipsisHorizontalIcon className="h-5 w-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-12 w-48 bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-2xl border border-orange-500/30 py-2 z-10">
              {canProgress && task.status === 'pending' && (
                <button
                  onClick={() => handleStatusUpdate('in_progress')}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-orange-400 transition-all duration-200 font-medium"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  ⚡ Start Mission
                </button>
              )}
              
              {canProgress && task.status === 'in_progress' && (
                <button
                  onClick={() => handleStatusUpdate('completed')}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-orange-400 transition-all duration-200 font-medium"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  ✅ Complete Mission
                </button>
              )}

              {canVerify && (
                <>
                  <button
                    onClick={() => onVerify(task.id, true)}
                    className="flex items-center w-full px-4 py-2 text-sm text-green-400 hover:bg-green-900/20 hover:text-green-300 transition-all duration-200 font-medium"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    🏆 Verify Mission
                  </button>
                  <button
                    onClick={() => onVerify(task.id, false)}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-all duration-200 font-medium"
                  >
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    ❌ Reject Mission
                  </button>
                </>
              )}

              {canEdit && (
                <>
                  <hr className="my-2 border-gray-700" />
                  <button
                    onClick={() => {
                      onEdit(task);
                      setShowMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-orange-400 transition-all duration-200 font-medium"
                  >
                    ✏️ Edit Mission
                  </button>
                  <button
                    onClick={() => {
                      onDelete(task.id);
                      setShowMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-all duration-200 font-medium"
                  >
                    🗑️ Delete Mission
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-300 text-sm mb-4 line-clamp-3 font-medium">
        {task.description}
      </p>

      {/* Details */}
      <div className="space-y-2">
        {/* Participants */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <UserIcon className="h-4 w-4 text-gray-400" />
              <span className="text-gray-400 font-medium">
                {currentUser.role === 'mentor' ? 'Assigned to:' : 'From:'} 
              </span>
              <span className="font-black text-orange-400 uppercase tracking-wider">
                {currentUser.role === 'mentor' ? task.mentee?.name : task.mentor?.name}
              </span>
            </div>
          </div>
        </div>

        {/* Due date and time info */}
        <div className="flex items-center justify-between text-sm">
          {task.dueDate && (
            <div className={clsx(
              'flex items-center space-x-1 font-medium',
              isOverdue ? 'text-red-400' : 'text-gray-400'
            )}>
              <CalendarIcon className="h-4 w-4" />
              <span>
                Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
                {isOverdue && ' (Overdue)'}
              </span>
            </div>
          )}

          <div className="flex items-center space-x-1 text-gray-400 font-medium">
            <ClockIcon className="h-4 w-4" />
            <span>
              {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Estimated vs actual hours */}
        {(task.estimatedHours || task.actualHours) && (
          <div className="flex items-center space-x-4 text-sm text-gray-400 font-medium">
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
                className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-gray-800 text-gray-300 border border-gray-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Verification notes */}
        {task.verificationNotes && (
          <div className="mt-3 p-3 bg-gray-800 rounded-xl border border-gray-700">
            <p className="text-xs font-black uppercase tracking-wider text-orange-400 mb-2">Battle Verification Notes:</p>
            <p className="text-sm text-gray-300 font-medium">{task.verificationNotes}</p>
          </div>
        )}

        {/* Completion timestamp */}
        {task.completedAt && (
          <div className="text-xs text-green-400 font-medium">
            ✅ Mission Completed {formatDistanceToNow(new Date(task.completedAt), { addSuffix: true })}
          </div>
        )}

        {task.verifiedAt && (
          <div className="text-xs text-emerald-400 font-medium">
            🏆 Mission Verified {formatDistanceToNow(new Date(task.verifiedAt), { addSuffix: true })}
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

