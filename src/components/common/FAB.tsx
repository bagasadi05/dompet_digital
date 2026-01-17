import React from 'react';
import PlusIcon from '../icons/PlusIcon';

interface FABProps {
    onClick: () => void;
    ariaLabel: string;
}

const FAB: React.FC<FABProps> = ({ onClick, ariaLabel }) => {
    return (
        <button
            onClick={onClick}
            aria-label={ariaLabel}
            className="fixed bottom-24 right-5 md:bottom-10 md:right-10 z-20 h-14 w-14 rounded-full bg-primary dark:bg-secondary shadow-lg flex items-center justify-center text-white hover:bg-primary-dark dark:hover:bg-secondary-dark transition-transform transform hover:scale-110"
        >
            <PlusIcon className="h-8 w-8" />
        </button>
    );
};

export default FAB;