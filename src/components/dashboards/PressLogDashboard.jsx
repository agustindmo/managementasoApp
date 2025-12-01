import React, { useState } from 'react';
import { Megaphone, Loader2 } from 'lucide-react'; 
import PressLogTable from '../tables/PressLogTable.jsx'; 
import PressLogForm from '../forms/PressLogForm.jsx'; 
import { useTranslation } from '../../context/TranslationContext.jsx'; 

const PressLogDashboard = ({ userId, db }) => { 
    const { t } = useTranslation(); 
    const [view, setView] = useState('table'); 
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
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="ml-3 text-slate-500">{t('press_log.loading')}</p> 
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-6 flex items-center">
                <Megaphone className="w-8 h-8 mr-3 text-blue-600" />
                {t('sidebar.press_log')}
            </h1>
            
            <div className="w-full">
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
        </div>
    );
};

export default PressLogDashboard;