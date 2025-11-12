// src/components/charts/SimplePieChart.jsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6666']; // Example colors

// Modify SimplePieChart to accept a legend configuration prop
const SimplePieChart = ({ data, margin, legendProps }) => { // ADDED legendProps
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart margin={margin || { top: 0, right: 0, bottom: 0, left: 0 }}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80} // Adjust outer radius if needed to make space for labels
          fill="#8884d8"
          dataKey="count"
          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend 
            // Apply passed legendProps or default to bottom center
            verticalAlign={legendProps?.verticalAlign || "bottom"} 
            align={legendProps?.align || "center"} 
            wrapperStyle={legendProps?.wrapperStyle || { paddingTop: '10px' }} // Add some padding above the legend
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default SimplePieChart;