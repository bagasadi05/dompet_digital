import React from 'react';
import { SkeletonCard } from '../Skeletons/SkeletonLoader';

/**
 * DashboardSkeleton Component
 * 
 * Complete skeleton layout for dashboard loading state
 * Maintains same layout structure as actual dashboard to prevent layout shift
 * Implements Requirements 11.1, 11.2, 11.4, 11.5 from dashboard-redesign spec
 */
const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-5 pb-24 md:pb-8 animate-fadeIn">
      {/* Welcome Card Skeleton */}
      <SkeletonCard type="welcome" />

      {/* Financial Summary Cards Skeleton */}
      <div className="grid grid-cols-2 gap-4">
        {/* Balance Card - Full Width */}
        <SkeletonCard type="balance" />
        
        {/* Income Card */}
        <SkeletonCard type="income-expense" />
        
        {/* Expense Card */}
        <SkeletonCard type="income-expense" />
      </div>

      {/* Quick Actions Skeleton */}
      <SkeletonCard type="quick-actions" />

      {/* Two Column Layout for Charts and Lists */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Expense Chart Skeleton */}
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800/80 backdrop-blur-sm shadow-sm border border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
              <div className="w-32 h-5 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
            </div>
            <div className="w-12 h-4 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
          </div>
          <div className="h-64 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
        </div>

        {/* Recent Transactions Skeleton */}
        <SkeletonCard type="transaction" />
      </div>

      {/* Second Row: Savings Goals and Upcoming Bills */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Savings Goals Skeleton */}
        <SkeletonCard type="goal" />

        {/* Upcoming Bills Skeleton */}
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800/80 backdrop-blur-sm shadow-sm border border-gray-100 dark:border-gray-700/50">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
              <div className="w-28 h-5 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
            </div>
            <div className="w-12 h-4 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-600 animate-pulse" />
                  <div className="space-y-1">
                    <div className="w-24 h-4 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
                    <div className="w-20 h-3 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
                  </div>
                </div>
                <div className="w-20 h-4 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Analysis Promo Skeleton */}
      <div className="relative bg-gradient-to-r from-slate-900/20 to-slate-800/20 rounded-[1.5rem] p-6 overflow-hidden shadow-lg border border-slate-700/20">
        <div className="flex items-center justify-between">
          <div className="max-w-[70%] space-y-3">
            <div className="w-48 h-6 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
            <div className="w-64 h-4 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
            <div className="w-24 h-8 rounded-lg bg-gray-200 dark:bg-gray-600 animate-pulse" />
          </div>
          <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-600 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;