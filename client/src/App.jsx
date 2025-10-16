import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';

// Critical pages (loaded immediately)
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// Lazy-loaded pages for better performance
const Blog = React.lazy(() => import('./pages/Blog'));
const BlogPost = React.lazy(() => import('./pages/BlogPost'));
const BlogManagementPage = React.lazy(() => import('./pages/BlogManagementPage'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Onboarding = React.lazy(() => import('./pages/Onboarding'));
const MessagesSimple = React.lazy(() => import('./pages/MessagesSimple'));
const Tasks = React.lazy(() => import('./pages/Tasks'));
const Community = React.lazy(() => import('./pages/Community'));
const Profile = React.lazy(() => import('./pages/Profile'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const VideoCall = React.lazy(() => import('./pages/VideoCall'));
const MentorshipDashboard = React.lazy(() => import('./pages/MentorshipDashboard'));
const NotificationsPage = React.lazy(() => import('./pages/NotificationsPage'));

// Helper component for lazy loading with suspense
const LazyWrapper = ({ children }) => (
  <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-900"><LoadingSpinner size="lg" /></div>}>
    {children}
  </Suspense>
);

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
      <Route path="/blog" element={<LazyWrapper><Blog /></LazyWrapper>} />
      <Route path="/blog/:slug" element={<LazyWrapper><BlogPost /></LazyWrapper>} />

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
        {/* Unified video call route - handles both callId and roomId */}
        <Route 
          path="/mentorship-video-call/:callId" 
          element={
            !isOnboardingCompleted() ? 
              <Navigate to="/onboarding" replace /> : 
              <VideoCall />
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

