import React from 'react';

// Icons
const WalletIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
    </svg>
);

const TrendingUpIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
    </svg>
);

import CountUp from '../common/CountUp';

const TrendingDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181" />
    </svg>
);

/**
 * Format currency to Indonesian Rupiah
 * Requirement 3.6: Display amounts in Indonesian Rupiah format
 */
export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

interface FinancialCardProps {
    title: string;
    amount: number;
    icon: React.ReactNode;
    variant: 'balance' | 'income' | 'expense';
    size?: 'large' | 'medium';
    trend?: {
        percentage: number;
        direction: 'up' | 'down';
    };
}

/**
 * Individual Financial Card Component
 * Requirements 3.1, 3.2, 3.3: Financial Summary Cards with proper layout and typography
 */
const FinancialCard: React.FC<FinancialCardProps> = ({
    title,
    amount,
    icon,
    variant,
    trend,
    size = 'medium'
}) => {
    // Color configurations based on variant - Requirement 3.4
    const variantStyles = {
        balance: {
            iconBg: 'bg-blue-500/10',
            iconColor: 'text-blue-400',
            border: 'border-blue-500/10',
        },
        income: {
            iconBg: 'bg-emerald-500/10',
            iconColor: 'text-emerald-400',
            border: 'border-emerald-500/10',
        },
        expense: {
            iconBg: 'bg-rose-500/10',
            iconColor: 'text-rose-400',
            border: 'border-rose-500/10',
        },
    };

    const styles = variantStyles[variant];

    // Typography hierarchy - Requirements 3.7, 3.8
    const amountSizeClass = size === 'large' ? 'text-3xl' : 'text-lg';

    return (
        <div
            className={`
                relative overflow-hidden group
                glass-panel
                rounded-[1.5rem] p-6 hover:shadow-md
                hover:-translate-y-1 transition-all duration-300
            `}
        >
            {/* Decorative blur element */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl opacity-60 -mr-8 -mt-8 pointer-events-none"></div>

            <div className="flex items-start justify-between mb-3 relative z-10">
                {/* Icon - Requirement 3.1, 3.2, 3.3 */}
                <div className={`w-11 h-11 rounded-2xl ${styles.iconBg} flex items-center justify-center ${styles.iconColor} border ${styles.border}`}>
                    {icon}
                </div>

                {/* Trend badge - Requirements 3.9 */}
                {trend && (
                    <span className={`
                        px-2 py-0.5 rounded-md text-[11px] font-bold
                        ${trend.direction === 'up'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }
                    `}>
                        {trend.direction === 'up' ? '+' : '-'}{trend.percentage}%
                    </span>
                )}
            </div>

            <div className="relative z-10">
                <p className="text-gray-400 text-sm font-medium mb-1">
                    {title}
                </p>
                <h3 className={`${amountSizeClass} font-extrabold text-gray-100 tracking-tight`}>
                    <CountUp end={amount} formattingFn={formatCurrency} duration={2500} />
                </h3>
            </div>
        </div>
    );
};

interface FinancialSummaryProps {
    totalBalance: number;
    income: number;
    expense: number;
    incomeTrend?: number;
    expenseTrend?: number;
}

/**
 * FinancialSummary Component - Requirement 3
 * 
 * Features:
 * - Total balance card spanning full width (col-span-2) with 3xl typography (3.1, 3.7)
 * - Income card with trending up icon and percentage badge (3.2, 3.8)
 * - Expense card with trending down icon and percentage badge (3.3, 3.8)
 * - Color coding: blue for balance, emerald for income, rose for expenses (3.4)
 * - Rounded corners (1.5rem) and subtle shadows with border highlights (3.5)
 * - Amount in Indonesian Rupiah format with proper number formatting (3.6)
 * - Trend badges with + or - prefix and appropriate background colors (3.9)
 */
const FinancialSummary: React.FC<FinancialSummaryProps> = ({
    totalBalance,
    income,
    expense,
    incomeTrend,
    expenseTrend
}) => {
    return (
        <div className="grid grid-cols-2 gap-4">
            {/* Total Balance Card - Full Width (col-span-2) - Requirements 3.1, 3.7 */}
            <div className="col-span-2">
                <FinancialCard
                    title="Total Saldo"
                    amount={totalBalance}
                    icon={<WalletIcon className="w-6 h-6" />}
                    variant="balance"
                    size="large"
                />
            </div>

            {/* Income Card - Half Width - Requirements 3.2, 3.8 */}
            <FinancialCard
                title="Pemasukan"
                amount={income}
                icon={<TrendingUpIcon className="w-5 h-5" />}
                variant="income"
                size="medium"
                trend={incomeTrend !== undefined ? {
                    percentage: Math.abs(incomeTrend),
                    direction: incomeTrend >= 0 ? 'up' : 'down'
                } : { percentage: 12, direction: 'up' }}
            />

            {/* Expense Card - Half Width - Requirements 3.3, 3.8 */}
            <FinancialCard
                title="Pengeluaran"
                amount={expense}
                icon={<TrendingDownIcon className="w-5 h-5" />}
                variant="expense"
                size="medium"
                trend={expenseTrend !== undefined ? {
                    percentage: Math.abs(expenseTrend),
                    direction: expenseTrend >= 0 ? 'up' : 'down'
                } : { percentage: 5, direction: 'down' }}
            />
        </div>
    );
};

export default FinancialSummary;
