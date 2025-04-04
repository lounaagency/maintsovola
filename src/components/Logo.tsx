
import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '', showText = true }) => {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10'
  };

  return (
    <Link to="/feed" className={`flex items-center font-bold text-maintso hover:text-maintso-600 ${className}`}>
      <img 
        src="/maintso_vola_logo.png" 
        alt="Maintso Vola" 
        className={`${sizeClasses[size]}`}
      />
      {showText && (
        <span className={`ml-2 ${size === 'sm' ? 'text-xl' : size === 'md' ? 'text-2xl' : 'text-3xl'}`}>
          Maintso Vola
        </span>
      )}
    </Link>
  );
};

export default Logo;
