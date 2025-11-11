// src/components/dashboards/AgendaDashboard.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Loader2, PieChart as PieIcon, TrendingUp } from 'lucide-react'; 
import { ref, onValue } from 'firebase/database';
import { getDbPaths } from '../../services/firebase.js';
import CardTitle from '../ui/CardTitle.jsx';
import { useTranslation } from '../../context/TranslationContext.jsx'; 
// --- NUEVO: Importar gráficos reales ---
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

// --- ELIMINADO: TreemapMock ya no es necesario ---

const AgendaDashboard = ({ db }) => {
    const { t } = useTranslation();
    const [agendaItems, setAgendaItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

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

    // Procesar datos para todos los gráficos
    const processedData = useMemo(() => {
        const counts = {
            sector: {},
            institucion: {},
            pilar: {},
            agenda: {},
            condicion: {},
            tipoDeActo: {}
        };

        agendaItems.forEach(item => {
            counts.sector[item.sector || 'N/A'] = (counts.sector[item.sector || 'N/A'] || 0) + 1;
            counts.institucion[item.institucion || 'N/A'] = (counts.institucion[item.institucion || 'N/A'] || 0) + 1;
            counts.pilar[item.pilar || 'N/A'] = (counts.pilar[item.pilar || 'N/A'] || 0) + 1;
            counts.agenda[item.agenda || 'N/A'] = (counts.agenda[item.agenda || 'N/A'] || 0) + 1;
            counts.condicion[item.condicion || 'N/A'] = (counts.condicion[item.condicion || 'N/A'] || 0) + 1;
            counts.tipoDeActo[item.tipoDeActo || 'N/A'] = (counts.tipoDeActo[item.tipoDeActo || 'N/A'] || 0) + 1;
        });
        
        // Convertir a formato de Recharts: [{ name: '...', count: ... }]
        const formatForChart = (data) => Object.keys(data)
            .map(key => ({ name: key, count: data[key] }))
            .sort((a, b) => b.count - a.count); // Ordenar para BarChart

        return {
            sector: formatForChart(counts.sector),
            institucion: formatForChart(counts.institucion),
            pilar: formatForChart(counts.pilar),
            agenda: formatForChart(counts.agenda),
            condicion: formatForChart(counts.condicion),
            tipoDeActo: formatForChart(counts.tipoDeActo)
        };
    }, [agendaItems]);
    
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
            <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
                <BarChart className="w-8 h-8 mr-3 text-sky-400" />
                {t('agenda.title')}
            </h1>

            {/* Gráfico de Ranking de Instituciones (BarChart) */}
            <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden mb-8">
                <CardTitle title={t('agenda.chart.ranking')} icon={TrendingUp} />
                <div className="p-4">
                    <SimpleBarChart data={processedData.institucion.slice(0, 15)} fillColor="#8884d8" />
                </div>
            </div>

            {/* Gráficos de Distribución (PieChart) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
                    <CardTitle title={`${t('agenda.chart.distribution_by')} ${t('agenda.chart.pilar')}`} icon={PieIcon} />
                    <div className="p-4">
                        <SimplePieChart data={processedData.pilar} />
                    </div>
                </div>
                <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
                    <CardTitle title={`${t('agenda.chart.distribution_by')} ${t('agenda.chart.sector')}`} icon={PieIcon} />
                    <div className="p-4">
                        <SimplePieChart data={processedData.sector} />
                    </div>
                </div>
                <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
                    <CardTitle title={`${t('agenda.chart.distribution_by')} ${t('agenda.chart.condicion')}`} icon={PieIcon} />
                    <div className="p-4">
                        <SimplePieChart data={processedData.condicion} />
                    </div>
                </div>
                <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
                    <CardTitle title={`${t('agenda.chart.distribution_by')} ${t('agenda.chart.tipo_acto')}`} icon={PieIcon} />
                    <div className="p-4">
                        <SimplePieChart data={processedData.tipoDeActo} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgendaDashboard;