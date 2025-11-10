import React, { useState } from 'react';
import { Crown, Loader2, Users } from 'lucide-react'; 
import PolicyTable from '../tables/PolicyTable.jsx'; 
import AgendaForm from '../forms/AgendaForm.jsx';
import MilestoneForm from '../forms/MilestoneForm.jsx';
import UserAdminDashboard from './UserAdminDashboard.jsx'; 
import { useTranslation } from '../../context/TranslationContext.jsx'; // Tarea 2

const AdminDashboard = ({ userId, db, view: initialView = 'table' }) => { 
    const { t } = useTranslation(); // Tarea 2
    // State to toggle between the Table view and the Form view
    const [view, setView] = useState(initialView); 
    // State to hold the record being edited, or null for new entry
    const [activeRecord, setActiveRecord] = useState(null); 
    // State to define which type of record (agenda/milestone) is being processed
    const [recordType, setRecordType] = useState('agenda'); 
    
    const isDbReady = !!db;

    // Handler to switch to form view (for adding or editing)
    const handleOpenForm = (type, record = null) => {
        setRecordType(type);
        setActiveRecord(record);
        setView('form');
    };

    // Handler to close form and return to table view
    const handleCloseForm = () => {
        setView('table');
        setActiveRecord(null);
        setRecordType('agenda'); // Reset type default
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
                return null; // Should not happen
            default:
                // Note: user_admin is now typically handled higher up in App.jsx
                return <p className="text-center text-gray-500 p-8">Select a view from the sidebar.</p>;
        }
    };


    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            {/* Tarea 1: Título y color de icono actualizados */}
            <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
                <Crown className="w-8 h-8 mr-3 text-sky-400" />
                {t('policy.admin_title')}: {view === 'table' ? t('policy.data_management') : t('policy.data_entry')}
            </h1>
            {/* Tarea 1: Estilo de texto actualizado */}
            <p className="text-sm text-gray-400 mb-4">
                {t('policy.user_id')}: <span className="font-mono text-xs p-1 bg-sky-950/50 rounded">{userId}</span>
            </p>

            <div className="w-full">
                {!isDbReady ? (
                    <div className="flex flex-col items-center justify-center h-48 rounded-xl">
                        {/* Tarea 1: Colores de Spinner y texto actualizados */}
                        <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
                        <p className="mt-3 text-sky-200">{t('policy.loading_db')}</p>
                    </div>
                ) : renderContent()}
            </div>
        </div>
    );
};

export default AdminDashboard;