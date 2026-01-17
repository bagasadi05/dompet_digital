import React, { createContext, useContext, useState, useCallback } from 'react';

// Toast Types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    showToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// Toast Icons
const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

const ExclamationTriangleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
);

const InformationCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
);

const XMarkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

const getToastStyles = (type: ToastType) => {
    switch (type) {
        case 'success':
            return {
                bg: 'bg-green-50 dark:bg-green-900/30',
                border: 'border-green-200 dark:border-green-800',
                icon: <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />,
                title: 'text-green-800 dark:text-green-200',
                message: 'text-green-700 dark:text-green-300',
            };
        case 'error':
            return {
                bg: 'bg-red-50 dark:bg-red-900/30',
                border: 'border-red-200 dark:border-red-800',
                icon: <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />,
                title: 'text-red-800 dark:text-red-200',
                message: 'text-red-700 dark:text-red-300',
            };
        case 'warning':
            return {
                bg: 'bg-yellow-50 dark:bg-yellow-900/30',
                border: 'border-yellow-200 dark:border-yellow-800',
                icon: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />,
                title: 'text-yellow-800 dark:text-yellow-200',
                message: 'text-yellow-700 dark:text-yellow-300',
            };
        case 'info':
        default:
            return {
                bg: 'bg-blue-50 dark:bg-blue-900/30',
                border: 'border-blue-200 dark:border-blue-800',
                icon: <InformationCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
                title: 'text-blue-800 dark:text-blue-200',
                message: 'text-blue-700 dark:text-blue-300',
            };
    }
};

// Single Toast Component
const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
    const styles = getToastStyles(toast.type);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(toast.id);
        }, toast.duration || 4000);

        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, onRemove]);

    return (
        <div
            className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-slideDown ${styles.bg} ${styles.border}`}
            role="alert"
        >
            <div className="flex-shrink-0 mt-0.5">
                {styles.icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${styles.title}`}>{toast.title}</p>
                {toast.message && (
                    <p className={`text-sm mt-0.5 ${styles.message}`}>{toast.message}</p>
                )}
            </div>
            <button
                onClick={() => onRemove(toast.id)}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
                <XMarkIcon className="w-4 h-4 text-gray-500" />
            </button>
        </div>
    );
};

// Toast Container
const ToastContainer: React.FC<{ toasts: Toast[]; onRemove: (id: string) => void }> = ({ toasts, onRemove }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            {toasts.map(toast => (
                <div key={toast.id} className="pointer-events-auto">
                    <ToastItem toast={toast} onRemove={onRemove} />
                </div>
            ))}
        </div>
    );
};

// Toast Provider
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        setToasts(prev => [...prev, { ...toast, id }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
};

// Helper hooks for common toast patterns
export const useSuccessToast = () => {
    const { showToast } = useToast();
    return (title: string, message?: string) => showToast({ type: 'success', title, message });
};

export const useErrorToast = () => {
    const { showToast } = useToast();
    return (title: string, message?: string) => showToast({ type: 'error', title, message });
};

export default ToastContext;
