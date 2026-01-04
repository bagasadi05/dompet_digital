import React, { useState, useCallback } from 'react';

// Validation rules
export interface ValidationRule<T = string> {
    validate: (value: T) => boolean;
    message: string;
}

// Common validation rules
export const required = (message = 'Wajib diisi'): ValidationRule<string> => ({
    validate: (value) => value.trim().length > 0,
    message,
});

export const minLength = (min: number, message?: string): ValidationRule<string> => ({
    validate: (value) => value.length >= min,
    message: message || `Minimal ${min} karakter`,
});

export const maxLength = (max: number, message?: string): ValidationRule<string> => ({
    validate: (value) => value.length <= max,
    message: message || `Maksimal ${max} karakter`,
});

export const email = (message = 'Email tidak valid'): ValidationRule<string> => ({
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
});

export const minValue = (min: number, message?: string): ValidationRule<number> => ({
    validate: (value) => value >= min,
    message: message || `Minimal ${min}`,
});

export const positiveNumber = (message = 'Harus lebih dari 0'): ValidationRule<number> => ({
    validate: (value) => value > 0,
    message,
});

// Form field state
export interface FieldState<T> {
    value: T;
    error: string | null;
    touched: boolean;
}

// Hook for form validation
export const useFormField = <T,>(initialValue: T, rules: ValidationRule<T>[] = []) => {
    const [state, setState] = useState<FieldState<T>>({
        value: initialValue,
        error: null,
        touched: false,
    });

    const validate = useCallback((value: T): string | null => {
        for (const rule of rules) {
            if (!rule.validate(value)) {
                return rule.message;
            }
        }
        return null;
    }, [rules]);

    const setValue = useCallback((value: T) => {
        setState(prev => ({
            ...prev,
            value,
            error: prev.touched ? validate(value) : null,
        }));
    }, [validate]);

    const setTouched = useCallback(() => {
        setState(prev => ({
            ...prev,
            touched: true,
            error: validate(prev.value),
        }));
    }, [validate]);

    const reset = useCallback(() => {
        setState({
            value: initialValue,
            error: null,
            touched: false,
        });
    }, [initialValue]);

    const isValid = validate(state.value) === null;

    return {
        ...state,
        setValue,
        setTouched,
        reset,
        isValid,
        validate: () => {
            const error = validate(state.value);
            setState(prev => ({ ...prev, touched: true, error }));
            return error === null;
        },
    };
};

// Input component with validation
interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    error?: string | null;
    onBlur?: () => void;
    helperText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const FormInput: React.FC<FormInputProps> = ({
    label,
    value,
    onChange,
    error,
    onBlur,
    helperText,
    leftIcon,
    rightIcon,
    className = '',
    ...props
}) => {
    const hasError = !!error;

    return (
        <div className={className}>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                {label}
                {props.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className={`relative flex items-center rounded-xl border transition-all ${hasError
                ? 'border-red-500 focus-within:ring-2 focus-within:ring-red-500/30'
                : 'border-gray-200 dark:border-gray-700 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30'
                } bg-gray-50 dark:bg-gray-800`}>
                {leftIcon && (
                    <span className="pl-4 text-gray-400">{leftIcon}</span>
                )}
                <input
                    {...props}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={onBlur}
                    className={`flex-1 h-12 px-4 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none ${leftIcon ? 'pl-2' : ''
                        } ${rightIcon ? 'pr-2' : ''}`}
                />
                {rightIcon && (
                    <span className="pr-4 text-gray-400">{rightIcon}</span>
                )}
            </div>
            {hasError ? (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                    {error}
                </p>
            ) : helperText ? (
                <p className="mt-1.5 text-xs text-gray-500">{helperText}</p>
            ) : null}
        </div>
    );
};

// Select component with validation
interface FormSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    error?: string | null;
    onBlur?: () => void;
}

export const FormSelect: React.FC<FormSelectProps> = ({
    label,
    value,
    onChange,
    options,
    error,
    onBlur,
    className = '',
    ...props
}) => {
    const hasError = !!error;

    return (
        <div className={className}>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                {label}
                {props.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
                {...props}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                className={`w-full h-12 px-4 rounded-xl border transition-all ${hasError
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/30'
                    : 'border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/30'
                    } bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none`}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
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

// Amount Input with currency prefix
interface AmountInputProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    error?: string | null;
    onBlur?: () => void;
    placeholder?: string;
    className?: string;
    required?: boolean;
}

export const AmountInput: React.FC<AmountInputProps> = ({
    label,
    value,
    onChange,
    error,
    onBlur,
    placeholder = '0',
    className = '',
    required,
}) => {
    const hasError = !!error;

    return (
        <div className={className}>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className={`flex items-center rounded-xl border transition-all ${hasError
                ? 'border-red-500 focus-within:ring-2 focus-within:ring-red-500/30'
                : 'border-gray-200 dark:border-gray-700 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30'
                } bg-gray-50 dark:bg-gray-800 p-4`}>
                <span className="text-lg font-bold text-gray-400 mr-2">Rp</span>
                <input
                    type="number"
                    value={value === 0 ? '' : value}
                    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    required={required}
                    className="flex-1 text-xl font-bold text-gray-900 dark:text-white bg-transparent border-none p-0 focus:ring-0 focus:outline-none"
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

export default FormInput;
