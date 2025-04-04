
import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <Link to="/feed" className={`font-bold text-maintso hover:text-maintso-600 ${sizeClasses[size]} ${className}`}>
      Maintso Vola
    </Link>
  );
};

export default Logo;
