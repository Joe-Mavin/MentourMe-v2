import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Patch getDisplayMedia to prevent errors on mobile devices
if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
  const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
  
  navigator.mediaDevices.getDisplayMedia = function(constraints) {
    // Check if this is a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      console.warn('⚠️ getDisplayMedia called on mobile device, rejecting gracefully');
      return Promise.reject(new Error('Screen sharing is not supported on mobile devices'));
    }
    
    // Call the original method for desktop devices
    return originalGetDisplayMedia.call(this, constraints);
  };
}

// Global error handler for browser extension conflicts and WebRTC errors
window.addEventListener('error', (event) => {
  // Suppress extension-related errors that don't affect functionality
  if (event.error && event.error.message) {
    if (event.error.message.includes('message channel closed')) {
      console.warn('⚠️ Browser extension error suppressed:', event.error.message);
      event.preventDefault();
      return false;
    }
    
    // Suppress getDisplayMedia errors that occur during initialization
    if (event.error.message.includes('getDisplayMedia') || 
        event.error.message.includes('Illegal invocation')) {
      console.warn('⚠️ getDisplayMedia error suppressed (likely mobile device):', event.error.message);
      event.preventDefault();
      return false;
    }
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message) {
    if (event.reason.message.includes('message channel closed')) {
      console.warn('⚠️ Browser extension promise rejection suppressed:', event.reason.message);
      event.preventDefault();
      return false;
    }
    
    // Suppress getDisplayMedia promise rejections
    if (event.reason.message.includes('getDisplayMedia') || 
        event.reason.message.includes('Illegal invocation')) {
      console.warn('⚠️ getDisplayMedia promise rejection suppressed (likely mobile device):', event.reason.message);
      event.preventDefault();
      return false;
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

