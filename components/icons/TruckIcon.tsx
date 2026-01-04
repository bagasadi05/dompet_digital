
import React from 'react';

const TruckIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path d="M17.25 10.5V6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v10.5a2.25 2.25 0 002.25 2.25h1.5" />
      <path d="M16.5 17.25a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      <path d="M8.25 17.25a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 8.25h3m-3 0v-1.5A2.25 2.25 0 014.5 4.5h10.5a2.25 2.25 0 012.25 2.25v3.75" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 8.25h6.75l2.25 4.5" />
    </svg>
);
export default TruckIcon;
