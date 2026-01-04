import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { TransactionType } from '../services/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Import dashboard components
import WelcomeCard from './dashboard/WelcomeCard';
import FinancialSummary, { formatCurrency } from './dashboard/FinancialSummary';
import QuickActionsGrid from './dashboard/QuickActionsGrid';
import RecentTransactionsList from './dashboard/RecentTransactionsList';
import SavingsGoalsTracker from './dashboard/SavingsGoalsTracker';
import AIAnalysisPromo from './dashboard/AIAnalysisPromo';
import DashboardSkeleton from './dashboard/DashboardSkeleton';
import ErrorBoundary from './common/ErrorBoundary';
import { BillsEmptyState } from './common/EmptyState';
import type { Transaction as DashboardTransaction } from './dashboard/RecentTransactionsList';

// Icons
const ChartIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
);

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const TargetIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
);

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

// Custom tooltip for pie chart
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { fill: string } }> }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-white">{payload[0].name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{formatCurrency(payload[0].value)}</p>
            </div>
        );
    }
    return null;
};

/**
 * Dashboard Component - Main Dashboard with Redesign
 * 
 * Implements all requirements from dashboard-redesign spec:
 * - WelcomeCard with AI integration (Requirement 2)
 * - FinancialSummary cards (Requirement 3)
 * - QuickActionsGrid (Requirement 4)
 * - RecentTransactionsList (Requirement 5)
 * - SavingsGoalsTracker (Requirement 6)
 * - AIAnalysisPromo (Requirement 7)
 * - Dark mode theme (Requirement 9)
 * - Responsive design (Requirement 10)
 */
