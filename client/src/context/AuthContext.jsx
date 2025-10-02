import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';
import socketService from '../services/socket';
import toast from 'react-hot-toast';

const AuthContext = createContext();

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
    case 'REGISTER_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };
    
    case 'LOGIN_FAILURE':
    case 'REGISTER_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload,
      };
    
    case 'LOGOUT':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null,
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    
    default:
      return state;
  }
};

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');

      if (token && userData) {
        try {
          // ✅ FIX: Always fetch fresh user data on app initialization
          // This ensures we have the latest onboarding status
          const response = await authAPI.getProfile();
          const freshUserData = response.data.data.user;
          
          // Update localStorage with fresh data
          localStorage.setItem('user_data', JSON.stringify(freshUserData));
          
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: freshUserData, // ✅ Use fresh data instead of cached
              token,
            },
          });

          // Connect to socket
          socketService.connect(token);
          
        } catch (error) {
          console.error('Token validation failed:', error);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await authAPI.login(credentials);
      const { user, token } = response.data.data;

      // Store in localStorage
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_data', JSON.stringify(user));

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token },
      });

      // Connect to socket
      socketService.connect(token);

      toast.success('Login successful!');
      
      // Check for redirect after login
      const redirectPath = localStorage.getItem('redirect_after_login');
      if (redirectPath) {
        localStorage.removeItem('redirect_after_login');
        // Small delay to ensure state is updated
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 100);
      }
      
      return { success: true, user };

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage,
      });

      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: 'REGISTER_START' });

    try {
      const response = await authAPI.register(userData);
      const { user, token } = response.data.data;

      // Store in localStorage
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_data', JSON.stringify(user));

      dispatch({
        type: 'REGISTER_SUCCESS',
        payload: { user, token },
      });

      // Connect to socket
      socketService.connect(token);

      toast.success('Registration successful!');
      return { success: true, user };

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      
      dispatch({
        type: 'REGISTER_FAILURE',
        payload: errorMessage,
      });

      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');

    // Disconnect socket
    socketService.disconnect();

    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const response = await authAPI.updateProfile(userData);
      const updatedUser = response.data.data.user;

      // Update localStorage
      localStorage.setItem('user_data', JSON.stringify(updatedUser));

      dispatch({
        type: 'UPDATE_USER',
        payload: updatedUser,
      });

      toast.success('Profile updated successfully');
      return { success: true, user: updatedUser };

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      await authAPI.changePassword(passwordData);
      toast.success('Password changed successfully');
      return { success: true };

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password change failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Refresh token
  const refreshToken = async () => {
    try {
      const response = await authAPI.refreshToken();
      const { token } = response.data.data;

      localStorage.setItem('auth_token', token);
      
      dispatch({
        type: 'UPDATE_USER',
        payload: { token },
      });

      return { success: true, token };

    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return { success: false };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // ✅ FIX: Add function to refresh user data from server
  const refreshUserData = async () => {
    try {
      const response = await authAPI.getProfile();
      const updatedUser = response.data.data.user;
      
      // Update localStorage
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
      
      dispatch({
        type: 'UPDATE_USER',
        payload: updatedUser,
      });
      
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      return { success: false, error: error.message };
    }
  };

  // Check if user has specific role(s)
  const hasRole = (roles) => {
    if (!state.user?.role) return false;
    
    // Handle both single role string and array of roles
    if (Array.isArray(roles)) {
      return roles.includes(state.user.role);
    }
    return state.user.role === roles;
  };

  // Check if user is approved (for mentors)
  const isApproved = () => {
    return state.user?.approved !== false;
  };

  // ✅ FIX: Check if onboarding is completed - handle different data structures
  const isOnboardingCompleted = () => {
    // Check if user has onboarding data with completedAt
    if (state.user?.onboardingData?.completedAt) {
      return true;
    }
    // ✅ Fallback: Check if user was created recently and has basic onboarding info
    // This handles cases where completedAt might not be set but onboarding was done
    if (state.user?.onboardingData && 
        (state.user.onboardingData.goals?.length > 0 || 
         state.user.onboardingData.age)) {
      return true;
    }
    // ✅ TEMP FIX: For existing users created before today, assume onboarding is completed
    // This is a temporary fix while we debug the association issue
    if (state.user?.createdAt) {
      const userCreatedDate = new Date(state.user.createdAt);
      const today = new Date();
      const daysDiff = (today - userCreatedDate) / (1000 * 60 * 60 * 24);
      
      // If user was created more than 1 day ago, assume onboarding is completed
      if (daysDiff > 1) {
        console.log('🔧 TEMP: Assuming onboarding completed for existing user:', state.user.email);
        return true;
      }
    }
    
    return false;
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshToken,
    refreshUserData, // ✅ FIX: Add the new refresh function
    clearError,
    hasRole,
    isApproved,
    isOnboardingCompleted,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

