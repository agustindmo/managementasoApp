import React from 'react';
import { 
    Users, 
    Database, 
    Calendar, 
    MessageSquare, 
    BookUser, 
    Shield, 
    DollarSign 
} from 'lucide-react';
import { useTranslation } from '../../context/TranslationContext.jsx';

const ModuleCard = ({ title, icon: Icon, description, onClick, colorClass }) => (
    <button 
        onClick={onClick}
        className="flex flex-col items-start p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300 text-left w-full group h-full"
    >
        <div className={`p-4 rounded-xl ${colorClass} group-hover:scale-110 transition-transform duration-300 mb-4`}>
            <Icon className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
            {title}
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed">
            {description}
        </p>
    </button>
);

const AdminMainDashboard = ({ onModuleSelect }) => {
    const { t } = useTranslation();

    const modules = [
        { 
            id: 'members', 
            label: t('sidebar.members'), // Now "Users"
            icon: Users, 
            desc: "Manage user profiles, approvals, and administrative settings.",
            color: "bg-blue-50 text-blue-600"
        },
        { 
            id: 'public_affairs', 
            label: t('sidebar.public_affairs'), 
            icon: Database, 
            desc: "Track policy data, activity logs, and strategic objectives.",
            color: "bg-indigo-50 text-indigo-600"
        },
        { 
            id: 'events_group', 
            label: t('sidebar.events_group'), 
            icon: Calendar, 
            desc: "Organize and manage events, schedules, and participation.",
            color: "bg-violet-50 text-violet-600"
        },
        { 
            id: 'communications', 
            label: t('sidebar.communications'), 
            icon: MessageSquare, 
            desc: "Monitor press logs, announcements, and media relations.",
            color: "bg-sky-50 text-sky-600"
        },
        { 
            id: 'database', 
            label: t('sidebar.members_module'), // Now "Members" (old Database)
            icon: BookUser, 
            desc: "Access directories for members, partners, and stakeholders.",
            color: "bg-emerald-50 text-emerald-600"
        },
        { 
            id: 'governance', 
            label: t('sidebar.governance'), 
            icon: Shield, 
            desc: "Manage governance meetings, legal documents, and compliance.",
            color: "bg-slate-100 text-slate-600"
        },
        { 
            id: 'finance', 
            label: t('sidebar.finance'), 
            icon: DollarSign, 
            desc: "Oversee financial summaries, donations, and project funding.",
            color: "bg-amber-50 text-amber-600"
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl font-extrabold text-slate-800 mb-3">
                        {t('admin.dashboard_title') || 'Admin Dashboard'}
                    </h1>
                    <p className="text-lg text-slate-500">
                        Select a module to access management tools and reports.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {modules.map((mod) => (
                        <ModuleCard
                            key={mod.id}
                            title={mod.label}
                            icon={mod.icon}
                            description={mod.desc}
                            onClick={() => onModuleSelect(mod.id)}
                            colorClass={mod.color}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminMainDashboard;