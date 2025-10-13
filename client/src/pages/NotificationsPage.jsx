import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../services/api';
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const notificationTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'mentor_approved', label: 'Mentor Approved' },
    { value: 'mentor_rejected', label: 'Mentor Rejected' },
    { value: 'task_assigned', label: 'Task Assigned' },
    { value: 'task_completed', label: 'Task Completed' },
    { value: 'task_verified', label: 'Task Verified' },
    { value: 'task_rejected', label: 'Task Rejected' },
    { value: 'new_message', label: 'New Message' },
    { value: 'room_invitation', label: 'Room Invitation' },
    { value: 'room_joined', label: 'Room Joined' },
    { value: 'call_incoming', label: 'Incoming Call' },
    { value: 'call_missed', label: 'Missed Call' },
    { value: 'system_announcement', label: 'System Announcement' },
    { value: 'profile_update_required', label: 'Profile Update Required' }
  ];

  useEffect(() => {
    loadNotifications(true);
  }, [filter, typeFilter, searchTerm]);

  const loadNotifications = async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      
      const params = {
        page: currentPage,
        limit: 20,
        ...(filter !== 'all' && { isRead: filter === 'read' }),
        ...(typeFilter !== 'all' && { type: typeFilter })
      };

      const response = await notificationsAPI.getNotifications(params);
      const newNotifications = response.data?.data?.notifications || [];
      const pagination = response.data?.data?.pagination || {};

      if (reset) {
        setNotifications(newNotifications);
        setPage(1);
      } else {
        setNotifications(prev => [...prev, ...newNotifications]);
      }

      setTotalCount(pagination.total || 0);
      setHasMore(currentPage < (pagination.totalPages || 1));
      
      if (!reset) {
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n
      ));
      toast.success('Marked as read');
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date() })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notificationsAPI.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setTotalCount(prev => prev - 1);
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate to action URL if provided
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const getNotificationIcon = (type) => {
    const iconClass = "w-6 h-6";
    
    switch (type) {
      case 'mentor_approved':
        return <CheckIcon className={clsx(iconClass, "text-green-400")} />;
      case 'mentor_rejected':
        return <XMarkIcon className={clsx(iconClass, "text-red-400")} />;
      case 'task_assigned':
      case 'task_completed':
      case 'task_verified':
      case 'task_rejected':
        return <ClipboardDocumentListIcon className={clsx(iconClass, "text-orange-400")} />;
      case 'new_message':
        return <ChatBubbleLeftRightIcon className={clsx(iconClass, "text-green-400")} />;
      case 'room_invitation':
      case 'room_joined':
        return <UserGroupIcon className={clsx(iconClass, "text-orange-400")} />;
      case 'call_incoming':
      case 'call_missed':
        return <PhoneIcon className={clsx(iconClass, "text-orange-400")} />;
      case 'system_announcement':
        return <InformationCircleIcon className={clsx(iconClass, "text-orange-400")} />;
      case 'profile_update_required':
        return <ExclamationTriangleIcon className={clsx(iconClass, "text-red-400")} />;
      default:
        return <BellIcon className={clsx(iconClass, "text-gray-400")} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-gradient-to-r from-red-900/20 to-red-800/10';
      case 'high':
        return 'border-l-orange-500 bg-gradient-to-r from-orange-900/20 to-orange-800/10';
      case 'medium':
        return 'border-l-orange-400 bg-gradient-to-r from-orange-900/10 to-orange-800/5';
      case 'low':
        return 'border-l-gray-500 bg-gradient-to-r from-gray-900/10 to-gray-800/5';
      default:
        return 'border-l-gray-600 bg-gradient-to-br from-gray-900 to-black';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return notification.title.toLowerCase().includes(searchLower) ||
             notification.message.toLowerCase().includes(searchLower);
    }
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Battle Alert Center Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-white uppercase tracking-wider mb-4">
                <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">BATTLE</span> ALERT CENTER
              </h1>
              <p className="text-gray-300 font-medium">
                {totalCount} total battle alerts • {unreadCount} unread tactical updates
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-black uppercase tracking-wider hover:shadow-lg hover:shadow-orange-500/25 border border-orange-500 transition-all duration-200"
              >
                <CheckIcon className="w-5 h-5 mr-2" />
                Mark All Read
              </button>
            )}
          </div>
        </div>

        {/* Battle Alert Filters */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-2xl border border-orange-500/30 mb-8 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Battle Alert Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-orange-500" />
              </div>
              <input
                type="text"
                placeholder="Search battle alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
              />
            </div>

            {/* Alert Status Filter */}
            <div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="block w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
              >
                <option value="all">All Battle Alerts</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read Only</option>
              </select>
            </div>

            {/* Alert Type Filter */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="block w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
              >
                {notificationTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Battle Alerts List */}
        <div className="bg-gradient-to-br from-gray-900 to-black shadow-2xl rounded-xl border border-orange-500/30 overflow-hidden">
          {loading && notifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-6"></div>
              <p className="text-gray-300 font-bold uppercase tracking-wider">Loading Battle Alerts...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-orange-500">
                <BellIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">No Battle Alerts</h3>
              <p className="text-gray-400 font-medium">
                {searchTerm ? 'No alerts match your search criteria.' : "All clear on the battlefield!"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-orange-500/20">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={clsx(
                    'relative p-6 hover:bg-gray-800/50 transition-colors duration-200 border-l-4',
                    getPriorityColor(notification.priority),
                    !notification.isRead && 'bg-orange-900/10'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className={clsx(
                              'text-lg font-black uppercase tracking-wider',
                              notification.isRead ? 'text-gray-300' : 'text-white'
                            )}>
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <span className="inline-flex items-center px-2 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-orange-600 to-red-600 text-white border border-orange-500">
                                New
                              </span>
                            )}
                            <span className={clsx(
                              'inline-flex items-center px-2 py-1 rounded-xl text-xs font-black uppercase tracking-wider border',
                              notification.priority === 'urgent' ? 'bg-gradient-to-r from-red-600/20 to-red-500/20 text-red-400 border-red-500/30' :
                              notification.priority === 'high' ? 'bg-gradient-to-r from-orange-600/20 to-orange-500/20 text-orange-400 border-orange-500/30' :
                              notification.priority === 'medium' ? 'bg-gradient-to-r from-orange-600/10 to-orange-500/10 text-orange-300 border-orange-500/20' :
                              'bg-gradient-to-r from-gray-600/20 to-gray-500/20 text-gray-400 border-gray-500/30'
                            )}>
                              {notification.priority}
                            </span>
                          </div>
                          <p className={clsx(
                            'text-sm mb-3 font-medium',
                            notification.isRead ? 'text-gray-400' : 'text-gray-300'
                          )}>
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 font-medium">
                            <span>
                              ⚔️ {formatDistanceToNow(new Date(notification.createdAt))} ago
                            </span>
                            {notification.readAt && (
                              <span>
                                📖 Read {formatDistanceToNow(new Date(notification.readAt))} ago
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Battle Action Buttons */}
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="p-2 text-gray-400 hover:text-green-400 rounded-xl hover:bg-green-900/20 border border-gray-700 hover:border-green-500/50 transition-all duration-200"
                          title="Mark as read"
                        >
                          <CheckIcon className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this battle alert?')) {
                            deleteNotification(notification.id);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-400 rounded-xl hover:bg-red-900/20 border border-gray-700 hover:border-red-500/50 transition-all duration-200"
                        title="Delete"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More Battle Alerts */}
          {hasMore && filteredNotifications.length > 0 && (
            <div className="p-6 border-t border-orange-500/30 text-center">
              <button
                onClick={() => loadNotifications(false)}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl font-black uppercase tracking-wider hover:bg-gray-700 hover:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 transition-all duration-200"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500 mr-2"></div>
                    Loading More Alerts...
                  </>
                ) : (
                  'Load More Battle Alerts'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
