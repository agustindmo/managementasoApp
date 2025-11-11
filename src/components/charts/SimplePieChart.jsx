// src/components/charts/SimplePieChart.jsx

import React from 'react';
import { 
    PieChart, 
    Pie, 
    Cell, 
    ResponsiveContainer, 
    Tooltip,
    Legend
} from 'recharts';
import { useTranslation } from '../../context/TranslationContext.jsx';

// Data debe estar en formato [{ name: '...', count: ... }]
const COLORS = ['#0ea5e9', '#0284c7', '#0369a1', '#075985', '#0c4a6e'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // No mostrar etiquetas para segmentos muy pequeños

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight="bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const SimplePieChart = ({ data }) => {
    const { t } = useTranslation();

    if (!data || data.length === 0) {
        return <p className="text-gray-500 text-center py-4">{t('agenda.no_data')}</p>;
    }

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="name"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                            borderColor: '#0e7490',
                            borderRadius: '8px' 
                        }} 
                        labelStyle={{ color: '#e0f2fe' }}
                    />
                    <Legend 
                        layout="vertical" 
                        align="right" 
                        verticalAlign="middle"
                        wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SimplePieChart;