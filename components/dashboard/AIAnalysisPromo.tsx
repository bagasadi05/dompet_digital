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

interface AIAnalysisPromoProps {
    onTryClick?: () => void;
}

/**
 * AIAnalysisPromo Component - Requirement 7
 * 
 * Features:
 * - Gradient background with decorative elements (7.1)
 * - Compelling title and description about AI features (7.2)
 * - "Coba Sekarang" call-to-action button (7.3)
 * - Animated sparkle icon for attention (7.4)
 * - Visual hierarchy with proper text sizing (7.5)
 */
const AIAnalysisPromo: React.FC<AIAnalysisPromoProps> = ({ onTryClick }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onTryClick) {
            onTryClick();
        } else {
            navigate('/ai-chat');
        }
    };

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-5 text-white shadow-xl shadow-indigo-500/20">
            {/* Decorative elements - Requirement 7.1 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
                <div className="absolute -bottom-12 -left-12 h-28 w-28 rounded-full bg-purple-400/20 blur-2xl"></div>
                <div className="absolute top-1/2 right-1/3 h-16 w-16 rounded-full bg-blue-400/10 blur-xl"></div>
            </div>

            {/* Content */}
            <div className="relative z-10">
                {/* Header with animated sparkle - Requirement 7.4 */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                        <SparklesIcon className="w-5 h-5 text-yellow-300 animate-sparkle" />
                    </div>
                    <span className="text-xs font-bold text-purple-100 uppercase tracking-wider">
                        Fitur Baru
                    </span>
                </div>

                {/* Title and description - Requirement 7.2, 7.5 */}
                <h3 className="text-lg font-bold mb-2">
                    Analisis Keuangan dengan AI
                </h3>
                <p className="text-sm text-purple-100/80 mb-4 leading-relaxed">
                    Dapatkan insight cerdas tentang kebiasaan pengeluaran dan saran untuk mengoptimalkan keuangan Anda.
                </p>

                {/* CTA Button - Requirement 7.3 */}
                <button
                    onClick={handleClick}
                    className="
                        inline-flex items-center gap-2
                        px-4 py-2.5
                        rounded-xl
                        bg-white 
                        text-indigo-600
                        font-semibold text-sm
                        shadow-lg shadow-indigo-500/30
                        hover:shadow-indigo-500/50
                        transition-all duration-200
                        active:scale-95
                        group
                    "
                >
                    <span>Coba Sekarang</span>
                    <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
            </div>
        </div>
    );
};

export default AIAnalysisPromo;
