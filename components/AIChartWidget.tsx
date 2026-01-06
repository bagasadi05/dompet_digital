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

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#6366F1'];

// Custom legend component for better mobile display
const CustomLegend: React.FC<{ data: { name: string; value: number }[]; colors: string[] }> = ({ data, colors }) => {
    const formatValue = (value: number) => {
        if (value >= 1000000) return `Rp${(value / 1000000).toFixed(1)}jt`;
        if (value >= 1000) return `Rp${(value / 1000).toFixed(0)}rb`;
        return `Rp${value}`;
    };

    return (
        <div className="flex flex-wrap justify-center gap-2 mt-3 px-2">
            {data.map((entry, index) => (
                <div
                    key={`legend-${index}`}
                    className="flex items-center gap-1.5 text-xs bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded-full"
                >
                    <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="text-gray-700 dark:text-gray-300 truncate max-w-[80px]">
                        {entry.name}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">
                        {formatValue(entry.value)}
                    </span>
                </div>
            ))}
        </div>
    );
};

export const AIChartWidget: React.FC<AIChartWidgetProps> = ({ type, data, title }) => {
    const formatTooltipValue = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    };

    return (
        <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg my-3 w-full border border-gray-200 dark:border-gray-700/50">
            <h3 className="text-sm font-bold mb-3 text-gray-800 dark:text-gray-200 text-center">
                {title}
            </h3>

            {type === 'bar' ? (
                // Bar Chart
                <div className="h-48 md:h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                            <XAxis
                                dataKey="name"
                                fontSize={9}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#9CA3AF' }}
                                interval={0}
                                angle={-35}
                                textAnchor="end"
                                height={50}
                            />
                            <YAxis
                                fontSize={9}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#9CA3AF' }}
                                tickFormatter={(value) => {
                                    if (value >= 1000000) return `${(value / 1000000).toFixed(0)}jt`;
                                    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                                    return value;
                                }}
                                width={40}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    backdropFilter: 'blur(8px)'
                                }}
                                formatter={(value: number) => [formatTooltipValue(value), 'Jumlah']}
                            />
                            <Bar
                                dataKey="value"
                                fill="url(#barGradient)"
                                radius={[6, 6, 0, 0]}
                                name="Jumlah"
                                maxBarSize={40}
                            />
                            <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3B82F6" />
                                    <stop offset="100%" stopColor="#1D4ED8" />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                // Pie Chart
                <>
                    <div className="h-40 md:h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="45%"
                                    outerRadius="80%"
                                    paddingAngle={3}
                                    dataKey="value"
                                    stroke="none"
                                    animationBegin={0}
                                    animationDuration={800}
                                >
                                    {data.map((_, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            opacity={0.9}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        backdropFilter: 'blur(8px)'
                                    }}
                                    formatter={(value: number) => [formatTooltipValue(value), 'Jumlah']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Custom Legend Below Chart */}
                    <CustomLegend data={data} colors={COLORS} />
                </>
            )}
        </div>
    );
};
