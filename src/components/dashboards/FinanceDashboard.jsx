// src/components/dashboards/FinanceDashboard.jsx

import React, { useState } from 'react';
import { DollarSign, BarChart, FileText, Gift, Briefcase, Star, Users } from 'lucide-react'; // Importado Users
import { useTranslation } from '../../context/TranslationContext.jsx';
import CardTitle from '../ui/CardTitle.jsx';
// Importar los nuevos componentes de pestañas
import FinanceSummaryTab from '../finance/FinanceSummaryTab.jsx';
import MembershipFeesTab from '../finance/MembershipFeesTab.jsx';
import DonationsTab from '../finance/DonationsTab.jsx';
import ServicesTab from '../finance/ServicesTab.jsx';
import ProjectsTab from '../finance/ProjectsTab.jsx';
import AuditsTab from '../finance/AuditsTab.jsx';

const TABS = [
    { id: 'summary', labelKey: 'finance.tab.summary', icon: BarChart },
    { id: 'fees', labelKey: 'finance.tab.fees', icon: Users },
    { id: 'donations', labelKey: 'finance.tab.donations', icon: Gift },
    { id: 'services', labelKey: 'finance.tab.services', icon: Briefcase },
    { id: 'projects', labelKey: 'finance.tab.projects', icon: Star },
    // *** CORRECCIÓN: 'id:key' cambiado a 'id' ***
    { id: 'audits', labelKey: 'finance.tab.audits', icon: FileText },
];

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

const FinanceDashboard = ({ userId, db }) => { 
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('summary');
    
    const renderTabContent = () => {
        switch (activeTab) {
            case 'summary':
                return <FinanceSummaryTab db={db} />;
            case 'fees':
                return <MembershipFeesTab db={db} userId={userId} />;
            case 'donations':
                return <DonationsTab db={db} userId={userId} />;
            case 'services':
                return <ServicesTab db={db} userId={userId} />;
            case 'projects':
                return <ProjectsTab db={db} userId={userId} />;
            case 'audits':
                return <AuditsTab db={db} userId={userId} />;
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
                {TABS.map(tab => (
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