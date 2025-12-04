import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { BarChart2, TrendingUp, Globe, Mail, Radio, Users, Activity } from 'lucide-react'; // Fixed: Added Activity
import { getDbPaths } from '../../services/firebase.js';
import SimpleBarChart from '../charts/SimpleBarChart.jsx';
import CardTitle from '../ui/CardTitle.jsx';

const KPICard = ({ title, value, icon: Icon, color }) => (
    <div className={`p-5 rounded-xl border border-${color}-100 bg-${color}-50 flex items-center space-x-4`}>
        <div className={`p-3 bg-white rounded-full shadow-sm text-${color}-600`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className={`text-2xl font-bold text-${color}-900`}>{value.toLocaleString()}</p>
            <p className={`text-xs font-medium text-${color}-600 uppercase`}>{title}</p>
        </div>
    </div>
);

const CommunicationsImpactDashboard = ({ db }) => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const path = getDbPaths().communicationsImpact || 'communications_impact';
        const logRef = ref(db, path);
        
        return onValue(logRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setLogs(Object.keys(data).map(key => ({ id: key, ...data[key] })));
            } else {
                setLogs([]);
            }
        });
    }, [db]);

    const stats = useMemo(() => {
        const acc = {
            rrss_impressions: 0,
            web_sessions: 0,
            emails_sent: 0,
            press_mentions: 0,
            total_attendees: 0,
            strategies: {}
        };

        logs.forEach(log => {
            const m = log.metrics || {};
            // Sum up metrics based on keys from constants
            acc.rrss_impressions += Number(m.impresiones_rrss || 0);
            acc.web_sessions += Number(m.sesiones_web || 0);
            acc.emails_sent += Number(m.emails_enviados || 0);
            acc.press_mentions += Number(m.n_menciones_medios || 0);
            acc.total_attendees += Number(m.asistentes_totales || 0);

            // Chart data
            if(log.area) {
                acc.strategies[log.area] = (acc.strategies[log.area] || 0) + 1;
            }
        });

        const chartData = Object.entries(acc.strategies).map(([name, count]) => ({ name, count }));
        return { ...acc, chartData };
    }, [logs]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <KPICard title="Social Impressions" value={stats.rrss_impressions} icon={Globe} color="blue" />
                <KPICard title="Web Sessions" value={stats.web_sessions} icon={Radio} color="indigo" />
                <KPICard title="Emails Sent" value={stats.emails_sent} icon={Mail} color="emerald" />
                <KPICard title="Press Mentions" value={stats.press_mentions} icon={TrendingUp} color="amber" />
                <KPICard title="Event Attendees" value={stats.total_attendees} icon={Users} color="rose" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart Area */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[350px]">
                    <CardTitle title="Activities by Strategic Area" icon={BarChart2} />
                    <div className="mt-4 h-64 flex justify-center">
                        {stats.chartData.length > 0 ? (
                            <SimpleBarChart data={stats.chartData} fillColor="#6366f1" />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400">
                                No activity data recorded yet
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity List */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <CardTitle title="Recent Impact Logs" icon={Activity} />
                    <div className="mt-4 overflow-y-auto max-h-64 space-y-3">
                        {logs.slice().reverse().slice(0, 5).map(log => (
                            <div key={log.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                                <div className="flex justify-between font-bold text-slate-700">
                                    <span>{log.title}</span>
                                    <span className="text-xs font-normal text-slate-500">{log.date}</span>
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                    {log.area} • {log.canal}
                                </div>
                            </div>
                        ))}
                         {logs.length === 0 && <p className="text-slate-400 text-center">No logs found.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommunicationsImpactDashboard;