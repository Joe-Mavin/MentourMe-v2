import React from 'react';
import clsx from 'clsx';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'orange', 
  className = '',
  text = null 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    orange: 'border-orange-500',
    white: 'border-white',
    gray: 'border-gray-600',
    primary: 'border-orange-500' // Fallback to orange for legacy usage
  };

  return (
    <div className={clsx('flex flex-col items-center justify-center', className)}>
      <div 
        className={clsx(
          'animate-spin rounded-full border-b-2',
          sizeClasses[size],
          colorClasses[color]
        )}
      />
      {text && (
        <p className="mt-2 text-sm text-gray-300 font-medium">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;

