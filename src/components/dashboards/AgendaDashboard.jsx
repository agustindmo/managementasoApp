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

const ChartContainer = ({ title, icon, children }) => (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden h-96 flex flex-col"> 
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

const AgendaTable = ({ items, t }) => (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="p-0 max-h-96 overflow-y-auto no-scrollbar">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('agenda.name_header') || 'Name'}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('agenda.institution_header') || 'Institution'}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('agenda.sector_header') || 'Sector'}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('agenda.condition_header') || 'Condition'}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('agenda.act_type_header') || 'Act Type'}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('agenda.pilar_header') || 'Pilar'}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('agenda.scope_header') || 'Scope'}</th>
                    </tr>
                    
                    <tr className="bg-white border-b border-gray-200">
                        <th className="px-2 py-2"><InputField placeholder="Search" icon={Search} /></th>
                        <th className="px-2 py-2"><SelectField options={[{ value: '', label: 'All' }]} /></th>
                        <th className="px-2 py-2"><SelectField options={[{ value: '', label: 'All' }]} /></th>
                        <th className="px-2 py-2"><SelectField options={[{ value: '', label: 'All' }]} /></th>
                        <th className="px-2 py-2"><SelectField options={[{ value: '', label: 'All' }]} /></th>
                        <th className="px-2 py-2"><SelectField options={[{ value: '', label: 'All' }]} /></th>
                        <th className="px-2 py-2"><SelectField options={[{ value: '', label: 'All' }]} /></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {items.length > 0 ? (
                        items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.nombre || 'N/A'}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">{item.institucion || 'N/A'}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">{item.sector || 'N/A'}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${item.condicion === 'finalizado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {item.condicion || 'N/A'}
                                    </span>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">{item.tipoDeActo || 'N/A'}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">{item.pilar || 'N/A'}</td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">{item.agenda || 'N/A'}</td> 
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
            scopeChartData: chartDataFormatter(counts.scopes), 
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
                            <SimpleBarChart data={institutionChartData} fillColor="#0ea5e9" />
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
                            <SimpleBarChart data={pilarChartData} fillColor="#f59e0b" />
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
                ? 'bg-white text-sky-600 border-b-2 border-sky-600' 
                : 'bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
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
                <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
                <p className="ml-3 text-gray-500">{t('director.loading')}</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <header className="flex items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <Target className="w-8 h-8 mr-3 text-sky-600" />
                    {t('agenda.title') || 'Agenda Dashboard'}
                </h1>
            </header>

            <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('agenda.full_list') || 'Agenda Full List'}</h2>
            
            <div className="mb-8">
                <AgendaTable items={agendaItems} t={t} />
            </div>

            <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('agenda.analytics') || 'Agenda Analytics'}</h2>
            
            <div className="flex flex-wrap gap-x-1 border-b border-gray-200 mb-6 overflow-x-auto">
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