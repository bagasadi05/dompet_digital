import React from 'react';
import { SkeletonCard } from './SkeletonLoader';

const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Welcome Card Skeleton */}
      <SkeletonCard type="welcome" />

      {/* Financial Score Skeleton - Matching the new widget */}
      <div className="p-6 rounded-3xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm shadow-sm flex items-center justify-between">
         <div className="space-y-2">
             <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
             <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
         </div>
         <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SkeletonCard type="balance" />
        <SkeletonCard type="income-expense" />
        {/* Hidden on mobile usually, but shown on larger screens */}
        <div className="hidden lg:block">
             <SkeletonCard type="income-expense" />
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <SkeletonCard type="quick-actions" />

      {/* Two Column Layout Skeleton */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Chart Skeleton */}
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800/80 backdrop-blur-sm shadow-sm border border-gray-100 dark:border-gray-700/50 h-[300px] flex flex-col">
            <div className="flex justify-between mb-4">
                <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
                <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
            </div>
            <div className="flex-1 flex items-center justify-center">
                <div className="w-40 h-40 rounded-full border-8 border-gray-200 dark:border-gray-700 animate-pulse"></div>
            </div>
        </div>

        {/* Recent Transactions Skeleton */}
        <SkeletonCard type="transaction" />
      </div>

      {/* Second Row Skeleton */}
      <div className="grid md:grid-cols-2 gap-5">
        <SkeletonCard type="goal" />
        {/* Upcoming Bills Skeleton */}
        <SkeletonCard type="transaction" />
      </div>
    </div>
  );
};

export default DashboardSkeleton;
