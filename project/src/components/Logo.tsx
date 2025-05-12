import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Outer circle - represents banking system */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full animate-spin-slow"
        style={{ animationDuration: '20s' }}
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-white opacity-20"
        />
        {/* Inner circle - represents AI processing */}
        <circle
          cx="50"
          cy="50"
          r="35"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-white opacity-40"
          style={{ animation: 'pulse 2s infinite' }}
        />
      </svg>

      {/* Central icon - represents workflow optimization */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className="w-2/3 h-2/3"
        >
          {/* Bank building silhouette */}
          <path
            d="M30 70 L30 40 L40 40 L40 30 L60 30 L60 40 L70 40 L70 70 Z"
            fill="currentColor"
            className="text-white"
          />
          {/* AI circuit pattern */}
          <path
            d="M35 50 L45 50 M55 50 L65 50 M50 35 L50 45 M50 55 L50 65"
            stroke="currentColor"
            strokeWidth="2"
            className="text-hsbc-accent"
            style={{ animation: 'dash 1.5s infinite' }}
          />
          {/* Connection dots */}
          <circle cx="35" cy="50" r="2" fill="currentColor" className="text-hsbc-accent" />
          <circle cx="45" cy="50" r="2" fill="currentColor" className="text-hsbc-accent" />
          <circle cx="55" cy="50" r="2" fill="currentColor" className="text-hsbc-accent" />
          <circle cx="65" cy="50" r="2" fill="currentColor" className="text-hsbc-accent" />
          <circle cx="50" cy="35" r="2" fill="currentColor" className="text-hsbc-accent" />
          <circle cx="50" cy="45" r="2" fill="currentColor" className="text-hsbc-accent" />
          <circle cx="50" cy="55" r="2" fill="currentColor" className="text-hsbc-accent" />
          <circle cx="50" cy="65" r="2" fill="currentColor" className="text-hsbc-accent" />
        </svg>
      </div>
    </div>
  );
};

export default Logo; 