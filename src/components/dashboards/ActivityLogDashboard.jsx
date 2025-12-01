import React, { useState } from 'react';
import { Clock, Loader2, Crown } from 'lucide-react'; 
import ActivityLogTable from '../tables/ActivityLogTable.jsx'; 
import ActivityLogForm from '../forms/ActivityLogForm.jsx'; 
import { useTranslation } from '../../context/TranslationContext.jsx'; 

const ActivityLogDashboard = ({ userId, db }) => { 
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
                <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
                <p className="ml-3 text-gray-500">{t('activity.loading')}</p> 
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <Clock className="w-8 h-8 mr-3 text-sky-600" />
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