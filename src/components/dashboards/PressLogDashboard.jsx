// src/components/dashboards/PressLogDashboard.jsx

import React, { useState } from 'react';
import { Megaphone, Loader2 } from 'lucide-react'; // Nuevo icono
import { useTranslation } from '../../context/TranslationContext.jsx';
import PressLogTable from '../tables/PressLogTable.jsx'; // Nueva tabla
import PressLogForm from '../forms/PressLogForm.jsx'; // Nuevo formulario

const PressLogDashboard = ({ userId, db }) => { 
    const { t } = useTranslation();
    const [view, setView] = useState('table'); // 'table' or 'form'
    const [activeRecord, setActiveRecord] = useState(null); 
    
    const isDbReady = !!db;

    const handleOpenForm = (record = null) => {
        setActiveRecord(record);
        setView('form');
    };

    const handleCloseForm = () => {
        setView('table');
        setActiveRecord(null);
    };

    if (!isDbReady) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="ml-3 text-sky-200">{t('press_log.loading')}</p>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
                <Megaphone className="w-8 h-8 mr-3 text-sky-400" />
                {t('press_log.title')}
            </h1>
            
            {view === 'table' ? (
                 <PressLogTable
                    db={db} 
                    onOpenForm={handleOpenForm} 
                />
            ) : (
                 <PressLogForm
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

export default PressLogDashboard;