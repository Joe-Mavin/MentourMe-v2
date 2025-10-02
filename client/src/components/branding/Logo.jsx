import React from 'react';
import clsx from 'clsx';

const Logo = ({ 
  size = 'md', 
  variant = 'full', 
  className = '',
  showIcon = true,
  showText = true 
}) => {
  const sizeClasses = {
    xs: 'text-lg',
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
    '2xl': 'text-5xl'
  };

  const iconSizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20'
  };

  return (
    <div className={clsx('flex items-center space-x-3', className)}>
      {showIcon && (
        <div className={clsx(
          'relative flex items-center justify-center rounded-2xl',
          'bg-gradient-to-br from-orange-600 via-red-600 to-orange-700',
          'shadow-lg shadow-orange-500/25',
          iconSizes[size]
        )}>
          {/* Modern geometric icon representing mentorship connection */}
          <svg 
            className="w-3/5 h-3/5 text-white" 
            viewBox="0 0 24 24" 
            fill="none"
          >
            {/* Mentor figure */}
            <circle cx="8" cy="6" r="3" fill="currentColor" opacity="0.9"/>
            <path 
              d="M8 10c-2.5 0-4.5 1.5-4.5 3.5v1.5c0 0.5 0.5 1 1 1h7c0.5 0 1-0.5 1-1v-1.5c0-2-2-3.5-4.5-3.5z" 
              fill="currentColor" 
              opacity="0.8"
            />
            
            {/* Mentee figure */}
            <circle cx="16" cy="8" r="2.5" fill="currentColor" opacity="0.7"/>
            <path 
              d="M16 12c-2 0-3.5 1.2-3.5 2.8v1.2c0 0.4 0.4 0.8 0.8 0.8h5.4c0.4 0 0.8-0.4 0.8-0.8v-1.2c0-1.6-1.5-2.8-3.5-2.8z" 
              fill="currentColor" 
              opacity="0.6"
            />
            
            {/* Connection lines representing mentorship flow */}
            <path 
              d="M10.5 8.5L13.5 10.5" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round"
              opacity="0.9"
            />
            <path 
              d="M11 12L13 13" 
              stroke="currentColor" 
              strokeWidth="1" 
              strokeLinecap="round"
              opacity="0.7"
            />
          </svg>
          
          {/* Subtle glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent"></div>
        </div>
      )}
      
      {showText && (
        <div className="flex flex-col">
          <span className={clsx(
            'font-black tracking-tight leading-none',
            'bg-gradient-to-r from-orange-500 via-red-500 to-orange-600',
            'bg-clip-text text-transparent',
            sizeClasses[size]
          )}>
            MentourMe
          </span>
          {variant === 'full' && size !== 'xs' && size !== 'sm' && (
            <span className="text-xs text-orange-500 font-bold tracking-wider uppercase">
              Forge Your Path
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Icon-only version for compact spaces
export const LogoIcon = ({ size = 'md', className = '' }) => (
  <Logo 
    size={size} 
    className={className} 
    showText={false} 
    showIcon={true} 
  />
);

// Text-only version for headers
export const LogoText = ({ size = 'md', variant = 'full', className = '' }) => (
  <Logo 
    size={size} 
    variant={variant}
    className={className} 
    showText={true} 
    showIcon={false} 
  />
);

export default Logo;
