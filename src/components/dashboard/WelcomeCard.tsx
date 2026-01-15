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
        <div className="relative overflow-hidden rounded-2xl p-6 shadow-xl shadow-blue-500/20 group">

            {/* Background with Noise Texture (Glass Effect) */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 transition-transform duration-500 group-hover:scale-105"></div>

            {/* Noise Overlay */}
            <div className="absolute inset-0 z-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'1\'/%3E%3C/svg%3E')] mix-blend-overlay pointer-events-none"></div>

            {/* Decorative blur elements - Requirement 2.3 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/20 blur-3xl opacity-50 mix-blend-overlay"></div>
                <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-indigo-400/30 blur-3xl opacity-50"></div>
                <div className="absolute top-1/2 right-1/4 h-24 w-24 rounded-full bg-blue-400/20 blur-2xl opacity-40"></div>
            </div>

            {/* Shine Effect on Hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%]"></div>

            {/* Content */}
            <div className="relative z-10">
                {/* Personalized greeting - Requirement 2.1 */}
                <div className="flex items-center gap-2 mb-2">
                    <SparklesIcon className="w-4 h-4 text-yellow-300 animate-sparkle" />
                    <span className="text-xs font-bold text-blue-100/90 uppercase tracking-widest">
                        Selamat Datang
                    </span>
                </div>

                <h2 className="text-2xl font-extrabold mb-1 text-white tracking-tight">
                    Hai, {userName}! 👋
                </h2>

                <p className="text-sm font-medium text-blue-100/80 mb-6 max-w-[80%]">
                    Ada yang bisa dibantu dengan keuanganmu hari ini?
                </p>

                {/* AI Assistant Button - Requirement 2.4, 2.5, 2.6 */}
                <button
                    onClick={handleAIClick}
                    className="
                        inline-flex items-center gap-2 
                        px-5 py-3
                        rounded-xl 
                        bg-white/10 
                        hover:bg-white/20 
                        backdrop-blur-md border border-white/20
                        font-semibold text-sm text-white
                        transition-all duration-300
                        hover:scale-105 hover:shadow-lg hover:shadow-black/10
                        active:scale-95
                        group/btn
                    "
                >
                    <SparklesIcon className="w-5 h-5 text-yellow-300 group-hover/btn:animate-spin" />
                    <span>Tanya AI Sekarang</span>
                    <ArrowRightIcon className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                </button>
            </div>
        </div>
    );
};

export default WelcomeCard;
