
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
    <Link to="/feed" className={`font-bold flex items-center hover:opacity-90 ${className}`}>
      <img 
        src="/maintsovola_logo_pm.png" 
        alt="Maintso Vola" 
        className={`${sizeClasses[size]}`} 
      />
      {showText && (
        <span className={`ml-2 text-maintso ${size === 'sm' ? 'text-xl' : size === 'md' ? 'text-2xl' : 'text-3xl'}`}>
          Maintso Vola
        </span>
      )}
    </Link>
  );
};

export default Logo;
