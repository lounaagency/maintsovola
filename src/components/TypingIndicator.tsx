import React from 'react';

interface TypingIndicatorProps {
  userName?: string;
  className?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  userName, 
  className = "" 
}) => {
  return (
    <div className={`flex items-center gap-2 text-sm text-muted-foreground p-2 ${className}`}>
      <div className="typing-indicator">
        <div className="typing-dot"></div>
        <div className="typing-dot"></div>
        <div className="typing-dot"></div>
      </div>
      <span>
        {userName ? `${userName} écrit...` : 'En train d\'écrire...'}
      </span>
    </div>
  );
};

export default TypingIndicator;