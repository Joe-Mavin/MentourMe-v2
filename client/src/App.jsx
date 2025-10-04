import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import BlogManagementPage from './pages/BlogManagementPage';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import MessagesSimple from './pages/MessagesSimple';
import Tasks from './pages/Tasks';
import Community from './pages/Community';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import VideoCall from './pages/VideoCall';
import MentorshipVideoCall from './pages/MentorshipVideoCall';
import MentorshipDashboard from './pages/MentorshipDashboard';
import NotificationsPage from './pages/NotificationsPage';
import NotFound from './pages/NotFound';

const AppRoutes = () => {
  const { isAuthenticated, loading, user, isOnboardingCompleted } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? 
            <Navigate to={`/dashboard/${user?.role || 'user'}`} replace /> : 
            <Landing />
        } 
      />
      <Route 
        path="/login" 
        element={
          isAuthenticated ? 
            <Navigate to={`/dashboard/${user?.role || 'user'}`} replace /> : 
            <Login />
        } 
      />
      <Route 
        path="/register" 
        element={
          isAuthenticated ? 
            <Navigate to="/onboarding" replace /> : 
            <Register />
        } 
      />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute />}>
        <Route 
          path="/video-call/:callId" 
          element={
            !isOnboardingCompleted() ? 
              <Navigate to="/onboarding" replace /> : 
              <VideoCall />
          } 
        />
        <Route 
          path="/mentorship-video-call/:roomId" 
          element={
            !isOnboardingCompleted() ? 
              <Navigate to="/onboarding" replace /> : 
              <Layout><MentorshipVideoCall /></Layout>
          } 
        />
        <Route 
          path="/mentorship" 
          element={
            !isOnboardingCompleted() ? 
              <Navigate to="/onboarding" replace /> : 
              <Layout><MentorshipDashboard /></Layout>
          } 
        />
        <Route 
          path="/blog-management" 
          element={
            !isOnboardingCompleted() ? 
              <Navigate to="/onboarding" replace /> : 
              <Layout><BlogManagementPage /></Layout>
          } 
        />
        {/* Onboarding route - required for new users */}
        <Route 
          path="/onboarding" 
          element={
            isOnboardingCompleted() ? 
              <Navigate to="/dashboard" replace /> : 
              <Layout><Onboarding /></Layout>
          } 
        />

        {/* Main application routes - ✅ FIX: Role-based dashboard routing */}
        <Route 
          path="/dashboard" 
          element={
            !isOnboardingCompleted() ? 
              <Navigate to="/onboarding" replace /> : 
              <Layout><Dashboard /></Layout>
          } 
        />
        
        {/* ✅ FIX: Role-based dashboard routes with auto-redirect fallback */}
        <Route 
          path="/dashboard/user" 
          element={
            !isOnboardingCompleted() ? 
              <Navigate to="/onboarding" replace /> : 
              user?.role !== 'user' ?
                <Navigate to="/dashboard" replace /> :
                <Layout><Dashboard /></Layout>
          } 
        />
        
        <Route 
          path="/dashboard/mentor" 
          element={
            !isOnboardingCompleted() ? 
              <Navigate to="/onboarding" replace /> : 
              user?.role !== 'mentor' ?
                <Navigate to="/dashboard" replace /> :
                <Layout><Dashboard /></Layout>
          } 
        />
        
        <Route 
          path="/dashboard/admin" 
          element={
            !isOnboardingCompleted() ? 
              <Navigate to="/onboarding" replace /> : 
              user?.role !== 'admin' ?
                <Navigate to="/dashboard" replace /> :
                <Layout><AdminDashboard /></Layout>
          } 
        />
        
        <Route 
          path="/messages/*" 
          element={
            !isOnboardingCompleted() ? 
              <Navigate to="/onboarding" replace /> : 
              <Layout><MessagesSimple /></Layout>
          } 
        />
        
        <Route 
          path="/tasks" 
          element={
            !isOnboardingCompleted() ? 
              <Navigate to="/onboarding" replace /> : 
              <Layout><Tasks /></Layout>
          } 
        />
        
        <Route 
          path="/community/*" 
          element={
            !isOnboardingCompleted() ? 
              <Navigate to="/onboarding" replace /> : 
              <Layout><Community /></Layout>
          } 
        />
        
        <Route 
          path="/profile" 
          element={
            !isOnboardingCompleted() ? 
              <Navigate to="/onboarding" replace /> : 
              <Layout><Profile /></Layout>
          } 
        />
        
        <Route 
          path="/blog-management" 
          element={
            !isOnboardingCompleted() ? 
              <Navigate to="/onboarding" replace /> : 
              <Layout><BlogManagementPage /></Layout>
          } 
        />

        {/* Video call routes */}
        <Route 
          path="/call/:callId" 
          element={
            !isOnboardingCompleted() ? 
              <Navigate to="/onboarding" replace /> : 
              <VideoCall />
          } 
        />
        

        {/* Mentorship routes */}
        <Route 
          path="/mentorship/*" 
          element={
            !isOnboardingCompleted() ? 
              <Navigate to="/onboarding" replace /> : 
              <Layout><MentorshipDashboard /></Layout>
          } 
        />

        {/* Notifications route */}
        <Route 
          path="/notifications" 
          element={
            !isOnboardingCompleted() ? 
              <Navigate to="/onboarding" replace /> : 
              <Layout><NotificationsPage /></Layout>
          } 
        />

        {/* Admin routes */}
        <Route 
          path="/admin/*" 
          element={
            user?.role !== 'admin' ? 
              <Navigate to="/dashboard" replace /> : 
              <Layout><AdminDashboard /></Layout>
          } 
        />
      </Route>

      {/* 404 route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#10B981',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: '#EF4444',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

