// src/components/dashboards/FinanceDashboard.jsx

import React, { useState } from 'react';
import { DollarSign, BarChart, FileText, Gift, Briefcase, Star, Users } from 'lucide-react'; 
import { useTranslation } from '../../context/TranslationContext.jsx';
import CardTitle from '../ui/CardTitle.jsx';
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
    { id: 'audits', labelKey: 'finance.tab.audits', icon: FileText },
];

const TabButton = ({ isActive, onClick, label, icon: Icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold transition-all duration-300 rounded-lg border 
            ${isActive 
                ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
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
                return <FinanceSummaryTab db={db} />;
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
            <h1 className="text-3xl font-bold text-slate-800 mb-6 flex items-center">
                <DollarSign className="w-8 h-8 mr-3 text-blue-600" />
                {t('sidebar.finance_dashboard')}
            </h1>

            <div className="mb-6 p-2 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-wrap gap-2">
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

            <div>
                {renderTabContent()}
            </div>
        </div>
    );
};

export default FinanceDashboard;