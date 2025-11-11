// src/components/dashboards/FinanceAuditDashboard.jsx

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react'; 
import { useTranslation } from '../../context/TranslationContext.jsx';
import FinanceAuditTable from '../tables/FinanceAuditTable.jsx';
import FinanceAuditForm from '../forms/FinanceAuditForm.jsx';

const FinanceAuditDashboard = ({ userId, db, role }) => { // <-- role prop
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
                 <FinanceAuditTable
                    db={db} 
                    onOpenForm={handleOpenForm} 
                    role={role} // <-- Pass role
                />
            ) : (
                 <FinanceAuditForm
                    userId={userId} 
                    db={db} 
                    initialData={activeRecord} 
                    onClose={handleCloseForm}
                    mode={activeRecord ? 'edit' : 'add'}
                    role={role} // <-- Pass role
                />
            )}
        </div>
    );
};

export default FinanceAuditDashboard;