import React, { useMemo } from 'react';
import { Transaction, TransactionType } from '../../services/types';
import {
    SparklesIcon,
    ExclamationCircleIcon,
    CheckCircleIcon,
    TrendingUpIcon
} from '../common/Icons';

interface FinancialScoreWidgetProps {
    transactions: Transaction[];
}

const FinancialScoreWidget: React.FC<FinancialScoreWidgetProps> = ({ transactions }) => {
    // Filter for current month only
    const currentMonthTransactions = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

        return transactions.filter(t => t.date >= startOfMonth && t.date <= endOfMonth);
    }, [transactions]);

    const { score, status, color, icon: Icon } = useMemo(() => {
        const incomeTotal = currentMonthTransactions
            .filter(t => t.type === TransactionType.INCOME)
            .reduce((acc, curr) => acc + curr.amount, 0);

        const expenseTotal = currentMonthTransactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .reduce((acc, curr) => acc + curr.amount, 0);

        // Core constraints
        if (incomeTotal === 0) return {
            income: 0,
            expense: expenseTotal,
            score: 0,
            status: 'Belum Ada Pemasukan',
            color: 'text-gray-400',
            icon: ExclamationCircleIcon
        };


        const savingsRate = Math.max(0, (incomeTotal - expenseTotal) / incomeTotal); // 0.0 to 1.0

        // Revised Simple Formula:
        // Score = Savings Rate * 100.
        // If you save 50% of income, score is 100. (Capped)
        // If you save 20%, score is 40 + bonus.
        // Let's us weighted:
        // Base: 50 pts for positive cashflow.
        // Bonus: 50 pts for > 20% savings rate.

        let calculatedScore = 0;
        if (incomeTotal > expenseTotal) {
            calculatedScore += 50; // Base for not being broke
            if (savingsRate >= 0.2) {
                calculatedScore += 30; // Healthy savings
                if (savingsRate >= 0.4) {
                    calculatedScore += 20; // Excellent savings
                } else {
                    calculatedScore += (savingsRate - 0.2) / 0.2 * 20;
                }
            } else {
                calculatedScore += (savingsRate / 0.2) * 30;
            }
        } else {
            // In debt/deficit
            calculatedScore = Math.max(0, 40 - ((expenseTotal - incomeTotal) / incomeTotal * 40));
        }

        calculatedScore = Math.round(Math.min(100, calculatedScore));

        // Determine Status
        let statusLabel = '';
        let statusColor = '';
        let StatusIcon = CheckCircleIcon;

        if (calculatedScore >= 80) {
            statusLabel = 'Sultan 👑';
            statusColor = 'text-amber-500';
            StatusIcon = SparklesIcon;
        } else if (calculatedScore >= 60) {
            statusLabel = 'Juragan 💼';
            statusColor = 'text-emerald-500';
            StatusIcon = TrendingUpIcon;
        } else if (calculatedScore >= 40) {
            statusLabel = 'Pejuang 🛡️';
            statusColor = 'text-blue-500';
            StatusIcon = CheckCircleIcon;
        } else {
            statusLabel = 'Waspada ⚠️';
            statusColor = 'text-rose-500';
            StatusIcon = ExclamationCircleIcon;
        }

        return {
            income: incomeTotal,
            expense: expenseTotal,
            score: calculatedScore,
            status: statusLabel,
            color: statusColor,
            icon: StatusIcon
        };
    }, [currentMonthTransactions]);


    return (
        <div className="glass-panel p-5 rounded-[24px] flex items-center justify-between relative overflow-hidden group">
            <div className="z-10 flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Financial Health</h3>
                </div>
                <div className="flex items-end gap-3">
                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tighter">
                        {score}
                    </span>
                    <div className="mb-1.5 flex flex-col">
                        <span className={`text-sm font-bold ${color} transition-colors`}>
                            {status}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                            Skor Bulan Ini
                        </span>
                    </div>
                </div>
            </div>

            {/* Visual Gauge */}
            <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    {/* Background Circle */}
                    <path
                        className="text-gray-100 dark:text-gray-700"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.8" // Thicker
                    />
                    {/* Progress Circle */}
                    <path
                        className={`${color} transition-all duration-1000 ease-out`}
                        strokeDasharray={`${score}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.8"
                        strokeLinecap="round" // Round caps
                    />
                </svg>
                {/* Center Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className={`w-8 h-8 ${color} opacity-20`} />
                </div>
            </div>

            {/* Ambient Background Glow */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl opacity-20 ${color.replace('text-', 'bg-')}`} />
        </div>
    );
};

export default FinancialScoreWidget;
