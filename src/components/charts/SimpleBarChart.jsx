// src/components/charts/SimpleBarChart.jsx

import React from 'react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer 
} from 'recharts';
import { useTranslation } from '../../context/TranslationContext.jsx';

// Este componente espera datos en el formato:
// [{ name: 'Ene', count: 10 }, { name: 'Feb', count: 15 }]

const SimpleBarChart = ({ data, dataKey = "count", fillColor = "#8884d8" }) => {
    const { t } = useTranslation();

    if (!data || data.length === 0) {
        return <p className="text-gray-500 text-center py-4">{t('agenda.no_data')}</p>;
    }

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart
                    data={data}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                        dataKey="name" 
                        stroke="#9ca3af" 
                        fontSize={12} 
                        tick={{ fill: '#9ca3af' }} 
                    />
                    <YAxis 
                        stroke="#9ca3af" 
                        fontSize={12} 
                        tick={{ fill: '#9ca3af' }} 
                        allowDecimals={false} 
                    />
                    <Tooltip 
                        cursor={{ fill: 'rgba(14, 116, 144, 0.2)' }}
                        contentStyle={{ 
                            backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                            borderColor: '#0e7490',
                            borderRadius: '8px' 
                        }} 
                        labelStyle={{ color: '#e0f2fe' }}
                    />
                    <Bar dataKey={dataKey} fill={fillColor} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SimpleBarChart;