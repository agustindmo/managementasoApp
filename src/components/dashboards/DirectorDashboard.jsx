// src/components/dashboards/DirectorDashboard.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { Briefcase, BarChart2, DollarSign, LayoutList, Loader2, CheckCircle, Users } from 'lucide-react';
import CardTitle from '../ui/CardTitle.jsx';
import SelectField from '../ui/SelectField.jsx'; 
import { getDbPaths } from '../../services/firebase.js';
import { ANO_OPTIONS, ALL_YEAR_FILTER } from '../../utils/constants.js'; 
import { ref, onValue } from 'firebase/database'; 
import { useTranslation } from '../../context/TranslationContext.jsx'; 
import SimplePieChart from '../charts/SimplePieChart.jsx'; // NEW IMPORT

// --- Componentes de Visualización (Estilo Oscuro) ---

// --- MODIFIED Component: DashboardMetric (Summary Cards) ---
const DashboardMetric = ({ value, label, color = 'text-sky-400', icon: Icon }) => (
    // New layout: Aligned content with prominent icon/color
    <div className="p-4 rounded-xl shadow-lg flex items-center justify-between border border-sky-700/50 bg-sky-950/50 transition-all hover:bg-sky-950/70">
        <div className="flex flex-col space-y-1">
            <p className="text-sm text-gray-400 font-medium">{label}</p>
            <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
        </div>
        
        {/* Prominent Icon Area */}
        <div className={`p-3 rounded-full ${color.replace('text', 'bg')} opacity-80 shadow-md`}>
             <Icon className={`w-6 h-6 text-white`} />
        </div>
    </div>
);

// --- MODIFIED Component: ActTypeCard (Breakdown Counters) ---
const ActTypeCard = ({ title, count }) => (
    // New layout: Clearer background and title hierarchy
    <div className="p-3 rounded-xl border border-sky-700/50 bg-black/40 flex flex-col items-center justify-center transition-all hover:bg-sky-900/40">
        <p className="text-3xl font-extrabold text-sky-400/90">{count}</p>
        <p className="text-xs text-gray-400 mt-1 text-center font-medium truncate w-full px-1" title={title}>
            {title}
        </p>
    </div>
);

const ChartContainer = ({ title, icon, children }) => (
    // Increased chart height for better Recharts display
    <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden h-96 flex flex-col"> 
        <CardTitle title={title} icon={icon || BarChart2} />
        <div className="p-4 flex-1 flex items-center justify-center">
            {children}
        </div>
    </div>
);

// PieChartMock component has been REMOVED

