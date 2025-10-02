import React from 'react';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  PlayIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const TaskStatsCard = ({ stats, className = '' }) => {
  const totalTasks = Object.values(stats || {}).reduce((sum, count) => sum + count, 0);

  const statItems = [
    {
      key: 'pending',
      label: 'Pending',
      icon: ClockIcon,
      color: 'yellow',
      count: stats?.pending || 0
    },
    {
      key: 'in_progress',
      label: 'In Progress',
      icon: PlayIcon,
      color: 'blue',
      count: stats?.in_progress || 0
    },
    {
      key: 'completed',
      label: 'Completed',
      icon: CheckCircleIcon,
      color: 'green',
      count: stats?.completed || 0
    },
    {
      key: 'verified',
      label: 'Verified',
      icon: CheckCircleIcon,
      color: 'emerald',
      count: stats?.verified || 0
    },
    {
      key: 'rejected',
      label: 'Rejected',
      icon: XCircleIcon,
      color: 'red',
      count: stats?.rejected || 0
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      yellow: 'bg-yellow-100 text-yellow-800',
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      emerald: 'bg-emerald-100 text-emerald-800',
      red: 'bg-red-100 text-red-800'
    };
    return colors[color] || 'bg-gray-100 text-gray-800';
  };

  if (!stats || totalTasks === 0) {
    return (
      <div className={clsx('bg-white rounded-lg border border-gray-200 p-6', className)}>
        <div className="text-center">
          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Tasks Yet</h3>
          <p className="text-gray-600">
            Task statistics will appear here once you start creating and managing tasks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('bg-white rounded-lg border border-gray-200 p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Task Overview</h3>
        <span className="text-2xl font-bold text-gray-900">{totalTasks}</span>
      </div>

      <div className="space-y-3">
        {statItems.map(item => {
          const percentage = totalTasks > 0 ? (item.count / totalTasks) * 100 : 0;
          
          return (
            <div key={item.key} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={clsx(
                  'p-2 rounded-lg',
                  getColorClasses(item.color)
                )}>
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">
                    {percentage.toFixed(0)}% of total
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">{item.count}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>
            {stats.completed + stats.verified} of {totalTasks} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${totalTasks > 0 ? ((stats.completed + stats.verified) / totalTasks) * 100 : 0}%`
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TaskStatsCard;

