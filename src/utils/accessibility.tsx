/**
 * Accessibility utilities and components
 */
import React from 'react';

// Screen reader only text
export const VisuallyHidden: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="sr-only">{children}</span>
);

// Skip link for keyboard navigation
export const SkipLink: React.FC<{ href?: string; children?: React.ReactNode }> = ({
    href = '#main-content',
    children = 'Langsung ke konten utama'
}) => (
    <a
        href={href}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:shadow-lg"
    >
        {children}
    </a>
);

// Focus trap for modals (simple implementation)
export const useFocusTrap = (isActive: boolean, containerRef: React.RefObject<HTMLElement | null>) => {
    React.useEffect(() => {
        if (!isActive || !containerRef.current) return;

        const container = containerRef.current;
        const focusableElements = container.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        // Focus the first element when trap becomes active
        firstElement?.focus();

        container.addEventListener('keydown', handleKeyDown);
        return () => container.removeEventListener('keydown', handleKeyDown);
    }, [isActive, containerRef]);
};

// Announce to screen readers
export const useAnnounce = () => {
    const announce = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
        const el = document.createElement('div');
        el.setAttribute('aria-live', priority);
        el.setAttribute('aria-atomic', 'true');
        el.className = 'sr-only';
        document.body.appendChild(el);

        // Small delay for screen readers to pick it up
        setTimeout(() => {
            el.textContent = message;
        }, 100);

        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(el);
        }, 1000);
    }, []);

    return announce;
};

// Loading state with aria
interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    label?: string;
    className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    label = 'Memuat...',
    className = ''
}) => {
    const sizeClasses = {
        sm: 'h-4 w-4 border-2',
        md: 'h-8 w-8 border-3',
        lg: 'h-12 w-12 border-4',
    };

    return (
        <div className={`flex items-center justify-center gap-2 ${className}`} role="status" aria-label={label}>
            <div className={`animate-spin rounded-full border-primary border-t-transparent ${sizeClasses[size]}`} />
            <VisuallyHidden>{label}</VisuallyHidden>
        </div>
    );
};

// Button with loading state and proper aria
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    loadingText?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
    isLoading,
    loadingText = 'Memproses...',
    children,
    disabled,
    ...props
}) => (
    <button
        {...props}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        aria-disabled={disabled || isLoading}
    >
        {isLoading ? loadingText : children}
    </button>
);

export default { VisuallyHidden, SkipLink, useFocusTrap, useAnnounce, LoadingSpinner };
