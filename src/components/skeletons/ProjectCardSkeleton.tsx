
import React from 'react';
import { Skeleton } from '@/components/ui/enhanced-skeleton';

interface ProjectCardSkeletonProps {
  count?: number;
  variant?: 'grid' | 'list';
}

const ProjectCardSkeleton: React.FC<ProjectCardSkeletonProps> = ({ 
  count = 3, 
  variant = 'grid' 
}) => {
  return (
    <div className={variant === 'grid' 
      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
      : "space-y-4"
    }>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="border border-border rounded-lg overflow-hidden shadow-sm">
          <Skeleton className="w-full h-40" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton variant="text" lines={2} />
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="w-full h-2.5 rounded-full" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="w-full h-10 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectCardSkeleton;
