import React from 'react';
import { useNavigate } from 'react-router-dom';

// Sparkles Icon
const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
);

// Arrow Right Icon
const ArrowRightIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
);

interface WelcomeCardProps {
    userName: string;
    onAIAssistantClick?: () => void;
}

/**
 * WelcomeCard Component - Requirement 2
 * 
 * Features:
 * - Personalized greeting with user's name (2.1)
 * - Gradient background from blue to indigo (2.2)
 * - Decorative blur elements for visual appeal (2.3)
 * - AI assistant button with sparkle icon (2.4, 2.5)
 * - Scale animation on button press (2.6)
 */
const WelcomeCard: React.FC<WelcomeCardProps> = ({ userName, onAIAssistantClick }) => {
    const navigate = useNavigate();

    const handleAIClick = () => {
        if (onAIAssistantClick) {
            onAIAssistantClick();
        } else {
            navigate('/ai-chat');
        }
    };

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 p-5 text-white shadow-xl shadow-blue-500/20">
            {/* Decorative blur elements - Requirement 2.3 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-indigo-400/20 blur-3xl"></div>
                <div className="absolute top-1/2 right-1/4 h-24 w-24 rounded-full bg-blue-400/10 blur-2xl"></div>
            </div>

            {/* Content */}
            <div className="relative z-10">
                {/* Personalized greeting - Requirement 2.1 */}
                <div className="flex items-center gap-2 mb-1">
                    <SparklesIcon className="w-4 h-4 text-yellow-300 animate-sparkle" />
                    <span className="text-xs font-medium text-blue-100/80 uppercase tracking-wide">
                        Selamat Datang
                    </span>
                </div>

                <h2 className="text-xl font-bold mb-4">
                    Hai, {userName}! 👋
                </h2>

                <p className="text-sm text-blue-100/70 mb-4">
                    Ada yang bisa dibantu dengan keuanganmu hari ini?
                </p>

                {/* AI Assistant Button - Requirement 2.4, 2.5, 2.6 */}
                <button
                    onClick={handleAIClick}
                    className="
                        inline-flex items-center gap-2 
                        px-4 py-2.5 
                        rounded-xl 
                        bg-white/20 
                        hover:bg-white/30 
                        backdrop-blur-sm 
                        font-medium text-sm
                        transition-all duration-200
                        active:scale-95
                        group
                    "
                >
                    <SparklesIcon className="w-4 h-4 text-yellow-300 group-hover:animate-sparkle" />
                    <span>Tanya AI Sekarang</span>
                    <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
            </div>
        </div>
    );
};

export default WelcomeCard;
