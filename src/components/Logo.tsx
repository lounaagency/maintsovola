import React from 'react';
import { Link } from 'react-router-dom';
interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}
const Logo: React.FC<LogoProps> = ({
  size = 'md',
  className = '',
  showText = true
}) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16'
  };
  return <Link to="/feed" className={`font-bold flex items-center justify-center hover:opacity-90 ${className}`}>
      <img src="/maintsovola_logo_pm.png" alt="Maintso Vola" className="" />
      {showText && <span className={`ml-2 text-maintso ${size === 'sm' ? 'text-xl' : size === 'md' ? 'text-2xl' : 'text-3xl'}`}>
          Maintso Vola
        </span>}
    </Link>;
};
export default Logo;