
import React from 'react';

const CafeIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25h-15v6.75a4.5 4.5 0 004.5 4.5h6a4.5 4.5 0 004.5-4.5V8.25z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6v2.25" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25h.75A1.5 1.5 0 0123.25 12.75v0A1.5 1.5 0 0121.75 14.25H21" />
    </svg>
);
export default CafeIcon;
