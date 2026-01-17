/**
 * Centralized utility functions for the Dompet Digital app
 */

// Currency formatting
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export const formatCurrencyCompact = (amount: number): string => {
    if (amount >= 1_000_000_000) {
        return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`;
    }
    if (amount >= 1_000_000) {
        return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
    }
    if (amount >= 1_000) {
        return `Rp ${(amount / 1_000).toFixed(1)}rb`;
    }
    return formatCurrency(amount);
};

// Date formatting
export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

export const formatDateShort = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

export const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    }) + ' WIB';
};

export const formatDateTime = (dateString: string): string => {
    return `${formatDateShort(dateString)} • ${formatTime(dateString)}`;
};

export const formatRelativeDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < -1) return `${Math.abs(diffDays)} hari lalu`;
    if (diffDays === -1) return 'Kemarin';
    if (diffDays === 0) return 'Hari ini';
    if (diffDays === 1) return 'Besok';
    if (diffDays <= 7) return `${diffDays} hari lagi`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} minggu lagi`;
    return formatDateShort(dateString);
};

// Category helpers
export const getCategoryEmoji = (category: string): string => {
    const emojiMap: Record<string, string> = {
        'Makanan & Minuman': '🍔',
        'Belanja': '🛍️',
        'Transportasi': '🚗',
        'Hiburan': '🎬',
        'Tagihan & Utilitas': '⚡',
        'Kesehatan': '💊',
        'Pendidikan': '📚',
        'Gaji': '💼',
        'Tabungan & Investasi': '🐷',
        'Lainnya': '📦',
    };
    return emojiMap[category] || '📦';
};

export const getCategoryColor = (category: string): string => {
    const colorMap: Record<string, string> = {
        'Makanan & Minuman': 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
        'Belanja': 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
        'Transportasi': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        'Hiburan': 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
        'Tagihan & Utilitas': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
        'Kesehatan': 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
        'Gaji': 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
        'Tabungan & Investasi': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
        'Lainnya': 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    };
    return colorMap[category] || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
};

export const getCategoryGradient = (category: string): string => {
    const gradientMap: Record<string, string> = {
        'Makanan & Minuman': 'from-orange-400 to-orange-600',
        'Belanja': 'from-pink-400 to-pink-600',
        'Transportasi': 'from-blue-400 to-blue-600',
        'Hiburan': 'from-purple-400 to-purple-600',
        'Tagihan & Utilitas': 'from-yellow-400 to-yellow-600',
        'Kesehatan': 'from-red-400 to-red-600',
        'Gaji': 'from-green-400 to-green-600',
        'Tabungan & Investasi': 'from-emerald-400 to-emerald-600',
        'Lainnya': 'from-gray-400 to-gray-600',
    };
    return gradientMap[category] || 'from-gray-400 to-gray-600';
};

// Validation helpers
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const isValidAmount = (amount: number): boolean => {
    return !isNaN(amount) && amount > 0 && isFinite(amount);
};

export const sanitizeString = (str: string): string => {
    return str.trim().replace(/[<>]/g, '');
};

// Number helpers
export const clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
};

export const percentage = (value: number, total: number): number => {
    if (total === 0) return 0;
    return clamp((value / total) * 100, 0, 100);
};

// ID generation
export const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

// Storage helpers
export const safeLocalStorage = {
    get: <T>(key: string, defaultValue: T): T => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch {
            return defaultValue;
        }
    },
    set: <T>(key: string, value: T): void => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
    },
    remove: (key: string): void => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Failed to remove from localStorage:', e);
        }
    },
};
