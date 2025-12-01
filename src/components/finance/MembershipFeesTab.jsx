import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { getDbPaths } from '../../services/firebase.js';
import { useTranslation } from '../../context/TranslationContext.jsx';
import CardTitle from '../ui/CardTitle.jsx';
import { BarChart, Loader2, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import SimpleBarChart from '../charts/SimpleBarChart.jsx'; 

const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({ id: key, ...val[key] }));
};

const formatCurrency = (value) => {
    const numericValue = parseFloat(value) || 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numericValue);
};

const SummaryMetric = ({ title, value, color, icon: Icon }) => (
    <div className={`p-6 rounded-xl shadow-sm flex flex-col items-center justify-center h-full border ${color.border} ${color.bg}`}>
        <div className={`p-3 rounded-full ${color.iconBg} mb-3`}>
            <Icon className={`w-6 h-6 ${color.text}`} />
        </div>
        <p className={`text-2xl font-extrabold ${color.text}`}>{formatCurrency(value)}</p>
        <p className="text-sm text-slate-500 mt-1 text-center uppercase tracking-wide font-medium">{title}</p>
    </div>
);

const FinanceSummaryTab = ({ db, userId }) => {
    const { t } = useTranslation();
    const [incomeData, setIncomeData] = useState({ fees: 0, donations: 0, services: 0, projects: 0 });
    const [adminCosts, setAdminCosts] = useState([]);
    const [nonOpCosts, setNonOpCosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const dbPaths = useMemo(() => getDbPaths(), []);

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

                if (['fees', 'donations', 'services', 'projects'].includes(key)) {
                    setIncomeData(prev => ({ ...prev, [key]: total }));
                } else if (key === 'admin') {
                    setAdminCosts(data);
                } else if (key === 'nonOp') {
                    setNonOpCosts(data);
                }

                loadedCount++;
                if (loadedCount === totalToLoad) setIsLoading(false);
            }, (error) => {
                console.error(`Error fetching ${key}:`, error);
                loadedCount++;
                if (loadedCount === totalToLoad) setIsLoading(false);
            });
        });
        return () => unsubs.forEach(unsub => unsub());
    }, [db, dbPaths]);

    const { totalIncome, totalOutcome, generalResult, adminCostChartData, nonOpCostChartData } = useMemo(() => {
        const totalIncome = Object.values(incomeData).reduce((sum, val) => sum + val, 0);
        
        const adminMap = adminCosts.reduce((acc, item) => {
            const cat = item.category || 'Other';
            acc[cat] = (acc[cat] || 0) + (parseFloat(item.amount) || 0);
            return acc;
        }, {});
        
        const nonOpMap = nonOpCosts.reduce((acc, item) => {
            const cat = item.category || 'Other';
            acc[cat] = (acc[cat] || 0) + (parseFloat(item.amount) || 0);
            return acc;
        }, {});
        
        const adminCostChartData = Object.keys(adminMap).map(name => ({ name, count: adminMap[name] }));
        const nonOpCostChartData = Object.keys(nonOpMap).map(name => ({ name, count: nonOpMap[name] }));

        const totalAdminCost = adminCosts.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const totalNonOpCost = nonOpCosts.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        
        const totalOutcome = totalAdminCost + totalNonOpCost;
        const generalResult = totalIncome - totalOutcome;
        
        return { totalIncome, totalOutcome, generalResult, adminCostChartData, nonOpCostChartData };
    }, [incomeData, adminCosts, nonOpCosts]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="ml-3 text-slate-500">{t('finance.summary.loading')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <CardTitle title={t('finance.tab.summary')} icon={BarChart} />
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SummaryMetric 
                        title={t('finance.summary.total_income')}
                        value={totalIncome}
                        icon={TrendingUp}
                        color={{ bg: 'bg-white', border: 'border-emerald-100', text: 'text-emerald-600', iconBg: 'bg-emerald-50' }}
                    />
                    <SummaryMetric 
                        title={t('finance.summary.total_outcome')}
                        value={totalOutcome}
                        icon={TrendingDown}
                        color={{ bg: 'bg-white', border: 'border-red-100', text: 'text-red-600', iconBg: 'bg-red-50' }}
                    />
                    <SummaryMetric 
                        title={t('finance.summary.general_result')}
                        value={generalResult}
                        icon={CheckCircle}
                        color={{ bg: 'bg-white', border: 'border-blue-100', text: 'text-blue-600', iconBg: 'bg-blue-50' }}
                    />
                </div>
                
                <div className="p-6 border-t border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">{t('finance.summary.breakdown')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <h4 className="text-md font-medium text-emerald-600">{t('finance.summary.income')}</h4>
                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-4 space-y-3">
                                <div className="flex justify-between text-sm"><span className="text-slate-600">{t('finance.tab.fees')}</span><span className="font-medium text-slate-800">{formatCurrency(incomeData.fees)}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-slate-600">{t('finance.tab.donations')}</span><span className="font-medium text-slate-800">{formatCurrency(incomeData.donations)}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-slate-600">{t('finance.tab.services')}</span><span className="font-medium text-slate-800">{formatCurrency(incomeData.services)}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-slate-600">{t('finance.tab.projects')}</span><span className="font-medium text-slate-800">{formatCurrency(incomeData.projects)}</span></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-md font-medium text-red-600">{t('finance.summary.outcome')}</h4>
                             <div className="bg-red-50/50 border border-red-100 rounded-lg p-4 space-y-3">
                                <div className="flex justify-between text-sm"><span className="text-slate-600">{t('finance.admin_costs.title')}</span><span className="font-medium text-slate-800">{formatCurrency(totalOutcome - totalIncome)}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-slate-600">{t('finance.nonop_costs.title')}</span><span className="font-medium text-slate-800">{formatCurrency(totalOutcome - totalIncome)}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <CardTitle title={t('finance.admin_costs.title')} icon={TrendingDown} />
                    <div className="p-4">
                        <SimpleBarChart data={adminCostChartData} fillColor="#ef4444" />
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <CardTitle title={t('finance.nonop_costs.title')} icon={TrendingDown} />
                    <div className="p-4">
                        <SimpleBarChart data={nonOpCostChartData} fillColor="#f97316" />
                    </div>
                </div>
            </div>
            
        </div>
    );
};
export default FinanceSummaryTab;