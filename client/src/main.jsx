import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Global error handler for browser extension conflicts
window.addEventListener('error', (event) => {
  // Suppress extension-related errors that don't affect functionality
  if (event.error && event.error.message && 
      event.error.message.includes('message channel closed')) {
    console.warn('⚠️ Browser extension error suppressed:', event.error.message);
    event.preventDefault();
    return false;
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && 
      event.reason.message.includes('message channel closed')) {
    console.warn('⚠️ Browser extension promise rejection suppressed:', event.reason.message);
    event.preventDefault();
    return false;
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

