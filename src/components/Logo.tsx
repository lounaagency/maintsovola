
import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '', showText = true }) => {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
    xl: 'h-16' // Nouvelle taille ajoutée
  };

  return (
    <Link to="/feed" className={`font-bold flex items-center justify-center hover:opacity-90 ${className}`}>
      <img 
        src="/maintsovola_logo_pm.png" 
        alt="Maintso Vola" 
        className={`${sizeClasses[size]} object-contain mx-auto`} 
      />
      {showText && (
        <span className={`ml-2 text-maintso ${size === 'sm' ? 'text-xl' : size === 'md' ? 'text-2xl' : size === 'lg' ? 'text-3xl' : 'text-4xl'}`}>
          Maintso Vola
        </span>
      )}
    </Link>
  );
};

export default Logo;
