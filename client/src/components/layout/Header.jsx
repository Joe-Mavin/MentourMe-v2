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
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-gradient-to-r from-gray-900 to-black shadow-lg border-b border-orange-500/30">
      {/* Mobile menu button */}
      <button
        type="button"
        className="px-4 border-r border-orange-500/30 text-gray-300 hover:text-orange-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500 lg:hidden transition-colors"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open command center</span>
        <Bars3Icon className="h-6 w-6" />
      </button>

      {/* Search bar */}
      <div className="flex-1 px-4 flex justify-between items-center">
        <div className="flex-1 flex">
          <div className="w-full flex md:ml-0">
            <label htmlFor="search-field" className="sr-only">
              Search Battle Network
            </label>
            <div className="relative w-full text-gray-400 focus-within:text-orange-400">
              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5" />
              </div>
              <input
                id="search-field"
                className="block w-full h-full pl-8 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                placeholder="Search warriors, commanders, or battle rooms..."
                type="search"
                name="search"
              />
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="ml-4 flex items-center md:ml-6 space-x-4">
          {/* Connection status */}
          <div className="flex items-center space-x-2 px-3 py-1 bg-gray-800 rounded-full border border-gray-700">
            <div className={clsx(
              'w-3 h-3 rounded-full border-2',
              connectionStatus === 'connected' 
                ? 'bg-green-500 border-green-400 shadow-lg shadow-green-500/50' 
                : 'bg-red-500 border-red-400 shadow-lg shadow-red-500/50'
            )} />
            <span className="text-xs font-bold text-white hidden sm:block uppercase tracking-wider">
              {connectionStatus === 'connected' ? '⚔️ BATTLE READY' : '🔴 OFFLINE'}
            </span>
          </div>

          {/* Video call button */}
          <button
            type="button"
            className="bg-gradient-to-br from-orange-600 to-red-600 p-2 rounded-xl text-white hover:shadow-lg hover:shadow-orange-500/25 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-orange-500 transition-all duration-200 hover:scale-105"
            onClick={() => navigate('/call/new')}
          >
            <span className="sr-only">Start battle communication</span>
            <VideoCameraIcon className="h-5 w-5" />
          </button>

          {/* Notifications */}
          <NotificationCenter />

          {/* Profile menu */}
          <div className="flex items-center">
            <button
              type="button"
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-700 hover:border-orange-500 transition-all duration-200 p-1"
              onClick={() => navigate('/profile')}
            >
              <span className="sr-only">Open warrior profile</span>
              <div className="w-8 h-8 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center border-2 border-orange-500">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-black text-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || 'W'}
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

