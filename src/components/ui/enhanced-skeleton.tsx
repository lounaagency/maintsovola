
import React from 'react';
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'card' | 'text' | 'avatar' | 'table' | 'list';
  lines?: number;
  width?: string;
  height?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  variant = 'default',
  lines = 1,
  width,
  height,
  ...props 
}) => {
  const baseClasses = "animate-pulse rounded-md bg-muted";
  
  if (variant === 'card') {
    return (
      <div className={cn("space-y-3", className)} {...props}>
        <div className={cn(baseClasses, "h-48 w-full")} />
        <div className="space-y-2">
          <div className={cn(baseClasses, "h-4 w-3/4")} />
          <div className={cn(baseClasses, "h-4 w-1/2")} />
        </div>
      </div>
    );
  }
  
  if (variant === 'text') {
    return (
      <div className={cn("space-y-2", className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i}
            className={cn(
              baseClasses, 
              "h-4",
              i === lines - 1 ? "w-3/4" : "w-full"
            )} 
          />
        ))}
      </div>
    );
  }
  
  if (variant === 'avatar') {
    return (
      <div className={cn(baseClasses, "h-12 w-12 rounded-full", className)} {...props} />
    );
  }
  
  if (variant === 'table') {
    return (
      <div className={cn("space-y-2", className)} {...props}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex space-x-4">
            <div className={cn(baseClasses, "h-4 w-1/4")} />
            <div className={cn(baseClasses, "h-4 w-1/3")} />
            <div className={cn(baseClasses, "h-4 w-1/4")} />
            <div className={cn(baseClasses, "h-4 w-1/6")} />
          </div>
        ))}
      </div>
    );
  }
  
  if (variant === 'list') {
    return (
      <div className={cn("space-y-3", className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <div className={cn(baseClasses, "h-8 w-8 rounded-full")} />
            <div className="space-y-1 flex-1">
              <div className={cn(baseClasses, "h-4 w-3/4")} />
              <div className={cn(baseClasses, "h-3 w-1/2")} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div
      className={cn(baseClasses, className)}
      style={{ 
        width: width || 'auto', 
        height: height || '1rem'
      }}
      {...props}
    />
  );
};

export { Skeleton };
