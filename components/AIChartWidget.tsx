import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

interface AIChartWidgetProps {
    type: 'bar' | 'pie';
    data: { name: string; value: number }[];
    title: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#FF6B6B', '#4ECDC4'];

export const AIChartWidget: React.FC<AIChartWidgetProps> = ({ type, data, title }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm my-2 w-full border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300 text-center">{title}</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                    {type === 'bar' ? (
                        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis
                                dataKey="name"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#6B7280' }}
                            />
                            <YAxis
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#6B7280' }}
                                tickFormatter={(value) => `Rp${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                cursor={{ fill: '#F3F4F6' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Bar
                                dataKey="value"
                                fill="#3B82F6"
                                radius={[4, 4, 0, 0]}
                                name="Jumlah"
                            />
                        </BarChart>
                    ) : (
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Legend
                                iconType="circle"
                                layout="vertical"
                                verticalAlign="middle"
                                align="right"
                                wrapperStyle={{ fontSize: '10px' }}
                            />
                        </PieChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
};
