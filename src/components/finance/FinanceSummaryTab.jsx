// src/components/finance/FinanceSummaryTab.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { getDbPaths } from '../../services/firebase.js';
import { useTranslation } from '../../context/TranslationContext.jsx';
import CardTitle from '../ui/CardTitle.jsx';
import { BarChart, Loader2, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
// --- ELIMINADO: Importar FinanceCostDashboard ---

const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({
        id: key,
        ...val[key],
    }));
};

const formatCurrency = (value) => {
    const numericValue = parseFloat(value) || 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numericValue);
};

// Componente de Métrica
const SummaryMetric = ({ title, value, color, icon: Icon }) => (
    <div className={`p-4 rounded-xl shadow-lg flex flex-col items-center justify-center h-full border ${color.border} ${color.bg}`}>
        <Icon className={`w-6 h-6 ${color.text}`} />
        <p className={`text-2xl font-extrabold ${color.text}`}>{formatCurrency(value)}</p>
        <p className="text-sm text-gray-400 mt-1 text-center">{title}</p>
    </div>
);

const FinanceSummaryTab = ({ db, userId }) => {
    const { t } = useTranslation();
    const [incomeData, setIncomeData] = useState({ fees: 0, donations: 0, services: 0, projects: 0 });
    const [outcomeData, setOutcomeData] = useState({ admin: 0, nonOp: 0 });
    const [isLoading, setIsLoading] = useState(true);

    const dbPaths = useMemo(() => getDbPaths(), []);

    // 1. Hook de Efecto para cargar TODOS los datos financieros
    useEffect(() => {
        if (!db) return;
        
        const pathsToFetch = {
            fees: dbPaths.financeMembershipFees,
            donations: dbPaths.financeDonations,
            services: dbPaths.financeServices,
            projects: dbPaths.financeProjects,
            admin: dbPaths.financeAdminCosts,
            nonOp: dbPaths.financeNonOpCosts,
        };

        let loadedCount = 0;
        const totalToLoad = Object.keys(pathsToFetch).length;
        
        const unsubs = Object.entries(pathsToFetch).map(([key, path]) => {
            const dataRef = ref(db, path);
            
            return onValue(dataRef, (snapshot) => {
                const data = snapshotToArray(snapshot);
                const total = data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

                if (key === 'fees' || key === 'donations' || key === 'services' || key === 'projects') {
                    setIncomeData(prev => ({ ...prev, [key]: total }));
                } else {
                    setOutcomeData(prev => ({ ...prev, [key]: total }));
                }

                loadedCount++;
                if (loadedCount === totalToLoad) {
                    setIsLoading(false);
                }
            }, (error) => {
                console.error(`Error fetching ${key}:`, error);
                loadedCount++;
                if (loadedCount === totalToLoad) {
                    setIsLoading(false);
                }
            });
        });

        return () => unsubs.forEach(unsub => unsub());
    }, [db, dbPaths]);

    // 2. Calcular Totales
    const { totalIncome, totalOutcome, generalResult } = useMemo(() => {
        const totalIncome = Object.values(incomeData).reduce((sum, val) => sum + val, 0);
        const totalOutcome = Object.values(outcomeData).reduce((sum, val) => sum + val, 0);
        const generalResult = totalIncome - totalOutcome;
        return { totalIncome, totalOutcome, generalResult };
    }, [incomeData, outcomeData]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="ml-3 text-sky-200">{t('finance.summary.loading')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* 1. Contenedor de Resumen General */}
            <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
                <CardTitle title={t('finance.tab.summary')} icon={BarChart} />
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SummaryMetric 
                        title={t('finance.summary.total_income')}
                        value={totalIncome}
                        icon={TrendingUp}
                        color={{ bg: 'bg-green-950/30', border: 'border-green-800/50', text: 'text-green-400' }}
                    />
                    <SummaryMetric 
                        title={t('finance.summary.total_outcome')}
                        value={totalOutcome}
                        icon={TrendingDown}
                        color={{ bg: 'bg-red-950/30', border: 'border-red-800/50', text: 'text-red-400' }}
                    />
                    <SummaryMetric 
                        title={t('finance.summary.general_result')}
                        value={generalResult}
                        icon={CheckCircle}
                        color={{ bg: 'bg-sky-950/30', border: 'border-sky-800/50', text: 'text-sky-400' }}
                    />
                </div>
                
                {/* Tabla de Desglose */}
                <div className="p-6 border-t border-sky-800/50">
                    <h3 className="text-lg font-semibold text-white mb-4">{t('finance.summary.breakdown')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Columna de Ingresos */}
                        <div className="space-y-2">
                            <h4 className="text-md font-semibold text-green-400">{t('finance.summary.income')}</h4>
                            <div className="bg-sky-950/50 rounded-lg p-4 space-y-3">
                                <div className="flex justify-between text-sm"><span className="text-gray-400">{t('finance.tab.fees')}</span><span className="font-medium text-gray-200">{formatCurrency(incomeData.fees)}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-gray-400">{t('finance.tab.donations')}</span><span className="font-medium text-gray-200">{formatCurrency(incomeData.donations)}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-gray-400">{t('finance.tab.services')}</span><span className="font-medium text-gray-200">{formatCurrency(incomeData.services)}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-gray-400">{t('finance.tab.projects')}</span><span className="font-medium text-gray-200">{formatCurrency(incomeData.projects)}</span></div>
                            </div>
                        </div>
                        {/* Columna de Egresos */}
                        <div className="space-y-2">
                            <h4 className="text-md font-semibold text-red-400">{t('finance.summary.outcome')}</h4>
                             <div className="bg-sky-950/50 rounded-lg p-4 space-y-3">
                                <div className="flex justify-between text-sm"><span className="text-gray-400">{t('finance.admin_costs.title')}</span><span className="font-medium text-gray-200">{formatCurrency(outcomeData.admin)}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-gray-400">{t('finance.nonop_costs.title')}</span><span className="font-medium text-gray-200">{formatCurrency(outcomeData.nonOp)}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- ELIMINADO: Contenedores de Costos --- */}
            
        </div>
    );
};
export default FinanceSummaryTab;