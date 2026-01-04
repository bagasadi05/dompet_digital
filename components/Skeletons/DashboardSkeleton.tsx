import React from 'react';
import Card from '../common/Card';
import Skeleton from '../common/Skeleton';

const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Greeting Card Skeleton */}
      <Card className="bg-gradient-to-br from-primary-dark to-primary-light dark:from-dark-card dark:to-gray-800 text-white shadow-lg">
        <div className="p-2">
          <Skeleton className="h-8 w-3/4 mb-2 bg-white/30" />
          <Skeleton className="h-4 w-1/2 bg-white/30" />
          <div className="mt-4 p-3 bg-white/10 rounded-lg">
            <Skeleton className="h-10 w-full bg-white/20" />
          </div>
        </div>
      </Card>

      {/* Filter Buttons Skeleton */}
      <div className="flex justify-center bg-light-card dark:bg-dark-card p-1 rounded-lg shadow-sm space-x-2">
        <Skeleton className="h-8 flex-1 rounded-md" />
        <Skeleton className="h-8 flex-1 rounded-md" />
        <Skeleton className="h-8 flex-1 rounded-md" />
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center mb-2">
              <Skeleton className="w-10 h-10 rounded-lg mr-3" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-8 w-3/4" />
          </Card>
        ))}
      </div>

      {/* List Card Skeleton */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div>
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </Card>

      {/* Another List Card Skeleton */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-4">
           <Skeleton className="h-20 w-full" />
        </div>
      </Card>
    </div>
  );
};

export default DashboardSkeleton;