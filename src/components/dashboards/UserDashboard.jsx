import React, { useState, useEffect, useMemo } from 'react';
import { User, BarChart2, Briefcase, LayoutList, Loader2, DollarSign, Users, PieChart, Activity } from 'lucide-react'; 
import CardTitle from '../ui/CardTitle.jsx';
import SelectField from '../ui/SelectField.jsx';
import { getDbPaths } from '../../services/firebase.js';
import { ref, onValue } from 'firebase/database';
import { ANO_OPTIONS, ALL_YEAR_FILTER, SECTOR_OPTIONS, TIPO_DE_ACTO_OPTIONS } from '../../utils/constants.js';
import { useTranslation } from '../../context/TranslationContext.jsx'; 

// --- Componentes de Visualización (Estilo Oscuro) ---

const DashboardMetric = ({ value, label, color = 'text-sky-400', icon: Icon, subLabel = null }) => (
    <div className="p-4 rounded-xl shadow-lg flex flex-col items-center justify-center h-full border border-sky-800/50 bg-sky-950/30">
        {Icon && <Icon className={`w-6 h-6 ${color}`} />}
        <p className={`text-4xl font-extrabold ${color}`}>{value}</p>
        {subLabel && <p className="text-sm font-semibold text-white mt-1">{subLabel}</p>}
        <p className="text-sm text-gray-400 mt-1 text-center">{label}</p>
    </div>
);

const ChartContainer = ({ title, icon: Icon, children }) => (
    <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden h-72 flex flex-col">
        <CardTitle title={title} icon={Icon || BarChart2} />
        <div className="p-4 flex-1 flex items-center justify-center">
            {children}
        </div>
    </div>
);

const RingChartMock = ({ activeCount, totalCount, label, t }) => {
    const percentage = totalCount > 0 ? ((activeCount / totalCount) * 100).toFixed(0) : 0;
    
    return (
        <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-24 h-24 rounded-full border-8 border-sky-900/50 bg-sky-950/50 flex items-center justify-center relative">
                <div className="text-xl font-bold text-white">{activeCount}</div>
            </div>
            <div className="text-center">
                <p className="text-2xl font-bold text-sky-400">{percentage}%</p>
                <p className="text-xs text-gray-400">{label} ({totalCount} {t('user.metric.total')})</p>
            </div>
        </div>
    );
};

const PieChartInstitucionesMock = ({ data, totalItems, t }) => { 
    const totalCount = Object.values(data).reduce((sum, count) => sum + count, 0);
    const chartData = Object.entries(data).map(([key, count], index) => ({
        key,
        percentage: totalCount > 0 ? (count / totalCount) * 100 : 0,
        color: ['bg-sky-600', 'bg-gray-700', 'bg-blue-500', 'bg-red-500', 'bg-green-500'][index % 5],
        count: count,
    })).sort((a, b) => b.count - a.count); 

    if (chartData.length === 0) {
        return <p className="text-gray-500">{t('user.no_chart_data')}</p>;
    }
    
    return (
        <div className="flex items-center space-x-6">
            <div className="w-32 h-32 rounded-full border-8 border-sky-900/50 bg-sky-950/50 flex items-center justify-center relative shadow-inner">
                 <div className="relative z-10 text-xl font-bold text-white">{totalItems}</div>
            </div>
            
            <div className="text-sm space-y-1 max-h-48 overflow-y-auto">
                <p className="text-xs font-semibold text-gray-300 mb-2">{t('user.institution_breakdown')}:</p>
                {chartData.map(item => (
                    <p key={item.key} className="flex items-center text-gray-200">
                        <span className={`w-2 h-2 mr-2 ${item.color} rounded-full`}></span>
                        {item.key} ({item.percentage.toFixed(2)}%)
                    </p>
                ))}
            </div>
        </div>
    );
};


const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({
        id: key,
        ...val[key],
    }));
};
// -----------------------------------------------------------------


