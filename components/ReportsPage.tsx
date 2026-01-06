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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Laporan Keuangan</h2>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Analisis arus kas bulanan Anda</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Month Selector */}
          <div className="relative group">
            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full sm:w-auto h-12 pl-12 pr-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary font-bold shadow-sm transition-all"
            />
          </div>

          {/* Export Button */}
          <button
            onClick={() => handleExport('report')}
            className="h-12 px-6 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary-dark hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-primary/30 transition-all active:scale-95"
          >
            <DownloadIcon className="w-5 h-5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {stats.transactionCount > 0 ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-[24px] bg-white dark:bg-gray-800 border border-gray-100 dark:border-white/5 shadow-sm group hover:shadow-md transition-all">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                  <ArrowTrendingUpIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pemasukan</p>
                  <p className="text-sm text-gray-400 font-medium">Bulan ini</p>
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mt-2 tracking-tight">{formatCurrency(stats.income)}</p>
            </div>

            <div className="p-6 rounded-[24px] bg-white dark:bg-gray-800 border border-gray-100 dark:border-white/5 shadow-sm group hover:shadow-md transition-all">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform duration-300">
                  <ArrowTrendingDownIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pengeluaran</p>
                  <p className="text-sm text-gray-400 font-medium">Bulan ini</p>
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mt-2 tracking-tight">{formatCurrency(stats.expense)}</p>
            </div>

            <div className={`p-6 rounded-[24px] border shadow-sm group hover:shadow-md transition-all ${stats.net >= 0
                ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-100 dark:border-emerald-800'
                : 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-100 dark:border-orange-800'
              }`}>
              <div className="flex items-center gap-4 mb-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${stats.net >= 0
                    ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-300'
                  }`}>
                  <ChartBarIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider ${stats.net >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-orange-700 dark:text-orange-400'
                    }`}>Sisa Saldo</p>
                  <p className={`text-sm font-medium ${stats.net >= 0 ? 'text-emerald-600/70 dark:text-emerald-400/70' : 'text-orange-600/70 dark:text-orange-400/70'
                    }`}>Net Cashflow</p>
                </div>
              </div>
              <p className={`text-2xl md:text-3xl font-extrabold mt-2 tracking-tight ${stats.net >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-orange-700 dark:text-orange-400'
                }`}>
                {formatCurrency(stats.net)}
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expense Breakdown */}
            <div className="p-8 rounded-[32px] bg-white dark:bg-gray-800 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
                  <ChartPieIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Breakdown Pengeluaran</h3>
                  <p className="text-sm text-gray-500 font-medium">Berdasarkan kategori</p>
                </div>
              </div>
              <div className="flex-1 min-h-[350px] flex items-center justify-center bg-gray-50 dark:bg-black/20 rounded-[24px] border border-gray-100 dark:border-white/5 p-4">
                <ExpensePieChart
                  transactions={filteredTransactions}
                />
              </div>
            </div>

            {/* Income vs Expense Trend */}
            <div className="p-8 rounded-[32px] bg-white dark:bg-gray-800 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-inner">
                  <ChartBarIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Arus Kas Harian</h3>
                  <p className="text-sm text-gray-500 font-medium">Income vs Expense</p>
                </div>
              </div>
              <div className="flex-1 min-h-[350px] flex items-center justify-center bg-gray-50 dark:bg-black/20 rounded-[24px] border border-gray-100 dark:border-white/5 p-4">
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
