import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import socketService from '../../services/socket';
import NotificationCenter from '../notifications/NotificationCenter';
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const Header = ({ setSidebarOpen }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Socket connection status
  useEffect(() => {
    const updateConnectionStatus = () => {
      setConnectionStatus(socketService.getConnectionStatus() ? 'connected' : 'disconnected');
    };

    socketService.on('connected', () => setConnectionStatus('connected'));
    socketService.on('disconnected', () => setConnectionStatus('disconnected'));

    updateConnectionStatus();

    return () => {
      socketService.off('connected', updateConnectionStatus);
      socketService.off('disconnected', updateConnectionStatus);
    };
  }, []);

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow border-b border-gray-200">
      {/* Mobile menu button */}
      <button
        type="button"
        className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" />
      </button>

      {/* Search bar */}
      <div className="flex-1 px-4 flex justify-between items-center">
        <div className="flex-1 flex">
          <div className="w-full flex md:ml-0">
            <label htmlFor="search-field" className="sr-only">
              Search
            </label>
            <div className="relative w-full text-gray-400 focus-within:text-gray-600">
              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5" />
              </div>
              <input
                id="search-field"
                className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent"
                placeholder="Search messages, users, or rooms..."
                type="search"
                name="search"
              />
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="ml-4 flex items-center md:ml-6 space-x-3">
          {/* Connection status */}
          <div className="flex items-center space-x-2">
            <div className={clsx(
              'w-2 h-2 rounded-full',
              connectionStatus === 'connected' ? 'bg-green-400' : 'bg-red-400'
            )} />
            <span className="text-xs text-gray-500 hidden sm:block">
              {connectionStatus === 'connected' ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Video call button */}
          <button
            type="button"
            className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            onClick={() => navigate('/call/new')}
          >
            <span className="sr-only">Start video call</span>
            <VideoCameraIcon className="h-6 w-6" />
          </button>

          {/* Notifications */}
          <NotificationCenter />

          {/* Profile menu */}
          <div className="flex items-center">
            <button
              type="button"
              className="bg-white rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={() => navigate('/profile')}
            >
              <span className="sr-only">Open user menu</span>
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-primary-600 font-medium text-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;

