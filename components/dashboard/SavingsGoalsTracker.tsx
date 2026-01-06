import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from './FinancialSummary';
import { GoalsEmptyState } from '../common/EmptyState';

// Target/Goal Icon
const TargetIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
);

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
);

export interface SavingsGoal {
    id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    target_date?: string;
    icon?: string;
}

interface SavingsGoalsTrackerProps {
    goal: SavingsGoal | null;
    onManageClick?: () => void;
    onCreateGoal?: () => void;
}



/**
 * SavingsGoalsTracker Component - Requirement 6
 * 
 * Features:
 * - Display savings goal with target icon and progress (6.1)
 * - Show goal name, target date, and completion percentage (6.2)
 * - Progress bar with accurate percentage calculation (6.3)
 * - Display current and target amounts (6.4)
 * - "Kelola" management link (6.5)
 */
const SavingsGoalsTracker: React.FC<SavingsGoalsTrackerProps> = ({
    goal,
    onManageClick,
    onCreateGoal
}) => {
    // Calculate progress percentage - Requirement 6.3
    const progressPercentage = goal
        ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
        : 0;

    const isCompleted = progressPercentage >= 100;

    const formatTargetDate = (dateString?: string) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800/80 backdrop-blur-sm border border-gray-100 dark:border-gray-700/50 shadow-sm overflow-hidden">
            {/* Header with "Kelola" link - Requirement 6.5 */}
            <div className="flex justify-between items-center mb-3 gap-2">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                    <TargetIcon className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="truncate">Target Impian</span>
                </h3>
                <Link
                    to="/planning"
                    onClick={onManageClick}
                    className="text-xs text-primary hover:text-primary-dark font-medium transition-colors whitespace-nowrap flex-shrink-0"
                >
                    Kelola
                </Link>
            </div>

            {goal ? (
                <div className="space-y-4">
                    {/* Goal information - Requirement 6.1, 6.2 */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`
                                w-10 h-10 rounded-xl flex items-center justify-center
                                ${isCompleted
                                    ? 'bg-green-100 dark:bg-green-900/30'
                                    : 'bg-primary/10'
                                }
                            `}>
                                {isCompleted ? (
                                    <span className="text-lg">🎉</span>
                                ) : (
                                    <span className="text-lg">{goal.icon || '🎯'}</span>
                                )}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                    {goal.name}
                                </p>
                                {goal.target_date && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <CalendarIcon className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            Target: {formatTargetDate(goal.target_date)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Percentage badge */}
                        <span className={`
                            text-xs font-bold px-2.5 py-1 rounded-full
                            ${isCompleted
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }
                        `}>
                            {progressPercentage.toFixed(0)}%
                        </span>
                    </div>

                    {/* Progress bar - Requirement 6.3 */}
                    <div className="space-y-2">
                        <div className="relative w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={`
                                    absolute left-0 top-0 h-full rounded-full 
                                    transition-all duration-500 ease-out
                                    ${isCompleted
                                        ? 'bg-gradient-to-r from-green-400 to-green-600'
                                        : 'bg-gradient-to-r from-primary to-emerald-400'
                                    }
                                `}
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>

                        {/* Amount display - Requirement 6.4 */}
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                {formatCurrency(goal.current_amount)}
                            </span>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                {formatCurrency(goal.target_amount)}
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                <GoalsEmptyState onCreateGoal={onCreateGoal || (() => { })} />
            )}
        </div>
    );
};

export default SavingsGoalsTracker;
