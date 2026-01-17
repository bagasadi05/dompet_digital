import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

// Icons for navigation
const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
);

const TransactionsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
);

const PlanningIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
);



const ChartPieIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
    </svg>
);

// Plus Icon for center button (Quick Add Transaction)
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

// Left nav items (before center button)
const leftNavItems = [
    { path: '/', label: 'Dasbor', icon: HomeIcon },
    { path: '/transactions', label: 'Transaksi', icon: TransactionsIcon },
];

// Right nav items (after center button)
const rightNavItems = [
    { path: '/planning', label: 'Rencana', icon: PlanningIcon },
    { path: '/reports', label: 'Laporan', icon: ChartPieIcon },
];

interface BottomNavProps {
    onScanClick?: () => void;
}

/**
 * BottomNavigation Component - Requirement 8
 * 
 * Features:
 * - Fixed at bottom of screen (8.1)
 * - Navigation items: Home, Transactions, Scan (center), Planning, AI (8.2)
 * - Elevated center button with QR scanner icon and primary color (8.3)
 * - Active page highlighting (8.4)
 * - Backdrop blur effect and safe area padding (8.5)
 * - Visual feedback when pressed (8.6)
 */
const BottomNav: React.FC<BottomNavProps> = ({ onScanClick }) => {
    const navigate = useNavigate();

    const handleAddClick = () => {
        if (onScanClick) {
            onScanClick();
        } else {
            // Navigate to AI chat for input
            navigate('/ai-chat');
        }
    };

    return (
        // Floating Dock Navigation Container
        <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center px-4 md:hidden pointer-events-none">

            {/* The Dock Itself (Glassmorphism) */}
            <nav className="pointer-events-auto flex items-center gap-1 p-2 bg-white/80 dark:bg-[#0A0F1A]/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl shadow-black/20 rounded-3xl ring-1 ring-black/5 dark:ring-white/5">

                {/* Left navigation items */}
                {leftNavItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${isActive
                                ? 'bg-gray-100 dark:bg-white/10 text-primary scale-100'
                                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon className={`w-6 h-6 transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`} />
                                {isActive && (
                                    <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary" />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}

                {/* Premium Center Button (Floating slightly higher) */}
                <div className="mx-1 relative -mt-6">
                    <div className="absolute inset-x-2 top-2 bottom-0 bg-primary/40 blur-lg rounded-full" />
                    <button
                        onClick={handleAddClick}
                        className="
                            relative flex items-center justify-center
                            w-16 h-16
                            rounded-full
                            bg-gradient-to-tr from-primary via-emerald-500 to-teal-400
                            text-white
                            shadow-xl shadow-primary/30
                            hover:shadow-2xl hover:shadow-primary/50
                            hover:scale-105 hover:-translate-y-1
                            active:scale-95 active:translate-y-0
                            transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)
                            border-[4px] border-white dark:border-[#0A0F1A]
                            group
                        "
                        aria-label="Tambah Transaksi AI"
                    >
                        <PlusIcon className="w-8 h-8 drop-shadow-sm group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                {/* Right navigation items */}
                {rightNavItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${isActive
                                ? 'bg-gray-100 dark:bg-white/10 text-primary scale-100'
                                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon className={`w-6 h-6 transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`} />
                                {isActive && (
                                    <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary" />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
};

export default BottomNav;

