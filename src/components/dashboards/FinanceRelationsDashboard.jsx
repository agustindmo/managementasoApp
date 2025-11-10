// src/components/dashboards/FinanceRelationsDashboard.jsx

import React, { useState } from 'react';
import { Handshake, Gift, Users, Truck } from 'lucide-react'; 
import { useTranslation } from '../../context/TranslationContext.jsx';
import FinanceProviderDashboard from './FinanceProviderDashboard.jsx';
import FinanceDonorsTab from '../finance/FinanceDonorsTab.jsx';
import FinanceBeneficiariesTab from '../finance/FinanceBeneficiaresTab.jsx';
import FinancePartnersTab from '../finance/FinancePartnerTab.jsx';

const TABS = [
    { id: 'providers', labelKey: 'finance.providers.title', icon: Truck },
    { id: 'donors', labelKey: 'finance.relations.donors_title', icon: Gift },
    { id: 'beneficiaries', labelKey: 'finance.relations.beneficiaries_title', icon: Users },
    { id: 'partners', labelKey: 'finance.relations.partners_title', icon: Handshake },
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

const FinanceRelationsDashboard = ({ userId, db }) => { 
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('providers');
    
    const renderTabContent = () => {
        switch (activeTab) {
            case 'providers':
                return <FinanceProviderDashboard db={db} userId={userId} />;
            case 'donors':
                return <FinanceDonorsTab db={db} />;
            case 'beneficiaries':
                return <FinanceBeneficiariesTab db={db} />;
            case 'partners':
                return <FinancePartnersTab db={db} />;
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
                <Handshake className="w-8 h-8 mr-3 text-sky-400" />
                {t('sidebar.finance_relations')}
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

export default FinanceRelationsDashboard;