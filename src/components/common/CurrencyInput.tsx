import React, { useState, useEffect } from 'react';

interface CurrencyInputProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    required?: boolean;
    placeholder?: string;
    autoFocus?: boolean;
    className?: string;
    error?: string | null;
    max?: number;
}

// Format number with thousand separators (using dots for Indonesian locale)
const formatWithSeparator = (value: number): string => {
    if (value === 0) return '';
    return new Intl.NumberFormat('id-ID').format(value);
};

const CurrencyInput: React.FC<CurrencyInputProps> = ({
    label,
    value,
    onChange,
    required = false,
    placeholder = '0',
    autoFocus = false,
    className = '',
    error,
    max,
}) => {
    const [displayValue, setDisplayValue] = useState(formatWithSeparator(value));
    const hasError = !!error;

    // Sync display value when external value changes
    useEffect(() => {
        setDisplayValue(formatWithSeparator(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;

        // Only allow digits and dots
        const cleanedInput = inputValue.replace(/[^\d]/g, '');

        if (cleanedInput === '') {
            setDisplayValue('');
            onChange(0);
            return;
        }

        let numericValue = parseInt(cleanedInput, 10);

        if (max !== undefined && numericValue > max) {
            numericValue = max;
        }

        const formatted = formatWithSeparator(numericValue);

        setDisplayValue(formatted);
        onChange(numericValue);
    };

    const handleBlur = () => {
        // Re-format on blur to ensure consistent display
        setDisplayValue(formatWithSeparator(value));
    };

    return (
        <div className={className}>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className={`flex items-center bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border transition-all ${hasError
                ? 'border-red-500 focus-within:ring-2 focus-within:ring-red-500/30'
                : 'border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary'
                }`}>
                <span className="text-xl font-bold text-gray-400 mr-2">Rp</span>
                <input
                    type="text"
                    inputMode="numeric"
                    value={displayValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required={required}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    className="text-2xl font-bold text-gray-900 dark:text-white w-full bg-transparent border-none p-0 focus:ring-0 focus:outline-none"
                />
            </div>
            {hasError && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
};

export default CurrencyInput;
