import React, { useState, useEffect, useMemo } from 'react';
import { Briefcase, BarChart2, DollarSign, LayoutList, Loader2, CheckCircle, Users } from 'lucide-react';
import CardTitle from '../ui/CardTitle.jsx';
import SelectField from '../ui/SelectField.jsx'; 
import { getDbPaths } from '../../services/firebase.js';
import { ANO_OPTIONS, ALL_YEAR_FILTER } from '../../utils/constants.js'; 
import { ref, onValue } from 'firebase/database'; 
import { useTranslation } from '../../context/TranslationContext.jsx'; 

// --- Componentes de Visualización (Estilo Oscuro) ---

const DashboardMetric = ({ value, label, color = 'text-sky-400', icon: Icon }) => (
    <div className="p-4 rounded-xl shadow-lg flex flex-col items-center justify-center h-full border border-sky-800/50 bg-sky-950/30">
        <div className="flex items-center space-x-2">
            <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
            {Icon && <Icon className={`w-6 h-6 ${color}`} />}
        </div>
        <p className="text-sm text-gray-400 mt-1 text-center">{label}</p>
    </div>
);
const ChartContainer = ({ title, icon, children }) => (
    <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden h-72 flex flex-col">
        <CardTitle title={title} icon={icon || BarChart2} />
        <div className="p-4 flex-1 flex items-center justify-center">
            {children}
        </div>
    </div>
);
const PieChartMock = ({ data, t }) => {
    if (Object.keys(data).length === 0) {
        return <p className="text-gray-500">{t('director.no_chart_data')}</p>;
    }
    
    const total = Object.values(data).reduce((sum, count) => sum + count, 0);
    const chartData = Object.entries(data).map(([key, count], index) => ({
        key,
        percentage: total > 0 ? (count / total) * 100 : 0,
        color: ['bg-sky-600', 'bg-blue-500', 'bg-green-500', 'bg-red-500'][index % 4],
        count: count,
    }));

    return (
        <div className="flex items-center space-x-6">
            <div className="w-24 h-24 rounded-full border-8 border-sky-900/50 bg-sky-950/50 flex items-center justify-center text-xs font-semibold text-white relative overflow-hidden">
                {chartData.map((item, index) => (
                    <div 
                        key={item.key} 
                        className={`absolute w-full h-full ${item.color} opacity-75`} 
                        style={{
                            clipPath: `inset(0 0 0 ${index * 25}%)`, 
                            transform: `rotate(${index * 90}deg)`
                        }}
                    ></div>
                ))}
                {total}
            </div>
            
            <div className="text-sm space-y-1">
                {chartData.map(item => (
                    <p key={item.key} className="flex items-center text-gray-200">
                        <span className={`w-2 h-2 mr-2 ${item.color} rounded-full`}></span>
                        {item.key}: {item.count} ({item.percentage.toFixed(1)}%)
                    </p>
                ))}
            </div>
        </div>
    );
};


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
                    institucion: data.institucion || 'N/A',
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

    // 2. Data Processing and Aggregation
    const { totalCount, totalAhorro, tipoDeActoCounts, ambitoCounts, institutionCounts, nombreList } = useMemo(() => {
        const filteredMilestones = yearFilter === ALL_YEAR_FILTER
            ? milestones
            : milestones.filter(item => item.ano === yearFilter);

        if (filteredMilestones.length === 0) {
            return { totalCount: 0, totalAhorro: 0, tipoDeActoCounts: {}, ambitoCounts: {}, institutionCounts: {}, nombreList: [] };
        }

        let totalAhorro = 0;
        const tipoDeActoCounts = {};
        const ambitoCounts = {};
        const institutionCounts = {};
        const nombreList = [];

        filteredMilestones.forEach(item => {
            totalAhorro += item.ahorro;
            tipoDeActoCounts[item.tipoDeActo] = (tipoDeActoCounts[item.tipoDeActo] || 0) + 1;
            ambitoCounts[item.ambito] = (ambitoCounts[item.ambito] || 0) + 1;
            institutionCounts[item.institucion] = (institutionCounts[item.institucion] || 0) + 1;
            nombreList.push(item.nombre);
        });

        return {
            totalCount: filteredMilestones.length,
            totalAhorro,
            tipoDeActoCounts,
            ambitoCounts,
            institutionCounts,
            nombreList,
        };
    }, [milestones, yearFilter]); 
    
    const formattedAhorro = new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD', 
        maximumFractionDigits: 0 
    }).format(totalAhorro);

    // Encontrar los 2 tipos de acto principales
    const topTipoDeActo = useMemo(() => {
        return Object.entries(tipoDeActoCounts)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 2)
            .map(([tipo, count]) => ({ tipo, count }));
    }, [tipoDeActoCounts]);


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
    

    // 3. Render Dashboard UI
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

            {/* General Metrics & Totals */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <DashboardMetric 
                    value={totalCount} 
                    label={`${t('director.total_milestones')} (${yearFilter})`} 
                    color="text-gray-200"
                    icon={LayoutList}
                />
                <DashboardMetric 
                    value={formattedAhorro} 
                    label={`${t('director.total_savings')} (${yearFilter})`} 
                    color="text-green-400"
                    icon={DollarSign}
                />
                <DashboardMetric 
                    value={topTipoDeActo[0]?.count || 0} 
                    label={`${t('director.count')}: ${topTipoDeActo[0]?.tipo || 'N/A'}`} 
                    color="text-sky-400"
                    icon={CheckCircle}
                />
                <DashboardMetric 
                    value={topTipoDeActo[1]?.count || 0} 
                    label={`${t('director.count')}: ${topTipoDeActo[1]?.tipo || 'N/A'}`} 
                    color="text-sky-400"
                    icon={CheckCircle}
                />
            </div>

            {/* Charts and Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <ChartContainer title={t('director.scope_distribution')} icon={BarChart2}>
                    <PieChartMock data={ambitoCounts} t={t} />
                </ChartContainer>
                
                <ChartContainer title={t('director.institution_breakdown')} icon={Users}>
                     {Object.keys(institutionCounts).length > 0 ? (
                        <div className="w-full space-y-3 overflow-y-auto max-h-full no-scrollbar">
                            {Object.entries(institutionCounts)
                                .sort(([, countA], [, countB]) => countB - countA)
                                .map(([institution, count]) => (
                                    <div key={institution} className="flex items-center space-x-2">
                                        <span className="text-xs w-16 truncate text-right text-gray-400">{count} {t('director.count')}</span>
                                        <div className="flex-1 bg-sky-950/50 rounded-full h-3">
                                            <div 
                                                className="bg-sky-500 h-3 rounded-full transition-all duration-500" 
                                                style={{ width: `${(count / totalCount) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm flex-3 text-white truncate">{institution}</span>
                                    </div>
                                ))}
                        </div>
                     ) : (<p className="text-gray-500">{t('director.no_institution_data')}</p>)}
                </ChartContainer>
            </div>
            
            {/* Lista de Nombres y Contador de Tipos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
                    <CardTitle title={t('director.milestone_list')} icon={LayoutList} />
                    <div className="p-4 max-h-96 overflow-y-auto no-scrollbar">
                        <table className="min-w-full">
                            <thead className="bg-sky-900/70 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider">
                                        #
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider">
                                        {t('director.milestone_name')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-sky-950/50 divide-y divide-sky-800/50">
                                {nombreList.length > 0 ? (
                                    nombreList.map((nombre, index) => (
                                        <tr key={index} className="hover:bg-sky-900/60">
                                            <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-white">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-300">
                                                {nombre}
                                            </td>
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
                
                <div className="lg:col-span-1 rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
                    <CardTitle title={t('director.count_by_type')} icon={CheckCircle} />
                    <div className="p-4 max-h-96 overflow-y-auto no-scrollbar space-y-2">
                        {Object.entries(tipoDeActoCounts).map(([tipo, count]) => (
                            <div key={tipo} className="bg-sky-950/50 p-3 rounded-lg border border-sky-800/50 text-center flex justify-between items-center">
                                <p className="text-sm text-gray-300 truncate" title={tipo}>{tipo}</p>
                                <p className="text-lg font-bold text-sky-300">{count}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
        </div>
    );
};

export default DirectorDashboardDisplay;