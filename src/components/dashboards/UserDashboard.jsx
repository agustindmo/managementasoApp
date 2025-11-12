// src/components/dashboards/UserDashboard.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { getDbPaths } from '../../services/firebase.js';
import { Loader2, TrendingUp, Filter, BarChart2 as SummaryIcon, Building, Briefcase, Users2 } from 'lucide-react'; 
// --- Recharts components imported for the new chart ---
import { 
    ResponsiveContainer, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip 
} from 'recharts';
import { useTranslation } from '../../context/TranslationContext.jsx';
import { ANO_OPTIONS, ALL_YEAR_FILTER } from '../../utils/constants.js';
import SelectField from '../ui/SelectField.jsx';
import CardTitle from '../ui/CardTitle.jsx';
import SimpleBarChart from '../charts/SimpleBarChart.jsx';
import SimplePieChart from '../charts/SimplePieChart.jsx'; 

const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({
        id: key,
        ...val[key],
    }));
};

// Componente de Métrica (RESTORED)
const MetricCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className={`p-4 rounded-2xl border ${colorClass.border} ${colorClass.bg} shadow-2xl backdrop-blur-lg flex items-center space-x-4`}>
        <div className={`p-3 rounded-full ${colorClass.iconBg}`}>
            <Icon className={`w-6 h-6 ${colorClass.text}`} />
        </div>
        <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

// --- Custom Tooltip for Recharts ---
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-gray-800 border border-gray-700 rounded-md shadow-lg">
                <p className="text-white font-semibold">{label}</p>
                <p className="text-sky-400">{`Count: ${payload[0].value}`}</p>
            </div>
        );
    }
    return null;
};

