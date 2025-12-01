import React, { useState } from 'react';
import { Loader2 } from 'lucide-react'; 
import { useTranslation } from '../../context/TranslationContext.jsx';
import FinanceCostTable from '../tables/FinanceCostTable.jsx';
import FinanceCostForm from '../forms/FinanceCosteForm.jsx';

const FinanceCostDashboard = ({ userId, db, costType, role }) => { 
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
        <div className="w-full">
            {view === 'table' ? (
                 <FinanceCostTable
                    db={db} 
                    onOpenForm={handleOpenForm} 
                    costType={costType}
                    role={role} 
                />
            ) : (
                 <FinanceCostForm
                    userId={userId} 
                    db={db} 
                    initialData={activeRecord} 
                    onClose={handleCloseForm}
                    mode={activeRecord ? 'edit' : 'add'}
                    costType={costType}
                    role={role} 
                />
            )}
        </div>
    );
};

export default FinanceCostDashboard;