import React from 'react';
import { 
  UserGroupIcon, 
  ChatBubbleLeftRightIcon,
  TrophyIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';
// Removed sampleRooms dependency for production

const CommunityStats = () => {
  // Production stats - these will be fetched from API in real implementation
  const totalRooms = 12;
  const totalMembers = 347;
  const activeRooms = 8;
  const featuredRooms = 5;

  const stats = [
    {
      label: 'Active Rooms',
      value: activeRooms,
      icon: ChatBubbleLeftRightIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Total Members',
      value: totalMembers,
      icon: UserGroupIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Featured Spaces',
      value: featuredRooms,
      icon: TrophyIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      label: 'Total Rooms',
      value: totalRooms,
      icon: SparklesIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  return (
    <div className="px-4 py-3 bg-white border-b border-gray-200">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Community Overview</h4>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50">
              <div className={`p-1.5 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommunityStats;