const UserDashboardDisplay = ({ db }) => {
    const { t } = useTranslation();
    const [agendaItems, setAgendaItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [yearFilter, setYearFilter] = useState(ALL_YEAR_FILTER);
    
    // 1. Fetch data
    useEffect(() => {
        if (!db) return;
        
        const agendaRef = ref(db, getDbPaths().agenda);
        const unsubscribe = onValue(agendaRef, (snapshot) => {
            try {
                const items = snapshotToArray(snapshot);
                setAgendaItems(items);
            } catch (e) { console.error("Agenda fetch error:", e); }
            finally { setIsLoading(false); }
        }, (error) => { console.error("Agenda Subscription Error:", error); setIsLoading(false); });
        
        return () => unsubscribe();
    }, [db]);

    // 2. Filter and Process data
    const filteredData = useMemo(() => {
        if (yearFilter === ALL_YEAR_FILTER) return agendaItems;
        return agendaItems.filter(item => item.ano === yearFilter);
    }, [agendaItems, yearFilter]);

    const { metrics, institutionCounts, instrumentCounts, sectorCounts } = useMemo(() => {
        const totalAgendaItemsCount = filteredData.length;
        const inProcess = filteredData.filter(item => item.condicion === 'en seguimiento').length;
        const completed = totalAgendaItemsCount - inProcess;
        
        const institutions = {}; 
        const instruments = {};
        const sectors = {}; 

        filteredData.forEach(item => {
            
            // INSTITUTION LOGIC: Counting specific names
            const instKey = item.institucion || 'N/A';
            if (instKey.trim() !== '') {
                institutions[instKey.trim()] = (institutions[instKey.trim()] || 0) + 1;
            }
            
            // Instrument Logic 
            const instrum = item.tipoDeActo || 'N/A';
            instruments[instrum] = (instruments[instrum] || 0) + 1;
            
            // Sector Logic 
            const sectorKey = item.sector || 'N/A';
            if (sectorKey.trim() !== '') {
                sectors[sectorKey.trim()] = (sectors[sectorKey.trim()] || 0) + 1;
            }
        });

        return {
            metrics: { total: totalAgendaItemsCount, inProcess, completed }, 
            institutionCounts: institutions,
            instrumentCounts: instruments,
            sectorCounts: sectors, 
        };
    }, [filteredData]);

    // Data conversion for charts
    const sectorChartData = useMemo(() => 
        Object.entries(sectorCounts).map(([name, count]) => ({ name, count }))
    , [sectorCounts]);

    const instrumentChartData = useMemo(() => 
        Object.entries(instrumentCounts).map(([name, count]) => ({ name, count }))
    , [instrumentCounts]);
    
    // --- Data conversion for the new Institution Chart ---
    const institutionChartData = useMemo(() => 
        Object.entries(institutionCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => a.count - b.count) // Sort ascending for horizontal chart
    , [institutionCounts]);

    
    // ... Loading UI ...
    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="ml-3 text-sky-200">{t('director.loading')}</p>
            </div>
        );
    }


    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-3xl font-bold text-white flex items-center mb-4 sm:mb-0">
                    <SummaryIcon className="w-8 h-8 mr-3 text-sky-400" />
                    {t('user.title')}
                </h1>
                
                {/* Header Filter (Position fix) */}
                <div className="rounded-xl shadow w-full sm:max-w-xs border border-sky-700/50 bg-black/40 backdrop-blur-lg p-2 flex-shrink-0"> 
                    <SelectField 
                        label={t('director.filter_year')}
                        name="yearFilter" 
                        options={ANO_OPTIONS} 
                        value={yearFilter} 
                        onChange={(e) => setYearFilter(e.target.value)} 
                    />
                </div>
            </div>

            {/* Metric Cards (RESTORED) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <MetricCard 
                    title={t('user.metric.projects')}
                    value={metrics.total}
                    icon={TrendingUp}
                    colorClass={{
                        border: 'border-sky-700/50',
                        bg: 'bg-black/40',
                        iconBg: 'bg-sky-800/50',
                        text: 'text-sky-400'
                    }}
                />
                <MetricCard 
                    title={t('user.metric.in_process_title')}
                    value={metrics.inProcess}
                    icon={TrendingUp}
                    colorClass={{
                        border: 'border-green-700/50',
                        bg: 'bg-black/40',
                        iconBg: 'bg-green-800/50',
                        text: 'text-green-400'
                    }}
                />
                <MetricCard 
                    title={t('user.metric.monitoring_title')}
                    value={metrics.completed}
                    icon={TrendingUp}
                    colorClass={{
                        border: 'border-gray-700/50',
                        bg: 'bg-black/40',
                        iconBg: 'bg-gray-800/50',
                        text: 'text-gray-400'
                    }}
                />
            </div>

            {/* Charts (With final spacing fix for Pie Chart) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                {/* --- 1. Institution Distribution (IMPROVED WITH RECHARTS) --- */}
                <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden h-96 flex flex-col">
                    <CardTitle title={t('user.metric.institution_title')} icon={Building} />
                    <div className="p-4 flex-1">
                        {institutionChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={institutionChartData}
                                    layout="vertical"
                                    margin={{ top: 0, right: 10, left: 30, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                                    <XAxis 
                                        type="number" 
                                        stroke="#9ca3af" 
                                        allowDecimals={false} 
                                        tick={{ fontSize: 12, fill: '#9ca3af' }} 
                                    />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        stroke="#9ca3af"
                                        width={100} // Adjust width for labels
                                        tick={{ fontSize: 12, fill: '#e5e7eb' }}
                                        tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value} // Truncate long labels
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} />
                                    <Bar dataKey="count" fill="#0ea5e9" barSize={15} radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (<p className="text-gray-500 text-center">{t('user.no_data') || 'No data available.'}</p>)}
                    </div>
                </div>

                {/* 2. Instrument Title (Standard Bar Chart) */}
                <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden h-96">
                    <CardTitle title={t('user.metric.instrument_title')} icon={Briefcase} />
                    <div className="p-4">
                        <SimpleBarChart data={instrumentChartData} fillColor="#82ca9d" />
                    </div>
                </div>

                {/* 3. Sector Distribution (Pie Chart - Label Overlap Fix Applied) */}
                <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden h-96 flex flex-col">
                    <CardTitle title={t('user.metric.sector_distribution')} icon={Users2} />
                    <div className="p-4 pt-8 pb-8 flex-1 flex items-center justify-center">
                        {sectorChartData.length > 0 ? (
                            <SimplePieChart 
                                data={sectorChartData} 
                                margin={{ top: 20, right: 20, bottom: 20, left: 20 }} 
                                legendProps={{ 
                                    verticalAlign: "bottom", 
                                    align: "center",
                                    wrapperStyle: { paddingBottom: '10px' }
                                }}
                            />
                        ) : (<p className="text-gray-500 text-center">{t('user.no_data') || 'No data available.'}</p>)}
                    </div>
                </div>
            </div>
            
        </div>
    );
};

export default UserDashboardDisplay;