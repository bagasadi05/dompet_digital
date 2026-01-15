import React from 'react';

const TrophyIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9 9 0 1 1 9 0Zm-9 0a9 9 0 0 0 9 0h-9Zm9 0-1.09-2.18a3.375 3.375 0 0 0-3.26-2.17h-1.3a3.375 3.375 0 0 0-3.26 2.17L7.5 18.75m9 0h-9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75a3.375 3.375 0 0 1-3.375-3.375V11.25a3.375 3.375 0 0 1 6.75 0v1.125A3.375 3.375 0 0 1 12 15.75Z" />
  </svg>
);

export default TrophyIcon;
