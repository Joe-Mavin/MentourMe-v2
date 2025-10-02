import toast from 'react-hot-toast';

// Error types
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  AUTH: 'AUTH_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  SERVER: 'SERVER_ERROR',
  PERMISSION: 'PERMISSION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// Get user-friendly error messages
export const getErrorMessage = (error, context = 'operation') => {
  // Handle different error types
  if (error?.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        if (data?.errors && Array.isArray(data.errors)) {
          return data.errors.map(err => err.msg || err.message).join(', ');
        }
        return data?.message || `Invalid request. Please check your input.`;
      
      case 401:
        return 'Your session has expired. Please log in again.';
      
      case 403:
        return 'You don\'t have permission to perform this action.';
      
      case 404:
        return `The requested ${context} was not found.`;
      
      case 409:
        return data?.message || 'This action conflicts with existing data.';
      
      case 422:
        return data?.message || 'The data provided is invalid.';
      
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      
      case 500:
        return 'Server error. Please try again later.';
      
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again later.';
      
      default:
        return data?.message || `Failed to complete ${context}. Please try again.`;
    }
  }

  // Handle network errors
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return 'Request timed out. Please check your connection and try again.';
  }

  if (error?.code === 'ECONNREFUSED' || error?.message?.includes('Network Error')) {
    return 'Cannot connect to server. Please check your internet connection.';
  }

  // Handle custom error types
  if (error?.type) {
    switch (error.type) {
      case ERROR_TYPES.NETWORK:
        return 'Network connection error. Please check your internet connection.';
      case ERROR_TYPES.TIMEOUT:
        return 'Request timed out. Please try again.';
      case ERROR_TYPES.AUTH:
        return 'Authentication failed. Please log in again.';
      case ERROR_TYPES.VALIDATION:
        return error.message || 'Please check your input and try again.';
      case ERROR_TYPES.PERMISSION:
        return 'You don\'t have permission to perform this action.';
      case ERROR_TYPES.RATE_LIMIT:
        return 'Too many requests. Please wait before trying again.';
      default:
        return error.message || `Failed to complete ${context}.`;
    }
  }

  // Fallback to error message or generic message
  return error?.message || `An unexpected error occurred during ${context}.`;
};

// Classify error type
export const getErrorType = (error) => {
  if (error?.response) {
    const status = error.response.status;
    
    if (status === 401) return ERROR_TYPES.AUTH;
    if (status === 403) return ERROR_TYPES.PERMISSION;
    if (status === 404) return ERROR_TYPES.NOT_FOUND;
    if (status === 422 || status === 400) return ERROR_TYPES.VALIDATION;
    if (status === 429) return ERROR_TYPES.RATE_LIMIT;
    if (status >= 500) return ERROR_TYPES.SERVER;
  }

  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return ERROR_TYPES.TIMEOUT;
  }

  if (error?.code === 'ECONNREFUSED' || error?.message?.includes('Network Error')) {
    return ERROR_TYPES.NETWORK;
  }

  return error?.type || ERROR_TYPES.UNKNOWN;
};

// Enhanced error handler with different notification strategies
export const handleError = (error, options = {}) => {
  const {
    context = 'operation',
    showToast = true,
    silent = false,
    customMessage = null,
    onRetry = null,
    retryable = false
  } = options;

  const errorType = getErrorType(error);
  const errorMessage = customMessage || getErrorMessage(error, context);

  // Log error for debugging
  if (import.meta.env.DEV || import.meta.env.VITE_DEBUG_MODE === 'true') {
    console.group(`Error in ${context}`);
    console.error('Error object:', error);
    console.error('Error type:', errorType);
    console.error('Error message:', errorMessage);
    console.groupEnd();
  }

  // Show appropriate notification
  if (!silent && showToast) {
    if (retryable && onRetry) {
      // Show toast with retry action
      toast.error(
        (t) => (
          <div className="flex flex-col gap-2">
            <span>{errorMessage}</span>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                onRetry();
              }}
              className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ),
        { duration: 6000 }
      );
    } else {
      // Show regular error toast
      toast.error(errorMessage, {
        duration: errorType === ERROR_TYPES.AUTH ? 8000 : 5000
      });
    }
  }

  // Handle specific error types
  switch (errorType) {
    case ERROR_TYPES.AUTH:
      // Clear auth data and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      break;
    
    case ERROR_TYPES.PERMISSION:
      // Could redirect to access denied page
      break;
    
    case ERROR_TYPES.NETWORK:
      // Could trigger network status check
      break;
  }

  return {
    type: errorType,
    message: errorMessage,
    originalError: error
  };
};

// Async error wrapper for API calls
export const withErrorHandling = async (apiCall, options = {}) => {
  try {
    const result = await apiCall();
    return { success: true, data: result };
  } catch (error) {
    const errorInfo = handleError(error, options);
    return { 
      success: false, 
      error: errorInfo,
      message: errorInfo.message 
    };
  }
};

// React error boundary helper
export const logErrorToService = (error, errorInfo) => {
  // In production, you would send this to an error tracking service
  // like Sentry, LogRocket, or Bugsnag
  
  if (import.meta.env.PROD) {
    // Example: Send to error tracking service
    // Sentry.captureException(error, { extra: errorInfo });
    console.error('Error boundary caught an error:', error, errorInfo);
  } else {
    console.group('React Error Boundary');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.groupEnd();
  }
};

// Validation error helpers
export const formatValidationErrors = (errors) => {
  if (Array.isArray(errors)) {
    return errors.map(error => error.msg || error.message || error).join(', ');
  }
  
  if (typeof errors === 'object') {
    return Object.values(errors).flat().join(', ');
  }
  
  return String(errors);
};

// Network status utilities
export const isOnline = () => navigator.onLine;

export const checkNetworkStatus = async () => {
  try {
    await fetch('/api/health', { 
      method: 'HEAD',
      cache: 'no-cache',
      mode: 'no-cors'
    });
    return true;
  } catch {
    return false;
  }
};

export default {
  ERROR_TYPES,
  getErrorMessage,
  getErrorType,
  handleError,
  withErrorHandling,
  logErrorToService,
  formatValidationErrors,
  isOnline,
  checkNetworkStatus
};
