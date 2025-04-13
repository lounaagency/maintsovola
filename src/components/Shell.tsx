
import React from 'react';

interface ShellProps {
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {children}
    </div>
  );
};
