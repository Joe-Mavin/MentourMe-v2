import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../branding/Logo';
import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  CheckCircleIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Mentorship', href: '/mentorship', icon: AcademicCapIcon },
    { name: 'Messages', href: '/messages', icon: ChatBubbleLeftRightIcon },
    { name: 'Tasks', href: '/tasks', icon: CheckCircleIcon },
    { name: 'Community', href: '/community', icon: UserGroupIcon },
    { name: 'Notifications', href: '/notifications', icon: BellIcon },
    { name: 'Profile', href: '/profile', icon: UserIcon },
  ];

  const adminNavigation = [
    { name: 'Admin Dashboard', href: '/admin', icon: ShieldCheckIcon },
  ];

  const handleLogout = () => {
    logout();
    setSidebarOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gradient-to-r from-orange-600 to-red-600 border-b border-orange-500">
        <Logo size="sm" />
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 bg-gradient-to-b from-gray-900 to-black space-y-1">
          {/* User info */}
          <div className="px-3 py-3 mb-4 bg-gradient-to-r from-orange-900/20 to-red-900/20 rounded-lg border border-orange-500/30">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center border-2 border-orange-500">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-black text-lg">
                      {user?.name?.charAt(0)?.toUpperCase() || 'W'}
                    </span>
                  )}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-black text-white uppercase tracking-wider">
                  {user?.name || 'Warrior'}
                </p>
                <p className="text-xs text-orange-400 capitalize font-bold">
                  {user?.role === 'mentor' ? '⚔️ COMMANDER' : user?.role === 'admin' ? '👑 ELITE' : '🗡️ WARRIOR'}
                  {user?.role === 'mentor' && (
                    <span className={clsx(
                      'ml-2 px-2 py-0.5 rounded-full text-xs font-bold',
                      user?.approved 
                        ? 'bg-orange-600 text-white' 
                        : 'bg-yellow-100 text-yellow-800'
                    )}>
                      {user?.approved ? 'Approved' : 'Pending'}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Main navigation */}
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={clsx(
                  'flex items-center px-3 py-3 text-sm font-bold rounded-lg transition-all duration-200 uppercase tracking-wider',
                  isActive 
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white border border-orange-500 shadow-lg shadow-orange-500/25' 
                    : 'text-gray-300 hover:bg-gradient-to-r hover:from-orange-900/30 hover:to-red-900/30 hover:text-orange-400 hover:border hover:border-orange-500/50'
                )}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </NavLink>
            );
          })}

          {/* Admin navigation */}
          {hasRole('admin') && (
            <>
              <div className="pt-4 mt-4 border-t border-orange-500/30">
                <p className="px-3 text-xs font-black text-orange-500 uppercase tracking-wider mb-2">
                  👑 ELITE COMMAND
                </p>
              </div>
              {adminNavigation.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={clsx(
                      'flex items-center px-3 py-3 text-sm font-bold rounded-lg transition-all duration-200 uppercase tracking-wider',
                      isActive 
                        ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white border border-orange-500 shadow-lg shadow-orange-500/25' 
                        : 'text-gray-300 hover:bg-gradient-to-r hover:from-orange-900/30 hover:to-red-900/30 hover:text-orange-400 hover:border hover:border-orange-500/50'
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </NavLink>
                );
              })}
            </>
          )}
        </nav>

        {/* Bottom navigation */}
        <div className="flex-shrink-0 px-2 py-4 bg-gradient-to-b from-gray-900 to-black border-t border-orange-500/30">
          <button
            onClick={handleLogout}
            className="group flex items-center px-3 py-3 text-sm font-bold rounded-lg text-gray-300 hover:bg-gradient-to-r hover:from-red-900/30 hover:to-orange-900/30 hover:text-red-400 hover:border hover:border-red-500/50 w-full transition-all duration-200 uppercase tracking-wider"
          >
            <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 flex-shrink-0" />
            RETREAT
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <SidebarContent />
      </div>
    </>
  );
};

export default Sidebar;

