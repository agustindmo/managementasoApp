// src/components/dashboards/UserDashboard.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { getDbPaths } from '../../services/firebase.js';
import { Loader2, TrendingUp, Filter, BarChart2 as SummaryIcon, Building, Briefcase } from 'lucide-react';
import { useTranslation } from '../../context/TranslationContext.jsx';
import { ANO_OPTIONS, ALL_YEAR_FILTER } from '../../utils/constants.js';
import SelectField from '../ui/SelectField.jsx';
import CardTitle from '../ui/CardTitle.jsx';
// --- NUEVO: Importar gráfico ---
import SimpleBarChart from '../charts/SimpleBarChart.jsx';


const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({
        id: key,
        ...val[key],
    }));
};

// Componente de Métrica
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

// --- MODIFICADO: Reemplazado el desglose simple con un gráfico ---
const ChartCard = ({ title, data, icon: Icon, fillColor }) => {
    const { t } = useTranslation();
    
    // Formatear datos para el gráfico
    const chartData = useMemo(() => {
        return Object.keys(data).map(key => ({
            name: key.startsWith('user.institution.') ? t(key) : key, // Traducir claves de institución
            count: data[key]
        }));
    }, [data, t]);

    return (
        <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
            <CardTitle title={title} icon={Icon} />
            <div className="p-4">
                <SimpleBarChart data={chartData} fillColor={fillColor} />
            </div>
        </div>
    );
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

    const { metrics, institutionCounts, instrumentCounts } = useMemo(() => {
        const total = filteredData.length;
        const inProcess = filteredData.filter(item => item.condicion === 'en seguimiento').length;
        const completed = total - inProcess;
        
        const institutions = {};
        const instruments = {};

        filteredData.forEach(item => {
            const instKey = item.institucion || 'N/A';
            const instGroup = (instKey.toLowerCase().includes('ejecutivo') ? 'user.institution.executive' : 
                              instKey.toLowerCase().includes('internacional') ? 'user.institution.international' : 
                              instKey.toLowerCase().includes('legislativo') ? 'user.institution.legislative' : 'user.institution.other');
            
            institutions[instGroup] = (institutions[instGroup] || 0) + 1;
            
            const instrum = item.tipoDeActo || 'N/A';
            instruments[instrum] = (instruments[instrum] || 0) + 1;
        });

        return {
            metrics: { total, inProcess, completed },
            institutionCounts: institutions,
            instrumentCounts: instruments,
        };
    }, [filteredData]);

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
                <h1 className="text-3xl font-bold text-white flex items-center">
                    <SummaryIcon className="w-8 h-8 mr-3 text-sky-400" />
                    {t('user.title')}
                </h1>
                
                <div className="rounded-xl shadow max-w-xs border border-sky-700/50 bg-black/40 backdrop-blur-lg p-2 mt-4 sm:mt-0">
                    <SelectField 
                        label={t('director.filter_year')}
                        name="yearFilter" 
                        options={ANO_OPTIONS} 
                        value={yearFilter} 
                        onChange={(e) => setYearFilter(e.target.value)} 
                    />
                </div>
            </div>

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

            {/* --- MODIFICADO: Gráficos Reales --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <ChartCard 
                    title={t('user.metric.institution_title')}
                    data={institutionCounts}
                    icon={Building}
                    fillColor="#8884d8"
                />
                <ChartCard 
                    title={t('user.metric.instrument_title')}
                    data={instrumentCounts}
                    icon={Briefcase}
                    fillColor="#82ca9d"
                />
            </div>
            
        </div>
    );
};

export default UserDashboardDisplay;