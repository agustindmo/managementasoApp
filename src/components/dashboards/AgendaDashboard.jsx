// src/components/dashboards/AgendaDashboard.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { getDbPaths } from '../../services/firebase.js';
import { Users, Building, Target, Loader2, Table, BarChart2, ListChecks, Layers, Briefcase, Search, Globe } from 'lucide-react'; 
import { useTranslation } from '../../context/TranslationContext.jsx';
import CardTitle from '../ui/CardTitle.jsx';
import SelectField from '../ui/SelectField.jsx'; 
import InputField from '../ui/InputField.jsx'; 
import SimplePieChart from '../charts/SimplePieChart.jsx';
import SimpleBarChart from '../charts/SimpleBarChart.jsx';
import RechartsTreemap from '../charts/RechartsTreemap.jsx'; 

// --- Componente ChartContainer ---
const ChartContainer = ({ title, icon, children }) => (
    <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden h-96 flex flex-col"> 
        <CardTitle title={title} icon={icon || BarChart2} />
        <div className="p-4 flex-1 flex items-center justify-center">
            {children}
        </div>
    </div>
);


const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({
        id: key,
        ...val[key],
    }));
};

// --- Component: AgendaTable (Includes Per-Column Search/Filter Placeholders) ---
const AgendaTable = ({ items, t }) => (
    <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
        <div className="p-4 max-h-96 overflow-y-auto no-scrollbar">
            <table className="min-w-full divide-y divide-sky-800/50">
                <thead className="bg-sky-900/70 sticky top-0">
                    {/* Column Headers */}
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider">{t('agenda.name_header') || 'Name'}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider">{t('agenda.institution_header') || 'Institution'}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider">{t('agenda.sector_header') || 'Sector'}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider">{t('agenda.condition_header') || 'Condition'}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider">{t('agenda.act_type_header') || 'Act Type'}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider">{t('agenda.pilar_header') || 'Pilar'}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider">{t('agenda.scope_header') || 'Scope'}</th>
                    </tr>
                    
                    {/* Per-Column Search/Filter Row (Placeholders) */}
                    <tr className="bg-sky-900/50">
                        {/* Search Input for Name */}
                        <th className="px-2 py-1"><InputField placeholder="Search name" isCompact={true} /></th>
                        {/* Select Fields for other columns */}
                        <th className="px-2 py-1"><SelectField options={[{ value: '', label: 'All' }]} isCompact={true} /></th>
                        <th className="px-2 py-1"><SelectField options={[{ value: '', label: 'All' }]} isCompact={true} /></th>
                        <th className="px-2 py-1"><SelectField options={[{ value: '', label: 'All' }]} isCompact={true} /></th>
                        <th className="px-2 py-1"><SelectField options={[{ value: '', label: 'All' }]} isCompact={true} /></th>
                        <th className="px-2 py-1"><SelectField options={[{ value: '', label: 'All' }]} isCompact={true} /></th>
                        <th className="px-2 py-1"><SelectField options={[{ value: '', label: 'All' }]} isCompact={true} /></th>
                    </tr>
                </thead>
                <tbody className="bg-sky-950/50 divide-y divide-sky-800/50">
                    {items.length > 0 ? (
                        items.map((item) => (
                            <tr key={item.id} className="hover:bg-sky-900/60">
                                <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-white">{item.nombre || 'N/A'}</td>
                                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-300">{item.institucion || 'N/A'}</td>
                                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-300">{item.sector || 'N/A'}</td>
                                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-300">{item.condicion || 'N/A'}</td>
                                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-300">{item.tipoDeActo || 'N/A'}</td>
                                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-300">{item.pilar || 'N/A'}</td>
                                <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-300">{item.agenda || 'N/A'}</td> {/* USED item.agenda for Scope */}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7" className="px-6 py-4 text-center text-gray-500">{t('agenda.no_items') || 'No agenda items found.'}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

const AgendaDashboardDisplay = ({ db }) => {
    const { t } = useTranslation();
    const [agendaItems, setAgendaItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('sector'); 
    
    // 1. Fetch data (unchanged)
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

    // 2. Data Processing for all Charts (MODIFIED to use item.agenda for Scope)
    const { 
        sectorChartData, institutionChartData, 
        actTypeChartData, conditionChartData, pilarChartData, scopeChartData 
    } = useMemo(() => {
        
        const counts = { institutions: {}, sectors: {}, actTypes: {}, conditions: {}, pilars: {}, scopes: {} };

        agendaItems.forEach(item => {
            const safeTrim = (key) => (item[key] || '').trim();

            const instKey = safeTrim('institucion');
            if (instKey !== '') { counts.institutions[instKey] = (counts.institutions[instKey] || 0) + 1; }
            
            const sectorKey = safeTrim('sector');
            if (sectorKey !== '') { counts.sectors[sectorKey] = (counts.sectors[sectorKey] || 0) + 1; }
            
            const actTypeKey = safeTrim('tipoDeActo');
            if (actTypeKey !== '') { counts.actTypes[actTypeKey] = (counts.actTypes[actTypeKey] || 0) + 1; }

            const conditionKey = safeTrim('condicion');
            if (conditionKey !== '') { counts.conditions[conditionKey] = (counts.conditions[conditionKey] || 0) + 1; }
            
            const pilarKey = safeTrim('pilar');
            if (pilarKey !== '') { counts.pilars[pilarKey] = (counts.pilars[pilarKey] || 0) + 1; }

            // NEW: Scope Counts (using the 'agenda' field which contains National/International)
            const agendaScopeKey = safeTrim('agenda'); 
            if (agendaScopeKey !== '') { counts.scopes[agendaScopeKey] = (counts.scopes[agendaScopeKey] || 0) + 1; }
        });

        const chartDataFormatter = (data) => Object.entries(data).map(([name, count]) => ({ name, count, value: count }));
        
        return { 
            sectorChartData: chartDataFormatter(counts.sectors),
            institutionChartData: chartDataFormatter(counts.institutions),
            actTypeChartData: chartDataFormatter(counts.actTypes),
            conditionChartData: chartDataFormatter(counts.conditions),
            pilarChartData: chartDataFormatter(counts.pilars),
            scopeChartData: chartDataFormatter(counts.scopes), // Now derived from item.agenda
        };
    }, [agendaItems]);


    const renderChart = () => {
        const defaultNoData = <p className="text-gray-500">{t('agenda.no_chart_data') || 'No chart data available.'}</p>;
        
        switch (activeTab) {
            case 'sector':
                return (
                    <ChartContainer title={t('agenda.sector_distribution') || 'Sector Distribution'} icon={Users}>
                        {sectorChartData.length > 0 ? (
                            <SimplePieChart data={sectorChartData} />
                        ) : defaultNoData}
                    </ChartContainer>
                );
            case 'institution':
                return (
                    <ChartContainer title={t('agenda.institution_breakdown') || 'Institution Breakdown'} icon={Building}>
                        {institutionChartData.length > 0 ? (
                            <SimpleBarChart data={institutionChartData} fillColor="#00C49F" />
                        ) : defaultNoData}
                    </ChartContainer>
                );
            case 'act_type':
                return (
                    <ChartContainer title={t('agenda.act_type_distribution') || 'Act Type Distribution'} icon={Briefcase}>
                        {actTypeChartData.length > 0 ? (
                            <RechartsTreemap 
                                data={actTypeChartData} 
                                dataKey="value" 
                            />
                        ) : defaultNoData}
                    </ChartContainer>
                );
            case 'condition':
                return (
                    <ChartContainer title={t('agenda.condition_distribution') || 'Condition Distribution'} icon={ListChecks}>
                        {conditionChartData.length > 0 ? (
                            <SimplePieChart data={conditionChartData} />
                        ) : defaultNoData}
                    </ChartContainer>
                );
            case 'pilar':
                return (
                    <ChartContainer title={t('agenda.pilar_distribution') || 'Pilar Distribution'} icon={Layers}>
                        {pilarChartData.length > 0 ? (
                            <SimpleBarChart data={pilarChartData} fillColor="#FFBB28" />
                        ) : defaultNoData}
                    </ChartContainer>
                );
            case 'scope': 
                return (
                    <ChartContainer title={t('agenda.scope_distribution') || 'Scope Distribution'} icon={Globe}>
                        {scopeChartData.length > 0 ? (
                            <SimplePieChart data={scopeChartData} /> 
                        ) : defaultNoData}
                    </ChartContainer>
                );
            default:
                return (
                    <p className="text-gray-500 p-8">{t('agenda.select_chart') || 'Select a chart tab above.'}</p>
                );
        }
    };

    const TabButton = ({ tabId, label, icon: Icon }) => (
        <button
            className={`px-4 py-2 flex items-center space-x-2 text-sm font-medium rounded-t-lg transition-colors duration-200 ${
                activeTab === tabId 
                ? 'bg-black/40 text-sky-400 border-b-2 border-sky-400' 
                : 'bg-transparent text-gray-400 hover:text-white hover:bg-sky-900/30'
            }`}
            onClick={() => setActiveTab(tabId)}
        >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
        </button>
    );


    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="ml-3 text-sky-200">{t('director.loading')}</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <header className="flex items-center mb-6">
                <h1 className="text-3xl font-bold text-white flex items-center">
                    <Target className="w-8 h-8 mr-3 text-sky-400" />
                    {t('agenda.title') || 'Agenda Dashboard'}
                </h1>
            </header>

            {/* 1. Full Agenda Table (With Filter/Search UI RESTORED) */}
            <h2 className="text-xl font-semibold text-white mb-4">{t('agenda.full_list') || 'Agenda Full List'}</h2>
            
            <div className="mb-8">
                <AgendaTable items={agendaItems} t={t} />
            </div>

            {/* 2. Charts Accessible via Tabs */}
            <h2 className="text-xl font-semibold text-white mb-4">{t('agenda.analytics') || 'Agenda Analytics'}</h2>
            
            <div className="flex flex-wrap gap-x-1 border-b border-sky-700/50 mb-6">
                <TabButton 
                    tabId="sector" 
                    label={t('agenda.sector') || 'Sector'}
                    icon={Users} 
                />
                <TabButton 
                    tabId="institution" 
                    label={t('agenda.institutions') || 'Institutions'}
                    icon={Building} 
                />
                <TabButton 
                    tabId="act_type" 
                    label={t('agenda.act_type') || 'Act Type'}
                    icon={Briefcase} 
                />
                <TabButton 
                    tabId="condition" 
                    label={t('agenda.condition') || 'Condition'}
                    icon={ListChecks} 
                />
                <TabButton 
                    tabId="pilar" 
                    label={t('agenda.pilar') || 'Pilar'}
                    icon={Layers} 
                />
                <TabButton 
                    tabId="scope" 
                    label={t('agenda.scope') || 'Scope'}
                    icon={Globe} 
                />
            </div>
            
            <div className="mb-8">
                {renderChart()}
            </div>
            
        </div>
    );
};

export default AgendaDashboardDisplay;