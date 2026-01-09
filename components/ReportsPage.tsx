import React, { useState, useMemo } from 'react';
import CountUp from './common/CountUp';
import { TransactionType } from '../services/types';
import ExpensePieChart from './charts/ExpensePieChart';
import IncomeExpenseBarChart from './charts/IncomeExpenseBarChart';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { formatCurrency } from '../utils';
import { exportReportToPDF } from '../utils/exportUtils';
import { generateMonthlyInsight } from '../services/aiReportService';
import ReactMarkdown from 'react-markdown';
import {
  ChartPieIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DownloadIcon,
  ClipboardDocumentListIcon
} from './common/Icons';

const ReportsPage: React.FC = () => {
  const { transactions } = useData();
  const { showToast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  // AI Insight State
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter Transactions for Selected Month
  const filteredTransactions = useMemo(() => {
    if (!selectedMonth) return [];
    return transactions.filter(t => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Filter Transactions for Previous Month (for comparison)
  const previousMonthTransactions = useMemo(() => {
    if (!selectedMonth) return [];
    const date = new Date(selectedMonth + '-01');
    date.setMonth(date.getMonth() - 1);
    const prevMonthStr = date.toISOString().slice(0, 7);
    return transactions.filter(t => t.date.startsWith(prevMonthStr));
  }, [transactions, selectedMonth]);

  // Calculate Stats
  const stats = useMemo(() => {
    // Current Month
    const income = filteredTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
    const net = income - expense;

    // Previous Month
    const prevIncome = previousMonthTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    const prevExpense = previousMonthTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);

    // Growth Calculation
    const calcGrowth = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return ((current - prev) / prev) * 100;
    };

    return {
      income,
      expense,
      net,
      transactionCount: filteredTransactions.length,
      growth: {
        income: calcGrowth(income, prevIncome),
        expense: calcGrowth(expense, prevExpense)
      }
    };
  }, [filteredTransactions, previousMonthTransactions]);

  const monthLabel = useMemo(() => {
    if (!selectedMonth) return '';
    const date = new Date(selectedMonth + '-01');
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  const handleExport = (_type: 'report') => {
    if (filteredTransactions.length === 0) {
      showToast({ type: 'warning', title: 'Tidak ada data', message: 'Tidak ada transaksi untuk diekspor.' });
      return;
    }

    try {
      const monthName = new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      exportReportToPDF(filteredTransactions, monthName);
      showToast({ type: 'success', title: 'Export berhasil', message: 'Laporan PDF telah diunduh.' });
    } catch (_error) {
      showToast({ type: 'error', title: 'Export gagal', message: 'Terjadi kesalahan saat mengekspor data.' });
    }
  };

  const handleGenerateInsight = async () => {
    if (filteredTransactions.length === 0) {
      showToast({ type: 'warning', title: 'Data Kosong', message: 'Tidak ada data untuk dianalisis.' });
      return;
    }

    setIsGenerating(true);
    setAiInsight(null);
    try {
      const insight = await generateMonthlyInsight(filteredTransactions, monthLabel, previousMonthTransactions);
      setAiInsight(insight);
    } catch (error) {
      console.error(error);
      showToast({ type: 'error', title: 'Gagal', message: 'Gagal menganalisis data.' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Laporan Keuangan</h2>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Analisis performa & kesehatan finansial</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Month Selector */}
          <div className="relative group">
            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => { setSelectedMonth(e.target.value); setAiInsight(null); }}
              className="w-full sm:w-auto h-12 pl-12 pr-4 rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary font-bold shadow-sm transition-all hover:bg-white dark:hover:bg-gray-800"
            />
          </div>

          {/* Export Button */}
          <button
            onClick={() => handleExport('report')}
            className="h-12 px-6 flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all active:scale-95"
          >
            <DownloadIcon className="w-5 h-5" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {stats.transactionCount > 0 ? (
        <>
          {/* AI Analyst Section */}
          <div className="glass-panel p-6 rounded-[24px] border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 relative overflow-hidden group">

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-900 dark:bg-gray-700 flex items-center justify-center text-white shadow-sm">
                    <ClipboardDocumentListIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Executive Summary</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">AI-Generated Insights</p>
                  </div>
                </div>

                {!aiInsight && !isGenerating && (
                  <button
                    onClick={handleGenerateInsight}
                    className="px-4 py-2 rounded-lg bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-200 text-white dark:text-gray-900 text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2"
                  >
                    <ClipboardDocumentListIcon className="w-4 h-4" />
                    Generate Report
                  </button>
                )}
              </div>

              {isGenerating && (
                <div className="py-8 text-center animate-pulse">
                  <div className="inline-block px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium">
                    ⏳ Generating financial analysis...
                  </div>
                </div>
              )}

              {aiInsight && (
                <div className="bg-white/50 dark:bg-black/20 rounded-xl p-5 border border-gray-100 dark:border-gray-700 backdrop-blur-sm">
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-li:text-gray-700 dark:prose-li:text-gray-300">
                    <ReactMarkdown>{aiInsight}</ReactMarkdown>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleGenerateInsight}
                      className="text-xs font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                    >
                      🔄 Refresh Analysis
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards with Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Income */}
            <div className="glass-panel p-6 rounded-[28px] group hover:translate-y-[-4px] transition-all duration-300">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <ArrowTrendingUpIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pemasukan</p>
                  <div className={`text-xs font-bold flex items-center gap-1 ${stats.growth.income >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {stats.growth.income >= 0 ? '+' : ''}{stats.growth.income.toFixed(1)}% vs bulan lalu
                  </div>
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mt-2 tracking-tight">
                <CountUp end={stats.income} formattingFn={formatCurrency} />
              </p>
            </div>

            {/* Expense */}
            <div className="glass-panel p-6 rounded-[28px] group hover:translate-y-[-4px] transition-all duration-300">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <ArrowTrendingDownIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pengeluaran</p>
                  <div className={`text-xs font-bold flex items-center gap-1 ${stats.growth.expense <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {stats.growth.expense > 0 ? '+' : ''}{stats.growth.expense.toFixed(1)}% vs bulan lalu
                  </div>
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mt-2 tracking-tight">
                <CountUp end={stats.expense} formattingFn={formatCurrency} />
              </p>
            </div>

            {/* Net */}
            <div className={`glass-panel p-6 rounded-[28px] group hover:translate-y-[-4px] transition-all duration-300 relative overflow-hidden`}>
              <div className={`absolute inset-0 opacity-5 ${stats.net >= 0 ? 'bg-emerald-500' : 'bg-orange-500'}`} />
              <div className="flex items-center gap-4 mb-3 relative z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stats.net >= 0
                  ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                  : 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
                  }`}>
                  <ChartBarIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider ${stats.net >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-orange-700 dark:text-orange-400'}`}>
                    {stats.net >= 0 ? 'Surplus' : 'Defisit'}
                  </p>
                  <p className={`text-sm font-medium opacity-80 ${stats.net >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-orange-700 dark:text-orange-300'}`}>
                    Net Cashflow
                  </p>
                </div>
              </div>
              <p className={`text-2xl md:text-3xl font-extrabold mt-2 tracking-tight relative z-10 ${stats.net >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-orange-700 dark:text-orange-400'}`}>
                <CountUp end={stats.net} formattingFn={formatCurrency} />
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expense Breakdown */}
            <div className="glass-panel p-8 rounded-[32px] hover:shadow-lg transition-all duration-300 flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
                  <ChartPieIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Breakdown Pengeluaran</h3>
                  <p className="text-sm text-gray-500 font-medium">Persentase per kategori</p>
                </div>
              </div>
              <div className="flex-1 min-h-[350px] flex items-center justify-center bg-gray-50/50 dark:bg-black/20 rounded-[24px] border border-gray-100 dark:border-white/5 p-4 backdrop-blur-md">
                <ExpensePieChart transactions={filteredTransactions} />
              </div>
            </div>

            {/* Income vs Expense Trend */}
            <div className="glass-panel p-8 rounded-[32px] hover:shadow-lg transition-all duration-300 flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-inner">
                  <ChartBarIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Arus Kas Harian</h3>
                  <p className="text-sm text-gray-500 font-medium">Tren pemasukan & pengeluaran</p>
                </div>
              </div>
              <div className="flex-1 min-h-[350px] flex items-center justify-center bg-gray-50/50 dark:bg-black/20 rounded-[24px] border border-gray-100 dark:border-white/5 p-4 backdrop-blur-md">
                <IncomeExpenseBarChart transactions={filteredTransactions} />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-gray-800 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="w-24 h-24 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <span className="text-5xl">📊</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Belum ada data laporan</h3>
          <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
            Tidak ada transaksi yang tercatat pada periode <span className="font-bold text-gray-900 dark:text-white">{monthLabel}</span>.
            Mulai catat transaksi Anda untuk melihat analisis keuangan yang mendalam.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
