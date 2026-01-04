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

const AiIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
);

// Voice/Microphone Icon for center button
const VoiceIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
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
    { path: '/ai-chat', label: 'AI', icon: AiIcon },
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

    const handleVoiceClick = () => {
        if (onScanClick) {
            onScanClick();
        } else {
            // Navigate to AI chat for voice input
            navigate('/ai-chat');
        }
    };

    return (
        // Fixed positioning with backdrop blur - Requirement 8.1, 8.5
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#0B1120]/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 md:hidden">
            {/* Safe area padding - Requirement 8.5 */}
            <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                <div className="flex justify-around items-center h-16 px-1 relative">
                    {/* Left navigation items */}
                    {leftNavItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-2 rounded-xl transition-all active:scale-95 ${isActive
                                    ? 'text-primary'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon className={`w-6 h-6 ${isActive ? 'text-primary' : ''}`} />
                                    <span className={`text-[10px] font-medium ${isActive ? 'font-bold text-primary' : ''}`}>
                                        {item.label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    ))}

                    {/* Center elevated button - Requirement 8.3 */}
                    <div className="relative flex items-center justify-center w-16">
                        <button
                            onClick={handleVoiceClick}
                            className="
                                absolute -top-6
                                flex items-center justify-center
                                w-14 h-14
                                rounded-2xl
                                bg-gradient-to-br from-primary to-emerald-400
                                text-white
                                shadow-lg shadow-primary/40
                                hover:shadow-primary/60
                                transition-all duration-200
                                active:scale-95
                            "
                            aria-label="Voice Assistant"
                        >
                            <VoiceIcon className="w-7 h-7" />
                        </button>
                        {/* Placeholder untuk spacing */}
                        <span className="text-[10px] text-transparent">Scan</span>
                    </div>

                    {/* Right navigation items */}
                    {rightNavItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-2 rounded-xl transition-all active:scale-95 ${isActive
                                    ? 'text-primary'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon className={`w-6 h-6 ${isActive ? 'text-primary' : ''}`} />
                                    <span className={`text-[10px] font-medium ${isActive ? 'font-bold text-primary' : ''}`}>
                                        {item.label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            </div>
        </nav>
    );
};

export default BottomNav;

