import React, { useState } from 'react';
import { Crown, Loader2, Users } from 'lucide-react'; 
import PolicyTable from '../tables/PolicyTable.jsx'; 
import AgendaForm from '../forms/AgendaForm.jsx';
import MilestoneForm from '../forms/MilestoneForm.jsx';
import UserAdminDashboard from './UserAdminDashboard.jsx'; 
import { useTranslation } from '../../context/TranslationContext.jsx'; 

const AdminDashboard = ({ userId, db, view: initialView = 'table' }) => { 
    const { t } = useTranslation(); 
    const [view, setView] = useState(initialView); 
    const [activeRecord, setActiveRecord] = useState(null); 
    const [recordType, setRecordType] = useState('agenda'); 
    
    const isDbReady = !!db;

    const handleOpenForm = (type, record = null) => {
        setRecordType(type);
        setActiveRecord(record);
        setView('form');
    };

    const handleCloseForm = () => {
        setView('table');
        setActiveRecord(null);
        setRecordType('agenda'); 
    };

    const renderContent = () => {
        switch (view) {
            case 'table':
                return (
                    <PolicyTable 
                        db={db} 
                        onOpenForm={handleOpenForm} 
                        userId={userId}
                    />
                );
            case 'form':
                if (recordType === 'agenda') {
                    return (
                        <AgendaForm 
                            userId={userId} 
                            db={db} 
                            initialData={activeRecord} 
                            onClose={handleCloseForm}
                            mode={activeRecord ? 'edit' : 'add'}
                        />
                    );
                } else if (recordType === 'milestone') {
                    return (
                        <MilestoneForm 
                            userId={userId} 
                            db={db} 
                            initialData={activeRecord} 
                            onClose={handleCloseForm}
                            mode={activeRecord ? 'edit' : 'add'}
                        />
                    );
                }
                return null; 
            default:
                return <p className="text-center text-slate-500 p-8">Select a view from the sidebar.</p>;
        }
    };


    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-6 flex items-center">
                <Crown className="w-8 h-8 mr-3 text-blue-600" />
                {t('policy.admin_title')}: {view === 'table' ? t('policy.data_management') : t('policy.data_entry')}
            </h1>
            
            <p className="text-sm text-slate-500 mb-4">
                {t('policy.user_id')}: <span className="font-mono text-xs p-1 bg-slate-100 rounded text-slate-600 border border-slate-200">{userId}</span>
            </p>

            <div className="w-full">
                {!isDbReady ? (
                    <div className="flex flex-col items-center justify-center h-48 rounded-xl bg-white border border-slate-200 shadow-sm">
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                        <p className="mt-3 text-slate-500">{t('policy.loading_db')}</p>
                    </div>
                ) : renderContent()}
            </div>
        </div>
    );
};

export default AdminDashboard;