const Dashboard: React.FC = () => {
    const { transactions, goals, bills, loading } = useData();
    const { user } = useAuth();
    const navigate = useNavigate();

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Get user's first name
    const userName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Pengguna';

    const monthlyData = useMemo(() => {
        const monthlyTransactions = transactions.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });

        const income = monthlyTransactions
            .filter(t => t.type === TransactionType.INCOME)
            .reduce((sum, t) => sum + t.amount, 0);

        const expense = monthlyTransactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .reduce((sum, t) => sum + t.amount, 0);

        // Group expenses by category
        const expenseByCategory = monthlyTransactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount;
                return acc;
            }, {} as Record<string, number>);

        const pieData = Object.entries(expenseByCategory)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // Map transactions to fit the DashboardTransaction type
        const recentTransactions: DashboardTransaction[] = [...monthlyTransactions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
            .map(t => ({
                id: t.id,
                type: t.type === TransactionType.INCOME ? 'income' : 'expense',
                description: t.description,
                category: t.category,
                amount: t.amount,
                date: t.date,
            }));

        return { income, expense, balance: income - expense, pieData, recentTransactions };
    }, [transactions, currentMonth, currentYear]);

    const upcomingBills = useMemo(() => {
        const today = new Date();
        return bills
            .filter(b => new Date(b.nextDueDate) >= today)
            .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime())
            .slice(0, 3);
    }, [bills]);

    // Get primary savings goal
    const primaryGoal = goals.length > 0 ? {
        id: goals[0].id,
        name: goals[0].name,
        target_amount: goals[0].targetAmount,
        current_amount: goals[0].currentAmount,
        target_date: goals[0].targetDate,
        icon: '🎯',
    } : null;

    const isNewUser = transactions.length === 0 && goals.length === 0;

    // Show skeleton while loading
    if (loading) {
        return (
            <ErrorBoundary>
                <DashboardSkeleton />
            </ErrorBoundary>
        );
    }

    return (
        <ErrorBoundary>
            <div className="space-y-5 pb-24 md:pb-8">
                {/* Welcome Card with AI - Requirement 2 */}
                <WelcomeCard
                    userName={userName}
                    onAIAssistantClick={() => navigate('/ai-chat')}
                />

                {/* New User Onboarding Card */}
                {isNewUser && (
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/40">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30">
                                <SparklesIcon className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 dark:text-white">Mulai Kelola Keuangan Anda! 🚀</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Tambahkan transaksi pertama Anda untuk mulai melacak pemasukan dan pengeluaran.
                                </p>
                                <div className="flex gap-3 mt-4">
                                    <Link
                                        to="/transactions"
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                        Tambah Transaksi
                                    </Link>
                                    <Link
                                        to="/planning"
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium text-sm transition-colors border border-gray-200 dark:border-gray-700"
                                    >
                                        <TargetIcon className="w-4 h-4" />
                                        Buat Impian
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Financial Summary Cards - Requirement 3 */}
                <FinancialSummary
                    totalBalance={monthlyData.balance}
                    income={monthlyData.income}
                    expense={monthlyData.expense}
                />

                {/* Quick Actions Grid - Requirement 4 */}
                <QuickActionsGrid
                    onAddTransaction={() => navigate('/transactions')}
                    onScanReceipt={() => navigate('/transactions')}
                    onBills={() => navigate('/planning')}
                />

                {/* Two Column Layout for Charts and Lists */}
                <div className="grid md:grid-cols-2 gap-5">
                    {/* Expense Pie Chart */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-gray-800/80 backdrop-blur-sm shadow-sm border border-gray-100 dark:border-gray-700/50">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <ChartIcon className="w-5 h-5 text-primary" />
                                Ringkasan Pengeluaran
                            </h3>
                            <Link to="/reports" className="text-sm text-primary hover:text-primary-dark font-medium transition-colors">Detail</Link>
                        </div>
                        {monthlyData.pieData.length > 0 ? (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={monthlyData.pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            paddingAngle={3}
                                            dataKey="value"
                                            strokeWidth={0}
                                        >
                                            {monthlyData.pieData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend
                                            formatter={(value) => <span className="text-sm text-gray-600 dark:text-gray-400">{value}</span>}
                                            layout="horizontal"
                                            align="center"
                                            verticalAlign="bottom"
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                                    <ChartIcon className="w-7 h-7 text-gray-400" />
                                </div>
                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Belum Ada Data</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px]">
                                    Catat pengeluaran untuk melihat ringkasan kategori
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Recent Transactions - Requirement 5 */}
                    <RecentTransactionsList
                        transactions={monthlyData.recentTransactions}
                        onAddTransaction={() => navigate('/transactions')}
                    />
                </div>

                {/* Second Row: Savings Goals and Upcoming Bills */}
                <div className="grid md:grid-cols-2 gap-5">
                    {/* Savings Goals Tracker - Requirement 6 */}
                    <SavingsGoalsTracker
                        goal={primaryGoal}
                        onCreateGoal={() => navigate('/planning')}
                    />

                    {/* Upcoming Bills */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-gray-800/80 backdrop-blur-sm shadow-sm border border-gray-100 dark:border-gray-700/50">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-primary" />
                                Tagihan Mendatang
                            </h3>
                            <Link to="/planning" className="text-sm text-primary hover:text-primary-dark font-medium transition-colors">Kelola</Link>
                        </div>
                        {upcomingBills.length > 0 ? (
                            <ul className="space-y-3">
                                {upcomingBills.map(bill => {
                                    const dueDate = new Date(bill.nextDueDate);
                                    const today = new Date();
                                    const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                    const isUrgent = daysLeft <= 3;

                                    return (
                                        <li key={bill.id} className="group flex justify-between items-center py-3 px-3 -mx-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isUrgent ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                                                    <CalendarIcon className={`w-5 h-5 ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white text-sm">{bill.name}</p>
                                                    <p className={`text-xs ${isUrgent ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                                                        {isUrgent ? `⚠️ ${daysLeft} hari lagi` : dueDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-gray-900 dark:text-white text-sm">{formatCurrency(bill.amount)}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <BillsEmptyState onAddBill={() => navigate('/planning')} />
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Analysis Promo - Requirement 7 */}
                <AIAnalysisPromo
                    onTryClick={() => navigate('/ai-chat')}
                />

                {/* Floating Action Buttons - Mobile Only */}
                <div className="fixed bottom-24 right-4 md:hidden flex flex-col gap-3 z-50">
                    <Link
                        to="/ai-chat"
                        className="flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 hover:bg-indigo-500 hover:scale-105 transition-all active:scale-95 border border-white/20"
                        title="Asisten AI"
                    >
                        <SparklesIcon className="w-6 h-6" />
                    </Link>
                    <Link
                        to="/transactions"
                        className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 hover:bg-emerald-400 hover:scale-105 transition-all active:scale-95 border border-white/20"
                        title="Tambah Transaksi"
                    >
                        <PlusIcon className="w-6 h-6" />
                    </Link>
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default Dashboard;
