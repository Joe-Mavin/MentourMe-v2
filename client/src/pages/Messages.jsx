import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import MessagingLayout from '../features/messaging/components/MessagingLayout';
import { useMessaging } from '../features/messaging/context/MessagingContext';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

// Error Boundary Component
class MessagesErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Messages Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-900 via-black to-gray-900">
          <div className="text-center max-w-md px-8">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-orange-500">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-black text-white mb-4 uppercase tracking-wider">Battle Communications Down</h2>
            <p className="text-gray-300 mb-6 font-medium">There was an error loading the warrior messaging interface.</p>
            <button 
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-black uppercase tracking-wider hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-200 border border-orange-500"
            >
              Restart Battle Comms
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const Messages = () => {
  return (
    <MessagesErrorBoundary>
      <div className="h-full -m-6"> {/* Remove default padding for full-height layout */}
        <Routes>
          <Route path="/" element={<MessagingLayout />} />
          <Route path="/direct/:id" element={<MessagingLayout />} />
          <Route path="/room/:id" element={<MessagingLayout />} />
        </Routes>
      </div>
    </MessagesErrorBoundary>
  );
};

export default Messages;

