import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Transaction, TransactionType, Category } from '../../services/types';

interface ExpensePieChartProps {
  transactions: Transaction[];
  height?: number;
}

const COLORS = ['#06B6D4', '#F59E0B', '#EF4444', '#8B5CF6', '#10B981', '#3B82F6', '#EC4899'];

const ExpensePieChart: React.FC<ExpensePieChartProps> = ({ transactions, height = 300 }) => {
  const expenseData = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => {
      const existing = acc.find(item => item.name === curr.category);
      if (existing) {
        existing.value += curr.amount;
      } else {
        acc.push({ name: curr.category, value: curr.amount });
      }
      return acc;
    }, [] as { name: Category; value: number }[]);

  if (expenseData.length === 0) {
    return <div className="text-center p-8 text-gray-500 dark:text-gray-400">Belum ada data pengeluaran.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={height} minWidth={100}>
      <PieChart>
        <Pie
          data={expenseData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={height < 280 ? 60 : 80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
            const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
            const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
            const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
            return (
              <text x={x} y={y} fill="currentColor" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs text-light-text dark:text-dark-text">
                {`${(percent * 100).toFixed(0)}%`}
              </text>
            );
          }}
        >
          {expenseData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value)}
          contentStyle={{
            backgroundColor: 'rgba(31, 41, 55, 0.8)',
            border: 'none',
            borderRadius: '0.5rem',
            color: '#F3F4F6'
          }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ExpensePieChart;