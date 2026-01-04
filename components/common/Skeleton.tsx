import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height
}) => {
  const baseClasses = 'relative overflow-hidden bg-gray-200 dark:bg-gray-700';

  const variantClasses = {
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded h-4',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    >
      {/* Shimmer effect overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
};

// Preset skeleton components for common use cases
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        className={i === lines - 1 ? 'w-2/3' : 'w-full'}
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 ${className}`}>
    <div className="flex items-center gap-3 mb-4">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1">
        <Skeleton variant="text" className="w-1/2 mb-2" />
        <Skeleton variant="text" className="w-1/3" />
      </div>
    </div>
    <Skeleton variant="rectangular" height={80} className="mb-3" />
    <div className="flex gap-2">
      <Skeleton variant="rectangular" height={36} className="flex-1" />
      <Skeleton variant="rectangular" height={36} className="flex-1" />
    </div>
  </div>
);

export const SkeletonListItem: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center gap-4 p-4 ${className}`}>
    <Skeleton variant="circular" width={40} height={40} />
    <div className="flex-1">
      <Skeleton variant="text" className="w-3/4 mb-2" />
      <Skeleton variant="text" className="w-1/2" />
    </div>
    <Skeleton variant="rectangular" width={80} height={24} />
  </div>
);

export const SkeletonStats: React.FC<{ count?: number; className?: string }> = ({ count = 3, className = '' }) => (
  <div className={`grid grid-cols-${count} gap-4 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
        <Skeleton variant="text" className="w-1/2 mb-3" />
        <Skeleton variant="rectangular" height={32} className="w-3/4" />
      </div>
    ))}
  </div>
);

export default Skeleton;