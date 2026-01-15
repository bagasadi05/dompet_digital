import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Transaction, TransactionType } from '../../services/types';

interface IncomeExpenseBarChartProps {
  transactions: Transaction[];
}

const IncomeExpenseBarChart: React.FC<IncomeExpenseBarChartProps> = ({ transactions }) => {
  const totals = transactions.reduce((acc, t) => {
    if (t.type === TransactionType.INCOME) {
      acc.income += t.amount;
    } else {
      acc.expense += t.amount;
    }
    return acc;
  }, { income: 0, expense: 0 });

  const data = [
    { name: 'Ringkasan', Pemasukan: totals.income, Pengeluaran: totals.expense },
  ];

  return (
    <ResponsiveContainer width="100%" height={300} minWidth={100}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis dataKey="name" tick={{ fill: 'currentColor' }} className="text-xs text-light-text dark:text-dark-text" />
        <YAxis tickFormatter={(value) => new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(value as number)} tick={{ fill: 'currentColor' }} className="text-xs text-light-text dark:text-dark-text" />
        <Tooltip
          formatter={(value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value)}
          contentStyle={{
            backgroundColor: 'rgba(31, 41, 55, 0.8)',
            border: 'none',
            borderRadius: '0.5rem',
            color: '#F3F4F6'
          }}
        />
        <Legend />
        <Bar dataKey="Pemasukan" fill="#10B981" />
        <Bar dataKey="Pengeluaran" fill="#EF4444" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default IncomeExpenseBarChart;