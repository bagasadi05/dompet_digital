import React, { useState, useMemo } from 'react';
import { TransactionType } from '../services/types';
import ExpensePieChart from './charts/ExpensePieChart';
import IncomeExpenseBarChart from './charts/IncomeExpenseBarChart';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { formatCurrency } from '../utils';
import { exportReportToPDF } from '../utils/exportUtils';
import {
  ChartPieIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DownloadIcon
} from './common/Icons';

const ReportsPage: React.FC = () => {
  const { transactions } = useData();
  const { showToast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  const filteredTransactions = useMemo(() => {
    if (!selectedMonth) return [];
    return transactions.filter(t => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
    const net = income - expense;
    const transactionCount = filteredTransactions.length;

    return { income, expense, net, transactionCount };
  }, [filteredTransactions]);

  const monthLabel = useMemo(() => {
    if (!selectedMonth) return '';
    const date = new Date(selectedMonth + '-01');
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  const handleExport = (type: 'report') => {
    if (filteredTransactions.length === 0) {
      showToast({ type: 'warning', title: 'Tidak ada data', message: 'Tidak ada transaksi untuk diekspor.' });
      return;
    }

    try {
      const monthName = new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      exportReportToPDF(filteredTransactions, monthName);
      showToast({ type: 'success', title: 'Export berhasil', message: 'Laporan PDF telah diunduh.' });
    } catch (error) {
      showToast({ type: 'error', title: 'Export gagal', message: 'Terjadi kesalahan saat mengekspor data.' });
    }


  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Laporan Keuangan</h2>
          <p className="text-sm text-gray-500">Analisis pengeluaran dan pemasukan Anda bulanan</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          {/* Month Selector */}
          <div className="relative flex-1 md:flex-none">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full md:w-auto h-10 pl-10 pr-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Export Button */}
          <div className="relative">
            <button
              onClick={() => handleExport('report')}
              className="h-10 px-4 flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-primary/30"
            >
              <DownloadIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      {stats.transactionCount > 0 ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                  <ArrowTrendingUpIcon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-500">Pemasukan</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.income)}</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                  <ArrowTrendingDownIcon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-500">Pengeluaran</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.expense)}</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${stats.net >= 0 ? 'bg-[#10B981]/10 dark:bg-[#10B981]/30 text-[#10B981] dark:text-[#34D399]' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'}`}>
                  <ChartBarIcon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-500">Sisa Saldo</span>
              </div>
              <p className={`text-2xl font-bold ${stats.net >= 0 ? 'text-[#10B981] dark:text-[#34D399]' : 'text-orange-600 dark:text-orange-400'}`}>
                {formatCurrency(stats.net)}
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expense Breakdown */}
            <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <ChartPieIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Breakdown Pengeluaran</h3>
                  <p className="text-xs text-gray-500">Berdasarkan kategori</p>
                </div>
              </div>
              <div className="flex-1 min-h-[300px] flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                <ExpensePieChart
                  transactions={filteredTransactions}
                />
              </div>
            </div>

            {/* Income vs Expense Trend */}
            <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600 dark:text-purple-400">
                  <ChartBarIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Arus Kas</h3>
                  <p className="text-xs text-gray-500">Income vs Expense Harian</p>
                </div>
              </div>
              <div className="flex-1 min-h-[300px] flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                <IncomeExpenseBarChart transactions={filteredTransactions} />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 border-dashed">
          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">📊</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Belum ada data laporan</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Tidak ada transaksi yang tercatat pada periode <span className="font-semibold text-gray-900 dark:text-white">{monthLabel}</span>.
            Mulai catat transaksi Anda untuk melihat laporan.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
