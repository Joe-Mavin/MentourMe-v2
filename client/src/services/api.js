import axios from 'axios';
import toast from 'react-hot-toast';

// Get API base URL from environment
const getApiBaseURL = () => {
  // Check if running in test environment
  if (process.env.NODE_ENV === 'test') {
    return '/api';
  }
  
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl) {
    return `${envApiUrl}/api`;
  }
  
  // Fallback logic
  if (import.meta.env.DEV) {
    return '/api'; // Use Vite proxy in development
  }
  
  // Production fallback
  return 'https://mentourme-v2.onrender.com/api';
};

// Create axios instance
const api = axios.create({
  baseURL: getApiBaseURL(),
  timeout: process.env.NODE_ENV === 'test' ? 15000 : (parseInt(import.meta.env.VITE_API_TIMEOUT) || 15000),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create a separate instance for chat/messaging with longer timeout
const chatAPI = axios.create({
  baseURL: getApiBaseURL(),
  timeout: process.env.NODE_ENV === 'test' ? 30000 : (parseInt(import.meta.env.VITE_CHAT_API_TIMEOUT) || 30000),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    if (response) {
      switch (response.status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          break;
        case 403:
          toast.error('Access denied. Insufficient permissions.');
          break;
        case 404:
          toast.error('Resource not found.');
          break;
        case 429:
          toast.error('Too many requests. Please try again later.');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          if (response.data?.message) {
            toast.error(response.data.message);
          } else {
            toast.error('An unexpected error occurred.');
          }
      }
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please check your connection.');
    } else {
      toast.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

// Add same interceptors to chatAPI
chatAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

chatAPI.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    if (response) {
      switch (response.status) {
        case 401:
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          break;
        case 403:
          toast.error('Access denied. Insufficient permissions.');
          break;
        case 404:
          toast.error('Resource not found.');
          break;
        case 429:
          toast.error('Too many requests. Please try again later.');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          if (response.data?.message) {
            toast.error(response.data.message);
          } else {
            toast.error('An unexpected error occurred.');
          }
      }
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Chat request timeout. Please check your connection.');
    } else if (error.code === 'ECONNREFUSED') {
      toast.error('Cannot connect to server. Please ensure the server is running on port 5000.');
    } else {
      toast.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  refreshToken: () => api.post('/auth/refresh-token'),
};

// Onboarding API
export const onboardingAPI = {
  submit: (data) => api.post('/onboarding', data),
  get: () => api.get('/onboarding'),
  update: (data) => api.put('/onboarding', data),
  getRecommendations: () => api.get('/onboarding/recommendations'),
};

// Messages API - using chatAPI for longer timeouts
export const messagesAPI = {
  send: (messageData) => chatAPI.post('/messages', messageData),
  getConversations: (params) => chatAPI.get('/messages/conversations', { params }),
  getDirectMessages: (otherUserId, params) => 
    chatAPI.get(`/messages/direct/${otherUserId}`, { params }),
  getRoomMessages: (roomId, params) => 
    chatAPI.get(`/messages/room/${roomId}`, { params }),
  editMessage: (messageId, content) => 
    chatAPI.put(`/messages/${messageId}`, { content }),
  deleteMessage: (messageId) => chatAPI.delete(`/messages/${messageId}`),
};

// Tasks API
export const tasksAPI = {
  create: (taskData) => api.post('/tasks', taskData),
  getAll: (params) => api.get('/tasks', { params }),
  getById: (taskId) => api.get(`/tasks/${taskId}`),
  update: (taskId, taskData) => api.put(`/tasks/${taskId}`, taskData),
  updateStatus: (taskId, statusData) => 
    api.patch(`/tasks/${taskId}/status`, statusData),
  delete: (taskId) => api.delete(`/tasks/${taskId}`),
  getStats: () => api.get('/tasks/stats'),
};

// Rooms API
export const roomsAPI = {
  getAll: (params) => api.get('/rooms', { params }),
  getRooms: (params) => api.get('/rooms', { params }), // Alias for getAll
  create: (roomData) => api.post('/rooms', roomData),
  getJoined: (params) => api.get('/rooms/joined', { params }),
  getJoinedRooms: (params) => api.get('/rooms/joined', { params }), // Alias for getJoined
  join: (roomId) => api.post(`/rooms/${roomId}/join`),
  leave: (roomId) => api.post(`/rooms/${roomId}/leave`),
  getMembers: (roomId, params) => api.get(`/rooms/${roomId}/members`, { params }),
  addMember: (roomId, memberData) => api.post(`/rooms/${roomId}/members`, memberData),
  updateMember: (roomId, memberId, memberData) => 
    api.put(`/rooms/${roomId}/members/${memberId}`, memberData),
  removeMember: (roomId, memberId) => api.delete(`/rooms/${roomId}/members/${memberId}`),
};

// Users API
export const usersAPI = {
  search: (params) => api.get('/users/search', { params }),
  getProfile: (userId) => api.get(`/users/${userId}`),
  updateProfile: (userId, userData) => api.put(`/users/${userId}`, userData),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (userId, statusData) => 
    api.put(`/admin/users/${userId}/status`, statusData),
  getPendingMentors: (params) => api.get('/admin/mentors/pending', { params }),
  approveMentor: (mentorId, approvalData) => 
    api.put(`/admin/mentors/${mentorId}/approve`, approvalData),
  getAllRooms: (params) => api.get('/admin/rooms', { params }),
  createRoom: (roomData) => api.post('/admin/rooms', roomData),
  deleteRoom: (roomId) => api.delete(`/admin/rooms/${roomId}`),
};

// WebRTC API
export const webrtcAPI = {
  getActiveCalls: () => api.get('/webrtc/calls/active'),
  getCallStats: (callId) => api.get(`/webrtc/calls/${callId}/stats`),
};

// Video Calls API
export const videoCallsAPI = {
  initiateCall: (data) => api.post('/video-calls/initiate', data),
  acceptCall: (callId) => api.post(`/video-calls/${callId}/accept`),
  rejectCall: (callId, data) => api.post(`/video-calls/${callId}/reject`, data),
  endCall: (callId, data) => api.post(`/video-calls/${callId}/end`, data),
  getCallHistory: (params = {}) => api.get('/video-calls/history', { params }),
};

// Recommendations API endpoints
export const recommendationsAPI = {
  getRecommendations: (params = {}) => api.get('/recommendations', { params }),
  getFilters: () => api.get('/recommendations/filters'),
  requestMentorship: (data) => api.post('/recommendations/request', data),
  saveToFavorites: (userId, favorited) => api.post('/recommendations/favorites', { userId, favorited }),
};

// Mentorship API endpoints
export const mentorshipAPI = {
  createRequest: (data) => api.post('/recommendations/request', data), // Same as recommendationsAPI.requestMentorship
  getRequests: (params = {}) => api.get('/mentorship', { params }),
  respondToRequest: (requestId, data) => api.patch(`/mentorship/${requestId}/respond`, data),
  cancelRequest: (requestId) => api.patch(`/mentorship/${requestId}/cancel`),
  getStats: () => api.get('/mentorship/stats'),
  getActiveMentorships: (params = {}) => api.get('/mentorship/active', { params }),
  getUnassignedMentees: () => api.get('/mentorship/unassigned-mentees'),
  adminAssignMentee: (data) => api.post('/mentorship/admin-assign', data),
};

// Notifications API endpoints
export const notificationsAPI = {
  getNotifications: (params = {}) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/count'),
  markAsRead: (notificationId) => api.patch(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}`),
};

// File upload utility
export const uploadFile = async (file, type = 'general') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  
  try {
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        // You can use this to show upload progress
        console.log(`Upload Progress: ${progress}%`);
      },
    });
    
    return response;
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

// Utility functions
export const handleApiError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  } else if (error.message) {
    return error.message;
  } else {
    return 'An unexpected error occurred';
  }
};

export const isAuthError = (error) => {
  return error.response?.status === 401;
};

export default api;

