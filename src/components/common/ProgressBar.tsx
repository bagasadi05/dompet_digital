
import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, max }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  let colorClass = 'bg-success';
  if (percentage > 90) {
    colorClass = 'bg-danger';
  } else if (percentage >= 70) {
    colorClass = 'bg-warning';
  }

  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
      <div
        className={`h-2.5 rounded-full transition-all duration-500 ${colorClass}`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;
