import React, { useState, useEffect, useMemo } from 'react';
import { Briefcase, BarChart2, DollarSign, LayoutList, Loader2, CheckCircle, Users } from 'lucide-react';
import CardTitle from '../ui/CardTitle.jsx';
import SelectField from '../ui/SelectField.jsx'; 
import { getDbPaths } from '../../services/firebase.js';
import { ANO_OPTIONS, ALL_YEAR_FILTER } from '../../utils/constants.js'; 
import { ref, onValue } from 'firebase/database'; 
import { useTranslation } from '../../context/TranslationContext.jsx'; 
import SimplePieChart from '../charts/SimplePieChart.jsx'; 

const DashboardMetric = ({ value, label, color = 'text-blue-600', icon: Icon }) => (
    <div className="p-6 rounded-2xl shadow-sm border border-slate-200 bg-white flex items-center justify-between hover:shadow-md transition-all">
        <div className="flex flex-col space-y-1">
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">{label}</p>
            <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color.replace('text', 'bg').replace('600', '50')} ${color} bg-opacity-20`}>
             <Icon className={`w-6 h-6`} />
        </div>
    </div>
);

const ActTypeCard = ({ title, count }) => (
    <div className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col items-center justify-center transition-all hover:border-blue-300 hover:shadow-sm">
        <p className="text-3xl font-bold text-slate-700">{count}</p>
        <p className="text-xs text-slate-500 mt-2 text-center font-medium uppercase tracking-wide truncate w-full" title={title}>
            {title}
        </p>
    </div>
);

const ChartContainer = ({ title, icon, children }) => (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden h-96 flex flex-col"> 
        <CardTitle title={title} icon={icon || BarChart2} />
        <div className="p-4 flex-1 flex items-center justify-center">
            {children}
        </div>
    </div>
);

const DirectorDashboardDisplay = ({ db }) => { 
    const { t } = useTranslation(); 
    const [milestones, setMilestones] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [yearFilter, setYearFilter] = useState(ALL_YEAR_FILTER); 

    const snapshotToArray = (snapshot) => {
        if (!snapshot.exists()) return [];
        const val = snapshot.val();
        return Object.keys(val).map(key => ({ id: key, ...val[key] }));
    };

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
                    institucion: (data.institucion || '').trim(), 
                    nombre: data.nombre || 'Untitled Milestone',
                    ano: data.ano?.toString() || 'N/A', 
                }));
                setMilestones(fetchedMilestones);
                setIsLoading(false);
            } catch (error) { console.error("Error processing snapshot:", error); }
        }, (error) => { console.error("Error fetching milestones:", error); setIsLoading(false); });
        return () => unsubscribe(); 
    }, [db]);

    const filteredMilestones = useMemo(() => {
        return yearFilter === ALL_YEAR_FILTER
            ? milestones
            : milestones.filter(item => item.ano === yearFilter);
    }, [milestones, yearFilter]);

    const { totalCount, totalAhorro, tipoDeActoCounts, ambitoCounts, institutionCounts, ambitoChartData, institutionChartData } = useMemo(() => {
        if (filteredMilestones.length === 0) return { totalCount: 0, totalAhorro: 0, tipoDeActoCounts: {}, ambitoCounts: {}, institutionCounts: {}, ambitoChartData: [], institutionChartData: [] };

        let totalAhorro = 0;
        const tipoDeActoCounts = {}, ambitoCounts = {}, institutionCounts = {};

        filteredMilestones.forEach(item => {
            totalAhorro += item.ahorro;
            tipoDeActoCounts[item.tipoDeActo] = (tipoDeActoCounts[item.tipoDeActo] || 0) + 1;
            if (item.ambito && item.ambito !== 'N/A') ambitoCounts[item.ambito] = (ambitoCounts[item.ambito] || 0) + 1;
            if (item.institucion) institutionCounts[item.institucion] = (institutionCounts[item.institucion] || 0) + 1;
        });

        const ambitoChartData = Object.entries(ambitoCounts).map(([name, count]) => ({ name, count }));
        const institutionChartData = Object.entries(institutionCounts).map(([name, count]) => ({ name, count }));

        return { totalCount: filteredMilestones.length, totalAhorro, tipoDeActoCounts, ambitoCounts, institutionCounts, ambitoChartData, institutionChartData };
    }, [filteredMilestones]);
    
    const formattedAhorro = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalAhorro);

    if (!db) return <div className="p-8 text-center bg-red-50 border border-red-200 rounded-xl m-8"><p className="text-lg font-semibold text-red-600">{t('director.db_fail')}</p></div>;
    if (isLoading) return <div className="flex justify-center items-center p-8"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /><p className="ml-3 text-slate-500">{t('director.loading')}</p></div>;

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-full">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center mb-4 sm:mb-0">
                    <Briefcase className="w-8 h-8 mr-3 text-blue-600" />
                    {t('director.title')}
                </h1>
                
                <div className="rounded-xl shadow-sm w-full max-w-xs border border-slate-200 bg-white p-2">
                    <SelectField 
                        label={t('director.filter_year')}
                        name="yearFilter" 
                        options={ANO_OPTIONS} 
                        value={yearFilter} 
                        onChange={(e) => setYearFilter(e.target.value)} 
                    />
                </div>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <DashboardMetric 
                    value={formattedAhorro} 
                    label={`${t('director.total_savings')} (${yearFilter})`} 
                    color="text-emerald-600"
                    icon={DollarSign}
                />
                <DashboardMetric 
                    value={totalCount} 
                    label={`${t('director.total_milestones')} (${yearFilter})`} 
                    color="text-slate-700"
                    icon={LayoutList}
                />
            </div>
            
            <h2 className="text-xl font-bold text-slate-700 mb-4 px-1">{t('director.act_types') || 'Act Type Breakdown'}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
                {Object.entries(tipoDeActoCounts).sort(([, a], [, b]) => b - a).map(([tipo, count]) => (
                    <ActTypeCard key={tipo} title={tipo} count={count} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <ChartContainer title={t('director.scope_distribution')} icon={BarChart2}>
                    <SimplePieChart data={ambitoChartData} /> 
                </ChartContainer>
                <ChartContainer title={t('director.institution_breakdown')} icon={Users}>
                    <SimplePieChart data={institutionChartData} />
                </ChartContainer>
            </div>
            
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <CardTitle title={t('director.milestone_list')} icon={LayoutList} />
                <div className="p-0 max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">#</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t('director.milestone_name') || 'Milestone Name'}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredMilestones.length > 0 ? (
                                filteredMilestones.map((item, index) => (
                                    <tr key={item.id || index} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-slate-900">{index + 1}</td>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600">{item.nombre}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="2" className="px-6 py-4 text-center text-slate-500">{t('director.no_milestones')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DirectorDashboardDisplay;