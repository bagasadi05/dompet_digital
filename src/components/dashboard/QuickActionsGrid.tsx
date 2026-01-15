import React from 'react';
import { useNavigate } from 'react-router-dom';

// Icons
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const ArrowsRightLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
);

const DocumentScanIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);

const CreditCardIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
    </svg>
);

const ReceiptIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
);

interface QuickAction {
    id: string;
    label: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    onClick: () => void;
}

interface QuickActionsGridProps {
    onAddTransaction?: () => void;
    onTransfer?: () => void;
    onScanReceipt?: () => void;
    onTopUp?: () => void;
    onBills?: () => void;
}

/**
 * QuickActionsGrid Component - Requirement 4
 * 
 * Features:
 * - 4x2 grid layout with proper spacing (4.1, 4.3)
 * - Buttons for: Tambah (neutral), Transfer (blue), Scan Struk (purple), Top Up (orange), Tagihan (pink) (4.2)
 * - Scale animation (0.95) on press (4.4)
 * - Material Icons and distinct color coding (4.5)
 * - Rounded card with 24px padding (4.6)
 * - 11px font size with semibold weight for labels (4.7)
 */
const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({
    onAddTransaction,
    onTransfer,
    onScanReceipt,
    onTopUp,
    onBills
}) => {
    const navigate = useNavigate();

    const actions: QuickAction[] = [
        {
            id: 'add',
            label: 'Tambah',
            icon: <PlusIcon className="w-6 h-6" />,
            color: 'text-gray-600 dark:text-gray-400',
            bgColor: 'bg-white/5 hover:bg-white/10 border border-white/5',
            onClick: () => onAddTransaction ? onAddTransaction() : navigate('/transactions'),
        },
        {
            id: 'transfer',
            label: 'Transfer',
            icon: <ArrowsRightLeftIcon className="w-6 h-6" />,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/10',
            onClick: () => onTransfer ? onTransfer() : navigate('/transactions'),
        },
        {
            id: 'scan',
            label: 'Scan\nStruk',
            icon: <DocumentScanIcon className="w-6 h-6" />,
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/10',
            onClick: () => onScanReceipt ? onScanReceipt() : navigate('/transactions'),
        },
        {
            id: 'topup',
            label: 'Top Up',
            icon: <CreditCardIcon className="w-6 h-6" />,
            color: 'text-orange-400',
            bgColor: 'bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/10',
            onClick: () => onTopUp ? onTopUp() : navigate('/transactions'),
        },
        {
            id: 'bills',
            label: 'Tagihan',
            icon: <ReceiptIcon className="w-6 h-6" />,
            color: 'text-pink-400',
            bgColor: 'bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/10',
            onClick: () => onBills ? onBills() : navigate('/planning'),
        },
    ];

    return (
        <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                Aksi Cepat
            </h3>
            
            <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm border border-gray-100 dark:border-gray-700/50 shadow-sm rounded-[1.5rem] p-6">
                {/* 4x2 Grid layout - Requirement 4.1, 4.3 */}
                <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                    {/* First row - 4 buttons */}
                    {actions.slice(0, 4).map((action) => (
                        <button
                            key={action.id}
                            onClick={action.onClick}
                            className="flex flex-col items-center gap-2 group"
                        >
                            {/* Icon container - 56px (14*4) with proper styling */}
                            <div className={`
                                w-14 h-14 rounded-2xl flex items-center justify-center
                                transition-all duration-300 shadow-sm
                                ${action.bgColor}
                                group-active:scale-95
                            `}>
                                <span className={action.color}>
                                    {action.icon}
                                </span>
                            </div>
                            
                            {/* Label with 11px font size and semibold weight - Requirement 4.7 */}
                            <span 
                                className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors leading-tight text-center"
                                style={{ lineHeight: '1.2' }}
                            >
                                {action.label}
                            </span>
                        </button>
                    ))}
                    
                    {/* Second row - Tagihan button with proper alignment */}
                    <button
                        onClick={actions[4].onClick}
                        className="flex flex-col items-center gap-2 group mt-2"
                    >
                        <div className={`
                            w-14 h-14 rounded-2xl flex items-center justify-center
                            transition-all duration-300 shadow-sm
                            ${actions[4].bgColor}
                            group-active:scale-95
                        `}>
                            <span className={actions[4].color}>
                                {actions[4].icon}
                            </span>
                        </div>
                        <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
                            {actions[4].label}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuickActionsGrid;
