import React from 'react';

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
}

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label }) => {
    return (
        <button
            onClick={() => onChange(!checked)}
            className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                ${checked ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}
            `}
            role="switch"
            aria-checked={checked}
            aria-label={label}
        >
            <span
                className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${checked ? 'translate-x-6' : 'translate-x-1'}
                `}
            />
        </button>
    );
};

export default Toggle;