const UserDashboardDisplay = ({ db }) => { 
    const { t } = useTranslation(); 
    const [allAgendaItems, setAllAgendaItems] = useState([]);
    const [allMilestones, setAllMilestones] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [yearFilter, setYearFilter] = useState(ALL_YEAR_FILTER);

    // 1. Fetch Data
    useEffect(() => {
        if (!db) return;

        const agendaRef = ref(db, getDbPaths().agenda);
        const milestonesRef = ref(db, getDbPaths().milestones);
        let unsubs = [];
        let itemsFetched = 0;

        const checkDone = () => {
            itemsFetched++;
            if (itemsFetched === 2) setIsLoading(false);
        };

        const unsubAgenda = onValue(agendaRef, (snapshot) => {
            try {
                const items = snapshotToArray(snapshot).map(item => ({
                    ...item,
                    ano: item.ano?.toString() || 'N/A'
                }));
                setAllAgendaItems(items);
            } catch (e) { console.error("Error processing Agenda snapshot:", e); }
            checkDone();
        }, (error) => {
             console.error("Agenda Subscription Error:", error);
             checkDone();
        });
        unsubs.push(unsubAgenda);

        const unsubMilestones = onValue(milestonesRef, (snapshot) => {
             try {
                const items = snapshotToArray(snapshot).map(item => ({
                    ...item,
                    ano: item.ano?.toString() || 'N/A' 
                }));
                setAllMilestones(items);
            } catch (e) { console.error("Error processing Milestone snapshot:", e); }
            checkDone();
        }, (error) => {
             console.error("Milestone Subscription Error:", error);
             checkDone();
        });
        unsubs.push(unsubMilestones);
        
        return () => unsubs.forEach(unsub => unsub()); 
    }, [db]);


    // 2. Data Filtering, Aggregation, and Calculation
    const metrics = useMemo(() => {
        const filteredAgendaItems = yearFilter === ALL_YEAR_FILTER
            ? allAgendaItems
            : allAgendaItems.filter(item => item.ano === yearFilter);

        const filteredMilestones = yearFilter === ALL_YEAR_FILTER
            ? allMilestones
            : allMilestones.filter(item => item.ano === yearFilter);

        const totalProyectos = filteredAgendaItems.length;

        if (totalProyectos === 0) {
            return { totalProyectos: 0, enProceso: 0, finalizado: 0, sectorCounts: {}, tipoDeActoCounts: {}, totalInstituciones: 0, pieChartInstitutions: {} };
        }

        const totals = {
            enProceso: 0,
            finalizado: 0,
            sectorCounts: {},
            tipoDeActoCounts: {},
        };

        filteredAgendaItems.forEach(item => {
            if (item.condicion === 'en seguimiento') {
                totals.enProceso++;
            } else if (item.condicion === 'finalizado') {
                totals.finalizado++;
            }
            
            const sector = item.sector || 'N/A';
            totals.sectorCounts[sector] = (totals.sectorCounts[sector] || 0) + 1;

            const tipoDeActo = item.tipoDeActo || 'N/A';
            totals.tipoDeActoCounts[tipoDeActo] = (totals.tipoDeActoCounts[tipoDeActo] || 0) + 1;
        });

        const allInstitutions = new Set();
        filteredAgendaItems.forEach(item => { if (item.institucion && item.institucion !== 'N/A') allInstitutions.add(item.institucion) });
        filteredMilestones.forEach(item => { if (item.institucion && item.institucion !== 'N/A') allInstitutions.add(item.institucion) });
        
        const pieChartInstitutions = {
            [t('user.institution.executive')]: 0,
            [t('user.institution.international')]: 0,
            [t('user.institution.legislative')]: 0,
            [t('user.institution.other')]: 0,
        };
        
        allInstitutions.forEach(inst => {
            const lowerInst = inst.toLowerCase();
            if (lowerInst.includes('ministerio') || lowerInst.includes('secretaria') || lowerInst.includes('ejecutivo')) {
                pieChartInstitutions[t('user.institution.executive')]++;
            } else if (lowerInst.includes('onu') || lowerInst.includes('oas') || lowerInst.includes('fmi') || lowerInst.includes('internacional')) {
                pieChartInstitutions[t('user.institution.international')]++;
            } else if (lowerInst.includes('asamblea') || lowerInst.includes('congreso') || lowerInst.includes('legislativo')) {
                pieChartInstitutions[t('user.institution.legislative')]++;
            } else {
                 pieChartInstitutions[t('user.institution.other')]++;
            }
        });


        return {
            totalProyectos,
            ...totals,
            totalInstituciones: allInstitutions.size,
            pieChartInstitutions: pieChartInstitutions,
        };
    }, [allAgendaItems, allMilestones, yearFilter, t]);

    // Calculate Sector Percentages
    const sectorMetrics = useMemo(() => {
        const total = metrics.totalProyectos;
        if (total === 0) return [];
        
        const getPercentage = (sectorName) => {
            const count = metrics.sectorCounts[sectorName] || 0;
            return ((count / total) * 100).toFixed(0); // Quitado decimales para limpieza
        };

        return [
            { label: t('user.sector.exportador_title'), subLabel: t('user.sector.exportador'), value: getPercentage("exportador") + "%" },
            { label: t('user.sector.productor_title'), subLabel: t('user.sector.productor'), value: getPercentage("productor") + "%" },
            { label: t('user.sector.productor_exportador_title'), subLabel: t('user.sector.productor_exportador'), value: getPercentage("productor-exportador") + "%" },
            { label: t('user.sector.cadena_valor_title'), subLabel: t('user.sector.cadena_valor'), value: getPercentage("cadena de valor") + "%" },
        ];
    }, [metrics, t]);


    if (!db) { 
        return (
            <div className="p-8 text-center bg-red-900/50 border border-red-700 rounded-xl m-8">
                <p className="text-lg font-semibold text-red-300">{t('director.db_fail')}</p>
            </div>
        );
    }
    
    if (isLoading) {
         return (
            <div className="flex justify-center items-center p-8 min-h-screen">
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="ml-3 text-sky-200">{t('button.initializing')}</p>
            </div>
        );
    }
    
    const totalProyectos = metrics.totalProyectos;
    const enProcesoCount = metrics.enProceso;
    const finalizadoCount = metrics.finalizado;

    // Render Dashboard UI
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white flex items-center">
                    <BarChart2 className="w-8 h-8 mr-3 text-sky-400" />
                    {t('user.title')}
                </h1>
                
                <div className="rounded-xl shadow max-w-xs border border-sky-700/50 bg-black/40 backdrop-blur-lg p-2">
                    <SelectField 
                        label={t('user.filter_year')} 
                        name="yearFilter" 
                        options={ANO_OPTIONS} 
                        value={yearFilter} 
                        onChange={(e) => setYearFilter(e.target.value)} 
                    />
                </div>
            </header>

            {/* --- TOP METRICS & RING CHARTS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <DashboardMetric 
                    value={totalProyectos} 
                    label={t('user.metric.projects')} 
                    icon={LayoutList} 
                    color="text-gray-200"
                />
                <ChartContainer title={t('user.metric.in_process_title')} icon={Activity}>
                    <RingChartMock 
                        activeCount={enProcesoCount} 
                        totalCount={totalProyectos} 
                        label={t('user.metric.in_process_label')}
                        t={t}
                    />
                </ChartContainer>
                <ChartContainer title={t('user.metric.monitoring_title')} icon={Briefcase}>
                    <RingChartMock 
                        activeCount={finalizadoCount} 
                        totalCount={totalProyectos} 
                        label={t('user.metric.monitoring_label')}
                        t={t}
                    />
                </ChartContainer>
            </div>

            {/* --- INSTITUCIONES & PIE CHART --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <DashboardMetric 
                    value={metrics.totalInstituciones} 
                    label={t('user.metric.institutions')} 
                    icon={Users} 
                    color="text-gray-200"
                />
                <div className="md:col-span-2">
                    <ChartContainer title={t('user.metric.institution_title')} icon={PieChart}>
                        <PieChartInstitucionesMock 
                            data={metrics.pieChartInstitutions} 
                            totalItems={metrics.totalInstituciones}
                            t={t}
                        />
                    </ChartContainer>
                </div>
            </div>

            {/* --- SECTOR PERCENTAGES --- */}
            <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden mb-6">
                <CardTitle title={t('user.metric.sector_title')} icon={Briefcase} />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
                    {sectorMetrics.map((m, index) => (
                        <DashboardMetric 
                            key={index}
                            value={m.value} 
                            label={m.label} 
                            subLabel={m.subLabel}
                            color="text-sky-400" 
                        />
                    ))}
                </div>
            </div>

            {/* --- INSTRUMENTO NORMATIVO (Tipo de Acto) COUNTERS --- */}
            <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
                <CardTitle title={t('user.metric.instrument_title')} icon={DollarSign} />
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4 p-4">
                    {Object.entries(metrics.tipoDeActoCounts)
                        .sort(([, countA], [, countB]) => countB - countA)
                        .map(([tipo, count]) => (
                        <DashboardMetric 
                            key={tipo}
                            value={count} 
                            label={tipo} 
                            color="text-sky-300" 
                        />
                    ))}
                </div>
            </div>

        </div>
    );
};

export default UserDashboardDisplay;