// --- Main Director Dashboard Component (LOGROS) ---
const DirectorDashboardDisplay = ({ db }) => { 
    const { t } = useTranslation(); 
    const [milestones, setMilestones] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [yearFilter, setYearFilter] = useState(ALL_YEAR_FILTER); 

    const snapshotToArray = (snapshot) => {
        if (!snapshot.exists()) return [];
        const val = snapshot.val();
        return Object.keys(val).map(key => ({
            id: key,
            ...val[key],
        }));
    };

    // 1. Fetch Milestones Data
    useEffect(() => {
        if (!db) return;

        const milestonesRef = ref(db, getDbPaths().milestones); 

        const unsubscribe = onValue(milestonesRef, (snapshot) => {
            try {
                const fetchedMilestones = snapshotToArray(snapshot).map(data => ({
                    ...data,
                    ahorro: typeof data.ahorro === 'number' ? data.ahorro : (parseFloat(data.ahorro) || 0),
                    tipoDeActo: data.tipoDeActo || 'N/A',
                    ambito: data.ambito || 'N/A',
                    institucion: (data.institucion || '').trim(), // Ensure clean string
                    nombre: data.nombre || 'Untitled Milestone',
                    ano: data.ano?.toString() || 'N/A', 
                }));
                setMilestones(fetchedMilestones);
                setIsLoading(false);
            } catch (error) {
                console.error("Error processing snapshot data for Logros:", error);
            }
        }, (error) => {
            console.error("Error fetching milestones for Logros:", error);
            setIsLoading(false);
        });

        return () => unsubscribe(); 
    }, [db]);

    // **FIX**: Filter data first so 'filteredMilestones' is available in the render scope.
    const filteredMilestones = useMemo(() => {
        return yearFilter === ALL_YEAR_FILTER
            ? milestones
            : milestones.filter(item => item.ano === yearFilter);
    }, [milestones, yearFilter]);


    // 2. Data Processing and Aggregation
    const { totalCount, totalAhorro, tipoDeActoCounts, ambitoCounts, institutionCounts, ambitoChartData, institutionChartData } = useMemo(() => {
        
        if (filteredMilestones.length === 0) {
            return { 
                totalCount: 0, totalAhorro: 0, tipoDeActoCounts: {}, ambitoCounts: {}, institutionCounts: {}, 
                ambitoChartData: [], institutionChartData: []
            };
        }

        let totalAhorro = 0;
        const tipoDeActoCounts = {};
        const ambitoCounts = {};
        const institutionCounts = {};

        filteredMilestones.forEach(item => {
            totalAhorro += item.ahorro;
            
            // 1. Count all act types
            tipoDeActoCounts[item.tipoDeActo] = (tipoDeActoCounts[item.tipoDeActo] || 0) + 1;
            
            // 2. Count Ambito (Scope) - Filter out 'N/A'
            if (item.ambito && item.ambito !== 'N/A') {
                ambitoCounts[item.ambito] = (ambitoCounts[item.ambito] || 0) + 1;
            }
            
            // 3. Count Institutions - Filter out empty strings
            if (item.institucion) {
                institutionCounts[item.institucion] = (institutionCounts[item.institucion] || 0) + 1;
            }
        });

        // Format data for Recharts Pie Chart
        const ambitoChartData = Object.entries(ambitoCounts).map(([name, count]) => ({ name, count }));
        const institutionChartData = Object.entries(institutionCounts).map(([name, count]) => ({ name, count }));


        return {
            totalCount: filteredMilestones.length,
            totalAhorro,
            tipoDeActoCounts,
            ambitoCounts,
            institutionCounts,
            ambitoChartData,
            institutionChartData,
        };
    }, [filteredMilestones]);
    
    const formattedAhorro = new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD', 
        maximumFractionDigits: 0 
    }).format(totalAhorro);


    if (!db) { 
        return (
            <div className="p-8 text-center bg-red-900/50 border border-red-700 rounded-xl m-8">
                <p className="text-lg font-semibold text-red-300">{t('director.db_fail')}</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="ml-3 text-sky-200">{t('director.loading')}</p>
            </div>
        );
    }
    

    // 3. Render Dashboard UI (New Structure with Recharts)
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white flex items-center">
                    <Briefcase className="w-8 h-8 mr-3 text-sky-400" />
                    {t('director.title')}
                </h1>
                
                <div className="rounded-xl shadow max-w-xs border border-sky-700/50 bg-black/40 backdrop-blur-lg p-2">
                    <SelectField 
                        label={t('director.filter_year')}
                        name="yearFilter" 
                        options={ANO_OPTIONS} 
                        value={yearFilter} 
                        onChange={(e) => setYearFilter(e.target.value)} 
                    />
                </div>
            </header>
            
            {/* 1. Summary Metrics: Total Savings & Milestone Counter (Streamlined) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <DashboardMetric 
                    value={formattedAhorro} 
                    label={`${t('director.total_savings')} (${yearFilter})`} 
                    color="text-green-400"
                    icon={DollarSign}
                />
                <DashboardMetric 
                    value={totalCount} 
                    label={`${t('director.total_milestones')} (${yearFilter})`} 
                    color="text-gray-200"
                    icon={LayoutList}
                />
            </div>
            
            {/* 2. Act Type Counters (Dynamic based on data) */}
            <h2 className="text-xl font-semibold text-white mb-4">{t('director.act_types') || 'Act Type Breakdown'}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-8">
                {Object.entries(tipoDeActoCounts)
                    .sort(([, countA], [, countB]) => countB - countA)
                    .map(([tipo, count]) => (
                        <ActTypeCard key={tipo} title={tipo} count={count} />
                    ))}
            </div>

            {/* 3. Charts: Scope and Institutions (Now using Recharts) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <ChartContainer title={t('director.scope_distribution')} icon={BarChart2}>
                    <SimplePieChart data={ambitoChartData} /> 
                </ChartContainer>
                
                <ChartContainer title={t('director.institution_breakdown')} icon={Users}>
                    {/* Using SimplePieChart for Institution Breakdown, adjust component props if needed for better visualization of many items */}
                    <SimplePieChart data={institutionChartData} />
                </ChartContainer>
            </div>
            
            {/* 4. Milestone Table (Only Milestone Name) */}
            <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
                <CardTitle title={t('director.milestone_list')} icon={LayoutList} />
                <div className="p-4 max-h-96 overflow-y-auto no-scrollbar">
                    <table className="min-w-full">
                        <thead className="bg-sky-900/70 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider">#</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider">{t('director.milestone_name') || 'Milestone Name'}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-sky-950/50 divide-y divide-sky-800/50">
                            {filteredMilestones.length > 0 ? (
                                filteredMilestones.map((item, index) => (
                                    <tr key={item.id || index} className="hover:bg-sky-900/60">
                                        <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-white">{index + 1}</td>
                                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-300">{item.nombre}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="2" className="px-6 py-4 text-center text-gray-500">
                                        {t('director.no_milestones')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
        </div>
    );
};

export default DirectorDashboardDisplay;