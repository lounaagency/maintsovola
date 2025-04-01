
import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  withText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', withText = true }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  return (
    <Link to="/" className="flex items-center">
      <div className={`relative ${sizeClasses[size]} rounded-full bg-green-600 text-white flex items-center justify-center overflow-hidden`}>
        <span className="font-bold text-xl">MV</span>
      </div>
      {withText && (
        <span className="ml-2 font-bold text-green-600 text-lg">Maintso Vola</span>
      )}
    </Link>
  );
};

export default Logo;
