// src/components/charts/RechartsTreemap.jsx

import React from 'react';
import { 
    ResponsiveContainer, 
    Treemap,
    Tooltip
} from 'recharts';
import { useTranslation } from '../../context/TranslationContext.jsx';

// Colores para el Treemap
const COLORS = ['#0ea5e9', '#0284c7', '#0369a1', '#075985', '#0c4a6e', '#082f49', '#38bdf8', '#7dd3fc'];

// Componente de contenido personalizado para el Treemap
const CustomizedTreemapContent = (props) => {
    const { root, depth, x, y, width, height, index, payload, name, size } = props;

    // No renderizar la raíz, solo los hijos
    if (depth === 0) return null;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: COLORS[index % COLORS.length],
                    stroke: '#000',
                    strokeWidth: 2,
                    strokeOpacity: 0.5,
                }}
            />
            {width > 80 && height > 25 ? (
                <text
                    x={x + width / 2}
                    y={y + height / 2 + 7}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={14}
                    fontWeight="bold"
                >
                    {name}
                </text>
            ) : null}
        </g>
    );
};

// Componente principal del Treemap
const RechartsTreemap = ({ data }) => {
    const { t } = useTranslation();

    if (!data || data.length === 0) {
        return <p className="text-gray-500 text-center py-4">{t('agenda.no_data')}</p>;
    }

    return (
        <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
                <Treemap
                    data={data}
                    dataKey="size"
                    ratio={4 / 3}
                    stroke="#fff"
                    fill="#8884d8"
                    content={<CustomizedTreemapContent />}
                >
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                            borderColor: '#0e7490',
                            borderRadius: '8px' 
                        }} 
                        labelStyle={{ color: '#e0f2fe' }}
                        formatter={(value, name) => [value, t('stakeholder.col.total_engagements')]}
                    />
                </Treemap>
            </ResponsiveContainer>
        </div>
    );
};

export default RechartsTreemap;