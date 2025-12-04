import React from 'react';
import { useTranslation } from '../context/TranslationContext.jsx'; 
import { 
    BarChart2, Briefcase, Database, Calendar, Target, Users, Settings, 
    MessageSquare, Clock, User, Megaphone, UserPlus, UserCheck, 
    DollarSign, Handshake, Radio, BookUser, Users2, Shield, Rss, 
    ArrowLeft 
} from 'lucide-react'; 

const SidebarGroup = ({ title }) => (
    <h3 className="px-3 pt-6 pb-2 text-xs font-bold uppercase tracking-wider text-blue-200/60">
        {title}
    </h3>
);

const SidebarLink = ({ label, icon: Icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 border border-transparent ${
            isActive
                ? 'bg-blue-600 text-white shadow-md border-blue-500/30' 
                : 'text-blue-100 hover:bg-white/10 hover:text-white'
        }`}
    >
        <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-blue-300'}`} />
        <span className="text-sm font-medium">{label}</span>
    </button>
);

const Sidebar = ({ activeView, setActiveView, isDashboard, role, currentModule, onGoBack }) => {
    const { t } = useTranslation(); 

    const ALL_VIEWS = [
        // --- Group: Users (Old Members) ---
        { id: 'user_profile', labelKey: 'sidebar.user_profile', icon: User, requiredRole: ['director', 'user'], group: 'members' },
        { id: 'user_admin', labelKey: 'sidebar.user_admin', icon: Settings, requiredRole: ['admin'], group: 'members' },
        // REMOVED: admin_profiles
        { id: 'member_approvals', labelKey: 'sidebar.member_approvals', icon: UserCheck, requiredRole: ['director'], group: 'members' },

        // --- Group: Public Affairs ---
        { id: 'policy_data', labelKey: 'sidebar.agenda_and_milestones', icon: Database, requiredRole: ['admin'], group: 'public_affairs', section: 'data_input' }, 
        { id: 'activity_log', labelKey: 'sidebar.activity_log', icon: Clock, requiredRole: ['admin'], group: 'public_affairs', section: 'data_input' },
        { id: 'resumen', labelKey: 'sidebar.summary', icon: BarChart2, requiredRole: ['admin', 'director', 'user', 'directorinvitee', 'userinvitee'], group: 'public_affairs', section: 'dashboards' }, 
        { id: 'logros', labelKey: 'sidebar.achievements', icon: Briefcase, requiredRole: ['admin', 'director', 'user', 'directorinvitee', 'userinvitee'], group: 'public_affairs', section: 'dashboards' },
        { id: 'objectivos', labelKey: 'sidebar.objectives', icon: Target, requiredRole: ['admin', 'director', 'directorinvitee'], group: 'public_affairs', section: 'dashboards' },
        { id: 'agenda_view', labelKey: 'sidebar.agenda_view', icon: Calendar, requiredRole: ['admin', 'director', 'directorinvitee'], group: 'public_affairs', section: 'dashboards' },
        { id: 'stakeholder_map', labelKey: 'sidebar.stakeholder_map', icon: Users, requiredRole: ['admin', 'director', 'directorinvitee'], group: 'public_affairs', section: 'dashboards' },
        { id: 'communications_log', labelKey: 'sidebar.communications_log', icon: MessageSquare, requiredRole: ['admin'], group: 'public_affairs', section: 'dashboards' }, 

        // --- Group: Events ---
        { id: 'events', labelKey: 'sidebar.events', icon: Calendar, requiredRole: ['admin', 'director', 'user', 'directorinvitee', 'userinvitee'], group: 'events_group' },

        // --- Group: Communications ---
        { id: 'press_log', labelKey: 'sidebar.press_log', icon: Megaphone, requiredRole: ['admin'], group: 'communications' },
        { id: 'media_stakeholder_map', labelKey: 'sidebar.media_stakeholder_map', icon: Radio, requiredRole: ['admin', 'director', 'directorinvitee'], group: 'communications' },
        { id: 'bulletin_board', labelKey: 'sidebar.bulletin_board', icon: Rss, requiredRole: ['admin', 'director', 'user', 'directorinvitee', 'userinvitee'], group: 'communications' },

        // --- Group: Members (Old Database) ---
        // MOVED HERE: New Member Request
        { id: 'new_member_request', labelKey: 'sidebar.new_member_request', icon: UserPlus, requiredRole: ['admin'], group: 'database' },
        { id: 'member_directory', labelKey: 'sidebar.member_directory', icon: BookUser, requiredRole: ['admin', 'director', 'user', 'directorinvitee', 'userinvitee'], group: 'database' },
        { id: 'board_directory', labelKey: 'sidebar.board_directory', icon: Users, requiredRole: ['admin', 'director', 'directorinvitee'], group: 'database' },
        { id: 'public_affairs_directory', labelKey: 'sidebar.public_affairs_directory', icon: Users, requiredRole: ['admin', 'director', 'directorinvitee'], group: 'database' },
        { id: 'media_directory', labelKey: 'sidebar.media_directory', icon: Radio, requiredRole: ['admin', 'director', 'directorinvitee'], group: 'database' },
        { id: 'partners_directory', labelKey: 'sidebar.partners_directory', icon: Handshake, requiredRole: ['admin', 'director', 'directorinvitee'], group: 'database' },
        { id: 'commissions_directory', labelKey: 'sidebar.commissions_directory', icon: Users2, requiredRole: ['admin', 'director', 'directorinvitee'], group: 'database' },

        // --- Group: Governance ---
        { id: 'governance', labelKey: 'sidebar.governance', icon: Shield, requiredRole: ['admin', 'director', 'user', 'directorinvitee', 'userinvitee'], group: 'governance' },

        // --- Group: Finance ---
        { id: 'finance_dashboard', labelKey: 'sidebar.finance_dashboard', icon: DollarSign, requiredRole: ['admin'], group: 'finance' },
        { id: 'finance_relations', labelKey: 'sidebar.finance_relations', icon: Handshake, requiredRole: ['admin'], group: 'finance' },
    ];

    let visibleItems = ALL_VIEWS.filter(item => item.requiredRole.includes(role));
    
    if (role === 'admin' && currentModule) {
        visibleItems = visibleItems.filter(item => item.group === currentModule);
    }
    
    let groups = {};

    if (role === 'admin' && currentModule === 'public_affairs') {
        groups = {
            data_input: { 
                title: t('sidebar.data_input'), 
                items: visibleItems.filter(i => i.section === 'data_input') 
            },
            dashboards: { 
                title: t('sidebar.dashboards'), 
                items: visibleItems.filter(i => i.section === 'dashboards') 
            }
        };
    } else {
        groups = {
            // Renamed Group Title to "Users"
            members: { title: t('sidebar.members'), items: visibleItems.filter(i => i.group === 'members') },
            public_affairs: { title: t('sidebar.public_affairs'), items: visibleItems.filter(i => i.group === 'public_affairs') },
            events_group: { title: t('sidebar.events_group'), items: visibleItems.filter(i => i.group === 'events_group') }, 
            communications: { title: t('sidebar.communications'), items: visibleItems.filter(i => i.group === 'communications') },
            // Renamed Group Title to "Members" (using the new key)
            database: { title: t('sidebar.members_module'), items: visibleItems.filter(i => i.group === 'database') }, 
            governance: { title: t('sidebar.governance'), items: visibleItems.filter(i => i.group === 'governance') },
            finance: { title: t('sidebar.finance'), items: visibleItems.filter(i => i.group === 'finance') },
        };
    }
    
    if (!isDashboard) return null;

    return (
        <nav className="w-64 flex-shrink-0 bg-[#0f172a] border-r border-gray-800 h-screen fixed top-0 left-0 z-30 shadow-2xl flex flex-col">
            <div className="p-4 pt-6 pb-4 bg-[#0f172a]">
                <div className="flex items-center space-x-2 px-2 mb-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                         <span className="text-white font-bold text-xl">U</span>
                    </div>
                    <span className="text-2xl font-bold tracking-wide text-white">
                        Manage
                    </span>
                </div>
                
                {role === 'admin' && currentModule && (
                    <button 
                        onClick={onGoBack}
                        className="mt-4 flex items-center w-full px-3 py-2 text-sm text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {t('common.back_to_dashboard') || 'Main Menu'}
                    </button>
                )}
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