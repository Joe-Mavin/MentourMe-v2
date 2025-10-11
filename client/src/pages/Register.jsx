import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/common/LoadingSpinner';

const schema = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: yup
    .string()
    .email('Please enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  role: yup
    .string()
    .required('Please select a role')
    .oneOf(['user', 'mentor'], 'Invalid role selected'),
  phone: yup
    .string()
    .matches(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number')
    .optional(),
  agreeToTerms: yup
    .boolean()
    .oneOf([true], 'You must agree to the terms and conditions'),
});

const Register = () => {
  const { register: registerUser, loading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      role: 'user',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    const { confirmPassword, agreeToTerms, ...userData } = data;
    
    const result = await registerUser(userData);
    if (result.success) {
      navigate('/onboarding', { replace: true });
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
            JOIN THE
            <span className="block bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              ELITE RANKS
            </span>
          </h2>
          <p className="mt-3 text-center text-base text-gray-300 font-medium">
            Forge your path to greatness. Choose your battle role.
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-800 p-8 shadow-2xl">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-bold text-orange-500 mb-2 uppercase tracking-wider">
                  Warrior Name
                </label>
                <input
                  {...register('name')}
                  type="text"
                  autoComplete="name"
                  className={`w-full px-4 py-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 border ${
                    errors.name ? 'border-red-500' : 'border-gray-700'
                  } focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium transition-all`}
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-400 font-medium">{errors.name.message}</p>
                )}
              </div>

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

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-bold text-orange-500 mb-2 uppercase tracking-wider">
                  Phone Number <span className="text-gray-400 normal-case">(optional)</span>
                </label>
                <input
                  {...register('phone')}
                  type="tel"
                  autoComplete="tel"
                  className={`w-full px-4 py-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 border ${
                    errors.phone ? 'border-red-500' : 'border-gray-700'
                  } focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium transition-all`}
                  placeholder="Enter your phone number"
                />
                {errors.phone && (
                  <p className="mt-2 text-sm text-red-400 font-medium">{errors.phone.message}</p>
                )}
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-bold text-orange-500 mb-3 uppercase tracking-wider">Choose Your Path</label>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <input
                      {...register('role')}
                      id="user"
                      value="user"
                      type="radio"
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 bg-gray-800 border-gray-600 mt-1"
                    />
                    <label htmlFor="user" className="ml-3 block text-sm font-medium text-gray-300">
                      <div>
                        <span className="font-bold text-white">🗡️ WARRIOR (Mentee)</span>
                        <p className="text-gray-400 text-xs mt-1">Seeking guidance to forge your path to greatness</p>
                      </div>
                    </label>
                  </div>
                  <div className="flex items-start">
                    <input
                      {...register('role')}
                      id="mentor"
                      value="mentor"
                      type="radio"
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 bg-gray-800 border-gray-600 mt-1"
                    />
                    <label htmlFor="mentor" className="ml-3 block text-sm font-medium text-gray-300">
                      <div>
                        <span className="font-bold text-white">⚔️ COMMANDER (Mentor)</span>
                        <p className="text-gray-400 text-xs mt-1">Ready to lead and guide others to victory</p>
                      </div>
                    </label>
                  </div>
                </div>
                {errors.role && (
                  <p className="mt-2 text-sm text-red-400 font-medium">{errors.role.message}</p>
                )}
              </div>

              {/* Mentor Notice */}
              {selectedRole === 'mentor' && (
                <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-orange-500/30 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <ShieldCheckIcon className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-orange-300 font-medium">
                        <strong className="text-orange-500">Commander applications require approval.</strong> Our elite council will review your qualifications and notify you via email once you've earned your rank.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-orange-500 mb-2 uppercase tracking-wider">
                  Battle Password
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`w-full px-4 py-3 pr-12 rounded-lg bg-gray-800 text-white placeholder-gray-400 border ${
                      errors.password ? 'border-red-500' : 'border-gray-700'
                    } focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium transition-all`}
                    placeholder="Create a strong password"
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

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-bold text-orange-500 mb-2 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`w-full px-4 py-3 pr-12 rounded-lg bg-gray-800 text-white placeholder-gray-400 border ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-700'
                    } focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium transition-all`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-orange-500 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-400 font-medium">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Terms Agreement */}
              <div>
                <div className="flex items-start">
                  <input
                    {...register('agreeToTerms')}
                    id="agreeToTerms"
                    type="checkbox"
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 bg-gray-800 border-gray-600 rounded mt-1"
                  />
                  <label htmlFor="agreeToTerms" className="ml-3 block text-sm text-gray-300 font-medium">
                    I agree to the{' '}
                    <Link to="/terms" className="text-orange-500 hover:text-orange-400 font-bold">
                      Terms of Battle
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-orange-500 hover:text-orange-400 font-bold">
                      Privacy Shield
                    </Link>
                  </label>
                </div>
                {errors.agreeToTerms && (
                  <p className="mt-2 text-sm text-red-400 font-medium">{errors.agreeToTerms.message}</p>
                )}
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
                    FORGING WARRIOR...
                  </>
                ) : (
                  'JOIN THE ELITE'
                )}
              </button>
            </div>
          </form>

          {/* Sign in link */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-300 font-medium">
              Already a warrior?{' '}
              <Link
                to="/login"
                className="font-black text-orange-500 hover:text-orange-400 transition-colors uppercase tracking-wider"
              >
                ENTER THE ARENA
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
