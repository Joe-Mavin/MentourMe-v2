import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import IncomingCallNotification from '../mentorship/IncomingCallNotification';
import { useAuth } from '../../context/AuthContext';
import socketService from '../../services/socket';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Setup socket event listeners for notifications
  useEffect(() => {
    const handleNewMessage = (message) => {
      // Handle new message notifications
      if (Notification.permission === 'granted' && message.senderId !== user?.id) {
        new Notification(`New message from ${message.sender.name}`, {
          body: message.content.substring(0, 100),
          icon: '/favicon.ico'
        });
      }
    };

    const handleIncomingCall = (callData) => {
      // Handle incoming call notifications
      if (Notification.permission === 'granted') {
        new Notification(`Incoming call from ${callData.caller.name}`, {
          body: `${callData.callType} call`,
          icon: '/favicon.ico'
        });
      }
    };

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Add event listeners
    socketService.on('new_direct_message', handleNewMessage);
    socketService.on('new_room_message', handleNewMessage);
    socketService.on('incoming_call', handleIncomingCall);

    return () => {
      socketService.off('new_direct_message', handleNewMessage);
      socketService.off('new_room_message', handleNewMessage);
      socketService.off('incoming_call', handleIncomingCall);
    };
  }, [user?.id]);

  return (
    <div className="h-screen flex overflow-hidden bg-black">
      {/* Sidebar */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header */}
        <Header 
          setSidebarOpen={setSidebarOpen}
        />

        {/* Main content area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-black">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Incoming Call Notification */}
      <IncomingCallNotification socket={socketService.socket} />
    </div>
  );
};

export default Layout;

