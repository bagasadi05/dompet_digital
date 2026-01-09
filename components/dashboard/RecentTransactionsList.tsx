import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from './FinancialSummary';
import { TransactionsEmptyState } from '../common/EmptyState';

// Icons
const TrendingUpIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
    </svg>
);

const TrendingDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181" />
    </svg>
);

const WalletIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
    </svg>
);

export interface Transaction {
    id: string;
    type: 'income' | 'expense';
    description: string;
    category: string;
    amount: number;
    date: string;
}

interface RecentTransactionsListProps {
    transactions: Transaction[];
    onViewAllClick?: () => void;
    onAddTransaction?: () => void;
}



/**
 * RecentTransactionsList Component - Requirement 5
 * 
 * Features:
 * - Display recent transactions with details (5.1)
 * - Show transaction icon, name, description, amount, date (5.2)
 * - Color coding for income (green) and expense (red) (5.3)
 * - "Lihat Semua" link for complete history (5.4)
 * - Empty state when no transactions (5.5)
 */
const RecentTransactionsList: React.FC<RecentTransactionsListProps> = ({
    transactions,
    onViewAllClick,
    onAddTransaction
}) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short'
        });
    };

    return (
        <div className="glass-panel p-4 rounded-2xl shadow-sm overflow-hidden">
            {/* Header with "Lihat Semua" link - Requirement 5.4 */}
            <div className="flex justify-between items-center mb-3 gap-2">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                    <WalletIcon className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="truncate">Transaksi Terkini</span>
                </h3>
                <Link
                    to="/transactions"
                    onClick={onViewAllClick}
                    className="text-xs text-primary hover:text-primary-dark font-medium transition-colors whitespace-nowrap flex-shrink-0"
                >
                    Lihat Semua
                </Link>
            </div>

            {/* Transaction list or empty state */}
            {transactions.length > 0 ? (
                <ul className="space-y-2">
                    {transactions.map((transaction) => (
                        <li
                            key={transaction.id}
                            className="
                                flex justify-between items-center gap-2
                                py-2.5 px-2 -mx-2
                                rounded-xl
                                hover:bg-gray-50 dark:hover:bg-gray-700/50
                                transition-colors
                                cursor-pointer
                                group
                            "
                        >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {/* Transaction type icon - Requirement 5.2, 5.3 */}
                                <div className={`
                                    w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                                    transition-transform group-hover:scale-110
                                    ${transaction.type === 'income'
                                        ? 'bg-green-100 dark:bg-green-900/30'
                                        : 'bg-red-100 dark:bg-red-900/30'
                                    }
                                `}>
                                    {transaction.type === 'income' ? (
                                        <TrendingUpIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    ) : (
                                        <TrendingDownIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                                    )}
                                </div>

                                {/* Transaction details */}
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                        {transaction.description}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {transaction.category} • {formatDate(transaction.date)}
                                    </p>
                                </div>
                            </div>

                            {/* Amount with color coding - Requirement 5.3 */}
                            <span className={`
                                font-bold text-sm flex-shrink-0 text-right
                                ${transaction.type === 'income'
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                                }
                            `}>
                                {transaction.type === 'income' ? '+' : '-'}
                                {formatCurrency(transaction.amount)}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                // Empty state - Requirement 5.5
                <TransactionsEmptyState onAddTransaction={onAddTransaction || (() => { })} />
            )}
        </div>
    );
};

export default RecentTransactionsList;
