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
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">There was an error loading the messaging interface.</p>
            <button 
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Reload Page
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

