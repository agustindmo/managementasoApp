// src/components/dashboards/ActivityLogDashboard.jsx

import React, { useState } from 'react';
import { Clock, Loader2, Crown } from 'lucide-react'; 
import ActivityLogTable from '../tables/ActivityLogTable.jsx'; 
import ActivityLogForm from '../forms/ActivityLogForm.jsx'; 
import { useTranslation } from '../../context/TranslationContext.jsx'; // Tarea 2

// Update signature to accept 'db' and 'userId' props
const ActivityLogDashboard = ({ userId, db }) => { 
    const { t } = useTranslation(); // Tarea 2
    // State to toggle between the Table view and the Form view
    const [view, setView] = useState('table'); // 'table' or 'form'
    // State to hold the record being edited, or null for new entry
    const [activeRecord, setActiveRecord] = useState(null); 
    
    const isDbReady = !!db;

    // Handler to switch to form view (for adding or editing)
    const handleOpenForm = (type, record = null) => {
        setActiveRecord(record);
        setView('form');
    };

    // Handler to close form and return to table view
    const handleCloseForm = () => {
        setView('table');
        setActiveRecord(null);
    };

    if (!isDbReady) {
        return (
            <div className="flex justify-center items-center p-8">
                {/* Tarea 1: Colores de Spinner y texto actualizados */}
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="ml-3 text-sky-200">{t('activity.loading')}</p> 
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            {/* Tarea 1: Título y color de icono actualizados */}
            <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
                <Clock className="w-8 h-8 mr-3 text-sky-400" />
                {t('activity.title')}
            </h1>
            
            {view === 'table' ? (
                 <ActivityLogTable 
                    db={db} 
                    onOpenForm={handleOpenForm} 
                />
            ) : (
                 <ActivityLogForm
                    userId={userId} 
                    db={db} 
                    initialData={activeRecord} 
                    onClose={handleCloseForm}
                    mode={activeRecord ? 'edit' : 'add'}
                />
            )}
        </div>
    );
};

export default ActivityLogDashboard;