// src/components/dashboards/FinanceDashboard.jsx

import React, { useState } from 'react';
import { DollarSign, BarChart, FileText, Gift, Briefcase, Star, Users } from 'lucide-react'; // Removed TrendingDown
import { useTranslation } from '../../context/TranslationContext.jsx';
import CardTitle from '../ui/CardTitle.jsx';
// Importar los nuevos componentes de pestañas
import FinanceSummaryTab from '../finance/FinanceSummaryTab.jsx';
import MembershipFeesTab from '../finance/MembershipFeesTab.jsx';
import DonationsTab from '../finance/DonationsTab.jsx';
import ServicesTab from '../finance/ServicesTab.jsx';
import ProjectsTab from '../finance/ProjectsTab.jsx';
import AuditsTab from '../finance/AuditsTab.jsx';
// ELIMINADO: FinanceCostsTab ya no es necesario

const TABS = [
    { id: 'summary', labelKey: 'finance.tab.summary', icon: BarChart },
    // { id: 'costs', labelKey: 'finance.admin_costs.title', icon: TrendingDown }, // --- ELIMINADO ---
    { id: 'fees', labelKey: 'finance.tab.fees', icon: Users },
    { id: 'donations', labelKey: 'finance.tab.donations', icon: Gift },
    { id: 'services', labelKey: 'finance.tab.services', icon: Briefcase },
    { id: 'projects', labelKey: 'finance.tab.projects', icon: Star },
    { id: 'audits', labelKey: 'finance.tab.audits', icon: FileText },
];

// ... (TabButton component sin cambios) ...
const TabButton = ({ isActive, onClick, label, icon: Icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold transition-all duration-300 rounded-lg 
            ${isActive 
                ? 'bg-sky-700 text-white shadow-md' 
                : 'text-gray-400 hover:bg-black/50 hover:text-white'
            }`
        }
    >
        <Icon className="w-4 h-4" />
        <span>{label}</span>
    </button>
);


const FinanceDashboard = ({ userId, db, role }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('summary');
    const isAdmin = role === 'admin';
    
    const visibleTabs = isAdmin 
        ? TABS 
        : TABS.filter(tab => tab.id === 'summary' || tab.id === 'audits');
    
    const renderTabContent = () => {
        switch (activeTab) {
            case 'summary':
                // role no es necesario para el resumen
                return <FinanceSummaryTab db={db} />;
            // case 'costs': // --- ELIMINADO ---
            //     return isAdmin ? <FinanceCostsTab db={db} userId={userId} role={role} /> : null;
            case 'fees':
                return isAdmin ? <MembershipFeesTab db={db} userId={userId} role={role} /> : null;
            case 'donations':
                return isAdmin ? <DonationsTab db={db} userId={userId} role={role} /> : null;
            case 'services':
                return isAdmin ? <ServicesTab db={db} userId={userId} role={role} /> : null;
            case 'projects':
                return isAdmin ? <ProjectsTab db={db} userId={userId} role={role} /> : null;
            case 'audits':
                return <AuditsTab db={db} userId={userId} role={role} />;
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
                <DollarSign className="w-8 h-8 mr-3 text-sky-400" />
                {t('sidebar.finance_dashboard')}
            </h1>

            {/* Contenedor de Pestañas */}
            <div className="mb-6 p-2 rounded-xl border border-sky-700/50 bg-black/40 backdrop-blur-lg flex flex-wrap gap-2">
                {visibleTabs.map(tab => (
                    <TabButton
                        key={tab.id}
                        isActive={activeTab === tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        label={t(tab.labelKey)}
                        icon={tab.icon}
                    />
                ))}
            </div>

            {/* Contenido de la Pestaña Activa */}
            <div>
                {renderTabContent()}
            </div>
        </div>
    );
};

export default FinanceDashboard;