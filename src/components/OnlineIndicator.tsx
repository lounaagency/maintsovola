import React from 'react';

interface OnlineIndicatorProps {
  isOnline: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const OnlineIndicator: React.FC<OnlineIndicatorProps> = ({ 
  isOnline, 
  size = 'sm',
  className = "" 
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-5 h-5'
  };

  if (!isOnline) return null;

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full online-indicator border-2 border-white ${className}`}
      title="En ligne"
    />
  );
};

export default OnlineIndicator;