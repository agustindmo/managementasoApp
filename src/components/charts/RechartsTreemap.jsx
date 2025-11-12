// src/components/charts/RechartsTreemap.jsx

import React from 'react';
import { 
    ResponsiveContainer, 
    Treemap,
    Tooltip
} from 'recharts';
import { useTranslation } from '../../context/TranslationContext.jsx';

// --- MODIFIED: Diverse, High-Contrast Colors ---
const COLORS = [
    '#38bdf8', // Sky Blue
    '#06b6d4', // Cyan
    '#4ade80', // Green
    '#facc15', // Yellow
    '#fb923c', // Orange
    '#f43f5e', // Rose
    '#8b5cf6', // Violet
    '#64748b', // Slate
];

// Componente de contenido personalizado para el Treemap
const CustomizedTreemapContent = (props) => {
    const { root, depth, x, y, width, height, index, payload, name, value } = props; 
    const size = value; 

    // Do not render the root or boxes too small to contain anything
    if (depth === 0 || width < 25 || height < 15) return null;

    // --- Dynamic Font Size and Truncation Logic (Kept from previous fix) ---
    const NAME_CHAR_RATIO = 0.6; 
    const PADDING = 10;
    
    const maxFontSizeWidth = (width - PADDING) / (name.length * NAME_CHAR_RATIO);
    const maxFontSizeHeight = (height - PADDING) / 2; 

    const calculatedFontSize = Math.min(12, maxFontSizeWidth, maxFontSizeHeight); 
    const finalFontSize = Math.max(8, calculatedFontSize); 
    
    // Truncate name
    let displayName = name;
    if (finalFontSize < 12) {
        const maxChars = Math.floor((width - PADDING) / (finalFontSize * NAME_CHAR_RATIO));
        if (name.length > maxChars && maxChars > 5) {
            displayName = name.substring(0, maxChars - 2) + '...';
        } else if (name.length > maxChars && maxChars <= 5) {
            displayName = name.substring(0, maxChars);
        }
    }

    // Height calculation for rendering
    const nameY = y + height / 2 - (finalFontSize / 2);
    const valueY = y + height / 2 + (finalFontSize * 0.8);
    const renderCount = height > 40; 

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: COLORS[index % COLORS.length], // Uses diverse COLORS
                    stroke: '#000',
                    strokeWidth: 2,
                    strokeOpacity: 0.5,
                }}
            />
            {/* Stakeholder Name (Primary Label) */}
            <text
                x={x + width / 2}
                y={nameY}
                textAnchor="middle"
                fill="#fff"
                fontSize={finalFontSize}
                fontWeight="500" // MODIFIED: Lighter font weight for better readability
            >
                {displayName}
            </text>
            
            {/* Engagement Count (Secondary Label) */}
            {renderCount ? ( 
                <text
                    x={x + width / 2}
                    y={valueY} 
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={Math.max(8, finalFontSize * 0.8)} 
                    opacity={0.8}
                >
                    ({size})
                </text>
            ) : null}
        </g>
    );
};

// Componente principal del Treemap
const RechartsTreemap = ({ data }) => {
    const { t } = useTranslation();

    if (!data || data.length === 0) {
        return <p className="text-gray-500 text-center py-4">{t('agenda.no_data') || 'No data available.'}</p>;
    }

    return (
        <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
                <Treemap
                    data={data}
                    dataKey="value"
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
                        formatter={(value, name) => [value, t('stakeholder.col.total_engagements') || 'Total Engagements']}
                    />
                </Treemap>
            </ResponsiveContainer>
        </div>
    );
};

export default RechartsTreemap;