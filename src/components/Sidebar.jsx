// src/components/Sidebar.jsx

import React from 'react';
import { useTranslation } from '../context/TranslationContext.jsx'; 
import { 
    BarChart2, 
    Briefcase, 
    Database, 
    Calendar, 
    Target, 
    Users, 
    Settings, 
    MessageSquare, 
    Clock,
    User,
    List,
    Megaphone,
    UserPlus,
    UserCheck,
    DollarSign,
    Handshake,
    // TAREA 8: Nuevo icono
    Radio
} from 'lucide-react'; 

// Componente helper para los títulos de grupo
const SidebarGroup = ({ title }) => (
    <h3 className="px-3 pt-6 pb-2 text-xs font-semibold uppercase tracking-wider text-sky-400/80">
        {title}
    </h3>
);

// Componente helper para los enlaces de navegación
const SidebarLink = ({ label, icon: Icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
            isActive
                ? 'bg-sky-700 text-white font-semibold shadow-inner' 
                : 'text-sky-200 hover:text-white hover:bg-sky-800/60'
        }`}
    >
        <Icon className="w-5 h-5 flex-shrink-0 opacity-90" />
        <span className="text-sm font-medium">{label}</span>
    </button>
);

const Sidebar = ({ activeView, setActiveView, isDashboard, role }) => {
    const { t } = useTranslation(); 

    const ALL_VIEWS = [
        // Group: Members
        // 'admin' quitado de user_profile
        { id: 'user_profile', labelKey: 'sidebar.user_profile', icon: User, requiredRole: ['director', 'user'], group: 'members' },
        { id: 'user_admin', labelKey: 'sidebar.user_admin', icon: Settings, requiredRole: ['admin'], group: 'members' },
        { id: 'admin_profiles', labelKey: 'sidebar.admin_profiles', icon: List, requiredRole: ['admin'], group: 'members' },
        { id: 'new_member_request', labelKey: 'sidebar.new_member_request', icon: UserPlus, requiredRole: ['admin'], group: 'members' },
        // --- MODIFICADO: 'directorinvitee' quitado de requiredRole ---
        { id: 'member_approvals', labelKey: 'sidebar.member_approvals', icon: UserCheck, requiredRole: ['director'], group: 'members' },

        // Group: Public Affairs
        { id: 'policy_data', labelKey: 'sidebar.policy_data', icon: Database, requiredRole: ['admin'], group: 'public_affairs' },
        { id: 'activity_log', labelKey: 'sidebar.activity_log', icon: Clock, requiredRole: ['admin'], group: 'public_affairs' }, 
        { id: 'resumen', labelKey: 'sidebar.summary', icon: BarChart2, requiredRole: ['admin', 'director', 'user', 'directorinvitee', 'userinvitee'], group: 'public_affairs' }, 
        { id: 'logros', labelKey: 'sidebar.achievements', icon: Briefcase, requiredRole: ['admin', 'director', 'user', 'directorinvitee', 'userinvitee'], group: 'public_affairs' },
        { id: 'objectivos', labelKey: 'sidebar.objectives', icon: Target, requiredRole: ['admin', 'director', 'directorinvitee'], group: 'public_affairs' },
        { id: 'agenda_view', labelKey: 'sidebar.agenda_view', icon: Calendar, requiredRole: ['admin', 'director', 'directorinvitee'], group: 'public_affairs' },
        { id: 'stakeholder_map', labelKey: 'sidebar.stakeholder_map', icon: Users, requiredRole: ['admin', 'director', 'directorinvitee'], group: 'public_affairs' },

        // Group: Communications
        { id: 'communications_log', labelKey: 'sidebar.communications_log', icon: MessageSquare, requiredRole: ['admin'], group: 'communications' }, 
        { id: 'press_log', labelKey: 'sidebar.press_log', icon: Megaphone, requiredRole: ['admin'], group: 'communications' },
        { id: 'media_stakeholder_map', labelKey: 'sidebar.media_stakeholder_map', icon: Radio, requiredRole: ['admin', 'director', 'directorinvitee'], group: 'communications' },

        // Group: Finance
        { id: 'finance_dashboard', labelKey: 'sidebar.finance_dashboard', icon: DollarSign, requiredRole: ['admin'], group: 'finance' },
        { id: 'finance_relations', labelKey: 'sidebar.finance_relations', icon: Handshake, requiredRole: ['admin'], group: 'finance' },
    ];

    const visibleItems = ALL_VIEWS.filter(item => item.requiredRole.includes(role)); 
    
    const groups = {
        members: { title: t('sidebar.members'), items: visibleItems.filter(i => i.group === 'members') },
        public_affairs: { title: t('sidebar.public_affairs'), items: visibleItems.filter(i => i.group === 'public_affairs') },
        communications: { title: t('sidebar.communications'), items: visibleItems.filter(i => i.group === 'communications') },
        finance: { title: t('sidebar.finance'), items: visibleItems.filter(i => i.group === 'finance') },
    };
    
    if (!isDashboard) return null;

    return (
        <nav className="w-64 flex-shrink-0 bg-gradient-to-br from-sky-950/95 via-black/90 to-black/95 h-screen fixed top-0 left-0 z-30 shadow-2xl flex flex-col">
            
            <div className="p-4 pt-6 pb-4">
                <div className="text-2xl font-bold tracking-wider text-white px-2">
                    UMange
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-1 px-4 pb-4 no-scrollbar">
                {Object.entries(groups).map(([key, group]) => (
                    group.items.length > 0 && (
                        <div key={key}>
                            <SidebarGroup title={group.title} />
                            <div className="space-y-1">
                                {group.items.map((item) => (
                                    <SidebarLink
                                        key={item.id}
                                        label={t(item.labelKey)}
                                        icon={item.icon}
                                        isActive={activeView === item.id}
                                        onClick={() => setActiveView(item.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )
                ))}
            </div>
        </nav>
    );
};

export default Sidebar;