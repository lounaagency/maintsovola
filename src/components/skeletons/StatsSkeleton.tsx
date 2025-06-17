
import React from 'react';
import { Skeleton } from '@/components/ui/enhanced-skeleton';

const StatsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center space-x-4">
          <div className="bg-white/20 p-3 rounded-full">
            <Skeleton className="h-6 w-6 bg-white/30" />
          </div>
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4 bg-white/30" />
            <Skeleton className="h-8 w-1/2 bg-white/30" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsSkeleton;
