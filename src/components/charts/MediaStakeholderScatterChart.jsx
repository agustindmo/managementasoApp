// src/components/charts/MediaStakeholderScatterChart.jsx

import React, { useMemo } from 'react';
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Label
} from 'recharts';
import { useTranslation } from '../../context/TranslationContext.jsx';
import { POSITION_SCORE_MAP } from '../../utils/constants.js';

// --- Mapeos para el gráfico ---

// Mapeo de Alcance (X-Axis)
const SCOPE_SCORE_MAP = {
    'Local': 1,
    'Province': 2,
    'National': 3,
    'International': 4,
};
const SCOPE_TICKS = [
    { value: 1, labelKey: 'stakeholder.scope.local' },
    { value: 2, labelKey: 'stakeholder.scope.province' },
    { value: 3, labelKey: 'stakeholder.scope.national' },
    { value: 4, labelKey: 'stakeholder.scope.international' },
];

// Mapeo de Posición (Y-Axis) - se usa POSITION_SCORE_MAP para el valor
const POSITION_TICKS = [
    { value: 1, labelKey: 'stakeholder.position.against' },
    { value: 2, labelKey: 'stakeholder.position.neutral' },
    { value: 3, labelKey: 'stakeholder.position.in_favor' },
];

// Mapeo de Colores
const POSITION_FILL_MAP = {
    'stakeholder.position.in_favor': '#22c55e', // green
    'stakeholder.position.neutral': '#9ca3af', // gray
    'stakeholder.position.against': '#ef4444', // red
};

// --- Tooltip Personalizado ---
const CustomTooltip = ({ active, payload, t }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="p-3 bg-gray-800 border border-gray-700 rounded-md shadow-lg text-sm">
                <p className="font-bold text-white mb-1">{data.name}</p>
                <p className="text-sky-400">{`${t('stakeholder.chart.scope_axis')}: ${t(data.scopeLabel)}`}</p>
                <p className="text-sky-400">{`${t('stakeholder.chart.position_axis')}: ${t(data.positionLabel)}`}</p>
            </div>
        );
    }
    return null;
};

// --- Componente Principal del Gráfico ---
const MediaStakeholderScatterChart = ({ data, t }) => {

    const chartData = useMemo(() => {
        return data.map(item => {
            const position = item.position || 'stakeholder.position.neutral';
            const scope = item.scope || 'Local';

            return {
                name: item.name,
                x: SCOPE_SCORE_MAP[scope] || 1,
                y: POSITION_SCORE_MAP[position] || 2,
                fill: POSITION_FILL_MAP[position] || '#9ca3af',
                scopeLabel: SCOPE_TICKS.find(t => t.value === (SCOPE_SCORE_MAP[scope] || 1))?.labelKey || 'N/A',
                positionLabel: position,
            };
        });
    }, [data]);

    const scopeTickFormatter = (value) => {
        const tick = SCOPE_TICKS.find(t => t.value === value);
        return tick ? t(tick.labelKey) : '';
    };
    
    const positionTickFormatter = (value) => {
        const tick = POSITION_TICKS.find(t => t.value === value);
        return tick ? t(tick.labelKey) : '';
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
                margin={{
                    top: 20,
                    right: 40,
                    bottom: 40,
                    left: 40,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                
                <XAxis 
                    type="number" 
                    dataKey="x" 
                    name={t('stakeholder.chart.scope_axis')} 
                    domain={[0.5, 4.5]}
                    ticks={SCOPE_TICKS.map(t => t.value)}
                    tickFormatter={scopeTickFormatter}
                    stroke="#9ca3af"
                    tick={{ fontSize: 12, fill: '#e5e7eb' }}
                >
                    <Label value={t('stakeholder.chart.scope_axis')} offset={-25} position="insideBottom" fill="#9ca3af" />
                </XAxis>
                
                <YAxis 
                    type="number" 
                    dataKey="y" 
                    name={t('stakeholder.chart.position_axis')}
                    domain={[0.5, 3.5]}
                    ticks={POSITION_TICKS.map(t => t.value)}
                    tickFormatter={positionTickFormatter}
                    stroke="#9ca3af"
                    tick={{ fontSize: 12, fill: '#e5e7eb' }}
                >
                     <Label value={t('stakeholder.chart.position_axis')} angle={-90} offset={-25} position="insideLeft" fill="#9ca3af" />
                </YAxis>
                
                <Tooltip 
                    cursor={{ strokeDasharray: '3 3', stroke: '#555' }} 
                    content={<CustomTooltip t={t} />} 
                />
                
                <Scatter 
                    name="Media Stakeholders" 
                    data={chartData} 
                    shape="circle"
                />
            </ScatterChart>
        </ResponsiveContainer>
    );
};

export default MediaStakeholderScatterChart;