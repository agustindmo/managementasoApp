import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { MessageSquare, Loader2, Users, TrendingUp, Calendar, BarChart2 } from 'lucide-react'; 
import { getDbPaths } from '../../services/firebase.js';
import { useTranslation } from '../../context/TranslationContext.jsx';
import CardTitle from '../ui/CardTitle.jsx';
import CommunicationsTable from '../tables/CommunicationsTable.jsx';
import SimpleBarChart from '../charts/SimpleBarChart.jsx';

// Helper to convert Firebase snapshot to array
const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({ id: key, ...val[key] }));
};

// Metric Card Component
const MetricCard = ({ title, value, label, icon: Icon, colorClass }) => (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center space-x-4 hover:shadow-md transition-all">
        <div className={`p-3 rounded-full ${colorClass.bg} ${colorClass.text}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-2xl font-extrabold text-slate-800">{value}</p>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            {label && <p className="text-xs text-slate-400 mt-1">{label}</p>}
        </div>
    </div>
);

const CommunicationsDashboard = ({ db }) => { 
    const { t } = useTranslation(); 
    const [agendaItems, setAgendaItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!db) return;
        // Strict source: Agenda items only
        const agendaRef = ref(db, getDbPaths().agenda);
        const unsubscribe = onValue(agendaRef, (snapshot) => {
            try {
                setAgendaItems(snapshotToArray(snapshot));
            } catch (e) {
                console.error("Error processing Agenda snapshot:", e);
            } finally {
                setIsLoading(false);
            }
        }, (error) => {
            console.error("Agenda Subscription Error:", error);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [db]);

    // --- Data Processing for Dashboard ---
    const { allMessages, metrics, stakeholderChartData } = useMemo(() => {
        const messages = [];
        const stakeholderCounts = {};
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        let recentCount = 0;

        agendaItems.forEach(item => {
            if (item.commsMessages && Array.isArray(item.commsMessages)) {
                item.commsMessages.forEach((msg, index) => {
                    // Flatten message data for the table
                    messages.push({
                        id: `${item.id}-${index}`, // Unique composite ID
                        agendaItemName: item.nombre || 'Untitled Agenda',
                        solicitud: item.solicitud || 'N/A',
                        ...msg,
                        stakeholders: msg.stakeholderKeys || []
                    });

                    // Metrics: Recent Messages (This Month)
                    if (msg.date) {
                        const msgDate = new Date(msg.date);
                        if (msgDate.getMonth() === currentMonth && msgDate.getFullYear() === currentYear) {
                            recentCount++;
                        }
                    }

                    // Metrics: Stakeholder Counts
                    (msg.stakeholderKeys || []).forEach(stakeholder => {
                        stakeholderCounts[stakeholder] = (stakeholderCounts[stakeholder] || 0) + 1;
                    });
                });
            }
        });

        // Chart Data: Top 5 Stakeholders
        const sortedStakeholders = Object.entries(stakeholderCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            allMessages: messages.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)),
            metrics: {
                total: messages.length,
                activeStakeholders: Object.keys(stakeholderCounts).length,
                recent: recentCount
            },
            stakeholderChartData: sortedStakeholders
        };
    }, [agendaItems]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-12 h-96">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="ml-4 text-lg text-slate-500 font-medium">{t('comms.loading') || 'Loading...'}</p>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                        <MessageSquare className="w-8 h-8 mr-3 text-blue-600" />
                        {t('comms.messages_title') || 'Messages'} 
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Communications linked to Agenda items.
                    </p>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard 
                    title={t('comms.metric.total_messages') || 'Total Messages'}
                    value={metrics.total}
                    icon={MessageSquare}
                    colorClass={{ bg: 'bg-blue-50', text: 'text-blue-600' }}
                />
                <MetricCard 
                    title={t('comms.metric.active_stakeholders') || 'Active Stakeholders'}
                    value={metrics.activeStakeholders}
                    icon={Users}
                    colorClass={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }}
                />
                <MetricCard 
                    title={t('comms.metric.recent_activity') || 'This Month'}
                    value={metrics.recent}
                    icon={Calendar}
                    colorClass={{ bg: 'bg-amber-50', text: 'text-amber-600' }}
                />
            </div>

            {/* Charts & Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[300px] flex flex-col">
                    <CardTitle 
                        title={t('comms.chart.top_stakeholders') || 'Top Engaged Stakeholders'} 
                        icon={BarChart2} 
                    />
                    <div className="p-4 flex-1 flex items-center justify-center">
                        {stakeholderChartData.length > 0 ? (
                            <SimpleBarChart data={stakeholderChartData} fillColor="#3b82f6" />
                        ) : (
                            <p className="text-slate-400 italic">No data available</p>
                        )}
                    </div>
                </div>
                
                {/* Summary Info */}
                <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm p-6 flex flex-col justify-center items-center text-center">
                    <TrendingUp className="w-12 h-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Message Tracker</h3>
                    <p className="text-slate-500 max-w-md">
                        This dashboard displays messages recorded directly within the <strong>Agenda</strong> module. 
                        To add a new message, go to Data Input and edit an Agenda item.
                    </p>
                </div>
            </div>

            {/* Detailed Table */}
            <div>
                <CommunicationsTable data={allMessages} />
            </div>
        </div>
    );
};

export default CommunicationsDashboard;