// src/components/dashboards/GovernanceDashboard.jsx

import React, { useState } from 'react';
import { Shield, FileText, Calendar } from 'lucide-react'; 
import { useTranslation } from '../../context/TranslationContext.jsx';
import LegalDocumentsTab from '../governance/LegalDocumentsTab.jsx';
import MeetingsTab from '../governance/MeetingsTab.jsx'; // --- NUEVO ---

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

const GovernanceDashboard = ({ userId, db, role }) => { 
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('meetings'); // Default a 'meetings'
    
    // --- MODIFICADO: Quitado el placeholder ---
    const renderTabContent = () => {
        switch (activeTab) {
            case 'meetings':
                return <MeetingsTab db={db} userId={userId} role={role} />;
            case 'documents':
                return <LegalDocumentsTab db={db} userId={userId} role={role} />;
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
                <Shield className="w-8 h-8 mr-3 text-sky-400" />
                {t('sidebar.governance')}
            </h1>

            {/* Contenedor de Pestañas */}
            <div className="mb-6 p-2 rounded-xl border border-sky-700/50 bg-black/40 backdrop-blur-lg flex flex-wrap gap-2">
                <TabButton
                    key="meetings"
                    isActive={activeTab === 'meetings'}
                    onClick={() => setActiveTab('meetings')}
                    label={t('governance.tab.meetings')}
                    icon={Calendar}
                />
                <TabButton
                    key="documents"
                    isActive={activeTab === 'documents'}
                    onClick={() => setActiveTab('documents')}
                    label={t('governance.tab.documents')}
                    icon={FileText}
                />
            </div>

            {/* Contenido de la Pestaña Activa */}
            <div>
                {renderTabContent()}
            </div>
        </div>
    );
};

export default GovernanceDashboard;