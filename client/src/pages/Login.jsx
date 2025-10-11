import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/common/LoadingSpinner';

const schema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .required('Password is required'),
});

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    const result = await login(data);
    if (result.success) {
      // Check if there's a redirect path from the login context
      if (result.redirectPath) {
        console.log('🔄 Redirecting to saved path:', result.redirectPath);
        navigate(result.redirectPath, { replace: true });
      } else {
        // Default: Navigate to role-based dashboard after login
        const userRole = result.user?.role || 'user';
        navigate(`/dashboard/${userRole}`, { replace: true });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,69,0,0.1)_0%,transparent_50%)]"></div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center border-2 border-orange-500 shadow-lg shadow-orange-500/25">
            <span className="text-white font-black text-2xl">M</span>
          </div>
          <h2 className="mt-6 text-center text-3xl sm:text-4xl font-black text-white">
            WELCOME BACK
            <span className="block bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              WARRIOR
            </span>
          </h2>
          <p className="mt-3 text-center text-base text-gray-300 font-medium">
            Sign in to continue your battle for greatness
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 p-8 shadow-2xl">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-orange-500 mb-2 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className={`w-full px-4 py-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 border ${
                    errors.email ? 'border-red-500' : 'border-gray-700'
                  } focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium transition-all`}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-400 font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-orange-500 mb-2 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`w-full px-4 py-3 pr-12 rounded-lg bg-gray-800 text-white placeholder-gray-400 border ${
                      errors.password ? 'border-red-500' : 'border-gray-700'
                    } focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium transition-all`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-orange-500 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-400 font-medium">{errors.password.message}</p>
                )}
              </div>
            </div>

            {/* Remember me and Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 bg-gray-800 border-gray-600 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300 font-medium">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-bold text-orange-500 hover:text-orange-400 transition-colors uppercase tracking-wider"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            {/* Submit button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-4 rounded-lg font-black text-lg hover:shadow-2xl hover:shadow-orange-500/25 hover:scale-105 transition-all duration-300 border-2 border-orange-500 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" color="white" className="mr-2" />
                    ENTERING BATTLE...
                  </>
                ) : (
                  'ENTER THE ARENA'
                )}
              </button>
            </div>
          </form>

          {/* Sign up link */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-300 font-medium">
              New to the battlefield?{' '}
              <Link
                to="/register"
                className="font-black text-orange-500 hover:text-orange-400 transition-colors uppercase tracking-wider"
              >
                JOIN THE ELITE
              </Link>
            </p>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700">
          <h3 className="text-sm font-bold text-orange-500 mb-3 uppercase tracking-wider">⚔️ Demo Battle Access:</h3>
          <div className="text-xs text-gray-300 space-y-2 font-medium">
            <p><span className="text-orange-500 font-bold">COMMANDER:</span> admin@mentourme.com / Admin123!</p>
            <p><span className="text-orange-500 font-bold">MENTOR:</span> john.mentor@example.com / Mentor123!</p>
            <p><span className="text-orange-500 font-bold">WARRIOR:</span> alice@example.com / User123!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

