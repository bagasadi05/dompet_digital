import React from 'react';

interface SkeletonProps {
  variant: 'card' | 'text' | 'circle' | 'rectangle';
  width?: string;
  height?: string;
  className?: string;
}

/**
 * SkeletonLoader Component
 * 
 * Provides shimmer animation loading states for different content types
 * Implements Requirements 11.1, 11.2, 11.3 from dashboard-redesign spec
 */
const SkeletonLoader: React.FC<SkeletonProps> = ({ 
  variant, 
  width, 
  height, 
  className = '' 
}) => {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-shimmer';
  
  const variantClasses = {
    card: 'rounded-2xl',
    text: 'rounded-md',
    circle: 'rounded-full',
    rectangle: 'rounded-lg'
  };

  const defaultSizes = {
    card: { width: 'w-full', height: 'h-32' },
    text: { width: 'w-full', height: 'h-4' },
    circle: { width: 'w-12', height: 'h-12' },
    rectangle: { width: 'w-full', height: 'h-20' }
  };

  const widthClass = width || defaultSizes[variant].width;
  const heightClass = height || defaultSizes[variant].height;

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${heightClass} ${className}`}
      style={{
        backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite'
      }}
    />
  );
};

interface SkeletonCardProps {
  type: 'balance' | 'income-expense' | 'transaction' | 'goal' | 'welcome' | 'quick-actions';
}

/**
 * SkeletonCard Component
 * 
 * Pre-configured skeleton layouts for different dashboard card types
 * Maintains same dimensions as actual content to prevent layout shift
 */
export const SkeletonCard: React.FC<SkeletonCardProps> = ({ type }) => {
  const cardBaseClasses = 'p-5 rounded-2xl bg-white dark:bg-gray-800/80 backdrop-blur-sm shadow-sm border border-gray-100 dark:border-gray-700/50';

  switch (type) {
    case 'welcome':
      return (
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600/20 to-indigo-700/20 p-7 shadow-lg border border-blue-500/20">
          <div className="space-y-4">
            <div className="space-y-2">
              <SkeletonLoader variant="text" width="w-32" height="h-4" />
              <SkeletonLoader variant="text" width="w-48" height="h-8" />
              <SkeletonLoader variant="text" width="w-64" height="h-4" />
            </div>
            <SkeletonLoader variant="rectangle" width="w-full" height="h-12" />
          </div>
        </div>
      );

    case 'balance':
      return (
        <div className={`${cardBaseClasses} col-span-2`}>
          <div className="flex items-start justify-between mb-3">
            <SkeletonLoader variant="circle" width="w-11" height="h-11" />
            <SkeletonLoader variant="circle" width="w-6" height="h-6" />
          </div>
          <div className="space-y-2">
            <SkeletonLoader variant="text" width="w-24" height="h-4" />
            <SkeletonLoader variant="text" width="w-40" height="h-8" />
          </div>
        </div>
      );

    case 'income-expense':
      return (
        <div className={cardBaseClasses}>
          <div className="flex justify-between items-start mb-4">
            <SkeletonLoader variant="circle" width="w-10" height="h-10" />
            <SkeletonLoader variant="rectangle" width="w-12" height="h-5" />
          </div>
          <div className="space-y-2">
            <SkeletonLoader variant="text" width="w-20" height="h-3" />
            <SkeletonLoader variant="text" width="w-28" height="h-6" />
          </div>
        </div>
      );

    case 'quick-actions':
      return (
        <div className={cardBaseClasses}>
          <div className="mb-4">
            <SkeletonLoader variant="text" width="w-24" height="h-6" />
          </div>
          <div className="grid grid-cols-4 gap-y-6 gap-x-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <SkeletonLoader variant="circle" width="w-14" height="h-14" />
                <SkeletonLoader variant="text" width="w-12" height="h-3" />
              </div>
            ))}
          </div>
        </div>
      );

    case 'transaction':
      return (
        <div className={cardBaseClasses}>
          <div className="flex items-center justify-between mb-4">
            <SkeletonLoader variant="text" width="w-32" height="h-6" />
            <SkeletonLoader variant="text" width="w-20" height="h-4" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-4">
                  <SkeletonLoader variant="circle" width="w-12" height="h-12" />
                  <div className="space-y-1">
                    <SkeletonLoader variant="text" width="w-24" height="h-4" />
                    <SkeletonLoader variant="text" width="w-20" height="h-3" />
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <SkeletonLoader variant="text" width="w-20" height="h-4" />
                  <SkeletonLoader variant="text" width="w-12" height="h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'goal':
      return (
        <div className={cardBaseClasses}>
          <div className="flex items-center justify-between mb-4">
            <SkeletonLoader variant="text" width="w-28" height="h-6" />
            <SkeletonLoader variant="text" width="w-16" height="h-4" />
          </div>
          <div className="flex items-center gap-4 mb-5">
            <SkeletonLoader variant="circle" width="w-12" height="h-12" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-center">
                <SkeletonLoader variant="text" width="w-20" height="h-4" />
                <SkeletonLoader variant="rectangle" width="w-8" height="h-5" />
              </div>
              <SkeletonLoader variant="text" width="w-24" height="h-3" />
            </div>
          </div>
          <SkeletonLoader variant="rectangle" width="w-full" height="h-2" className="mb-4" />
          <div className="flex justify-between items-center">
            <SkeletonLoader variant="text" width="w-16" height="h-3" />
            <SkeletonLoader variant="text" width="w-32" height="h-3" />
          </div>
        </div>
      );

    default:
      return (
        <div className={cardBaseClasses}>
          <SkeletonLoader variant="card" />
        </div>
      );
  }
};

export default SkeletonLoader;