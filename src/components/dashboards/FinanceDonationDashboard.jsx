// src/components/dashboards/FinanceDonationDashboard.jsx

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react'; 
import { useTranslation } from '../../context/TranslationContext.jsx';
import FinanceDonationTable from '../tables/FinanceDonationTable.jsx';
import FinanceDonationForm from '../forms/FinanceDonationForm.jsx';

const FinanceDonationDashboard = ({ userId, db }) => { 
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
        <div className="w-full">
            {view === 'table' ? (
                 <FinanceDonationTable
                    db={db} 
                    onOpenForm={handleOpenForm} 
                />
            ) : (
                 <FinanceDonationForm
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

export default FinanceDonationDashboard;