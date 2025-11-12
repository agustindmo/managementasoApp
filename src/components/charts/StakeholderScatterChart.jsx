// src/components/charts/StakeholderScatterChart.jsx

import React from 'react';
import { 
    ScatterChart, 
    Scatter, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer 
} from 'recharts';
import { useTranslation } from '../../context/TranslationContext.jsx';

// --- Recharts Configuration ---
const SCATTER_COLOR = '#38bdf8'; // Sky Blue for points

/**
 * Renders a responsive Recharts Scatter Chart for a 2x2 Stakeholder Matrix.
 * * Data format expected: [{ id: '123', name: 'Stakeholder Name', x: 4, y: 3 }]
 * X-Axis: Represents one score (e.g., Influence, 1-4)
 * Y-Axis: Represents another score (e.g., Position/Interest, 1-3 or 1-4)
 */
const StakeholderScatterChart = ({ data, xAxisLabel = 'Influence', yAxisLabel = 'Position' }) => {
    const { t } = useTranslation();

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <p className="text-gray-500 text-center text-sm">
                    {t('stakeholder.no_chart_data') || 'No stakeholder map data available.'}
                </p>
            </div>
        );
    }

    // Custom Tooltip to show the stakeholder name and coordinates
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const pointData = payload[0].payload;
            return (
                <div className="p-2 border border-sky-700/50 bg-black/80 rounded-lg text-sm text-white shadow-xl">
                    <p className="font-semibold text-sky-300">{pointData.name}</p>
                    <p>{`${xAxisLabel}: ${pointData.x}`}</p>
                    <p>{`${yAxisLabel}: ${pointData.y}`}</p>
                </div>
            );
        }
        return null;
    };


    return (
        <ResponsiveContainer width="100%" height="100%">
            <ScatterChart 
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
                {/* Quadrant Visuals (CartesianGrid) */}
                <CartesianGrid 
                    stroke="#334155" 
                    strokeDasharray="3 3"
                    // Add lines at the mid-point (e.g., 2.5) to define the quadrants
                    verticalFill={['#0f172a', '#1e293b']} // Subtle column shading
                    horizontalFill={['#1e293b', '#0f172a']} // Subtle row shading
                />

                {/* X-Axis (Influence/Role Score) */}
                <XAxis 
                    type="number" 
                    dataKey="x" 
                    name={xAxisLabel} 
                    domain={[1, 4]} // Assuming scores range from 1 to 4
                    allowDecimals={false}
                    interval={0}
                    tickCount={4} 
                    stroke="#94a3b8"
                    axisLine={{ stroke: '#334155' }}
                    label={{ value: xAxisLabel, position: 'bottom', stroke: '#94a3b8', dy: 10 }}
                />

                {/* Y-Axis (Position/Interest Score) */}
                <YAxis 
                    type="number" 
                    dataKey="y" 
                    name={yAxisLabel} 
                    domain={[1, 4]} // Assuming scores range from 1 to 4
                    allowDecimals={false}
                    interval={0}
                    tickCount={4} 
                    stroke="#94a3b8"
                    axisLine={{ stroke: '#334155' }}
                    label={{ value: yAxisLabel, position: 'left', angle: -90, stroke: '#94a3b8', dx: -10 }}
                />
                
                <Tooltip cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }} content={<CustomTooltip />} />
                
                <Scatter 
                    name="Stakeholders" 
                    data={data} 
                    fill={SCATTER_COLOR} 
                    line={false} // No line connecting points
                    shape="circle" 
                    strokeWidth={2}
                    // Size the dots based on an optional third variable (e.g., size) if data is modified to include it.
                />
            </ScatterChart>
        </ResponsiveContainer>
    );
};

export default StakeholderScatterChart;