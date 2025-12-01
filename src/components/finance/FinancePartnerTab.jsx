import React, { useState } from 'react';
import FinancePartnerTable from '../tables/FinancePartnerTable.jsx';
import FinancePartnerForm from '../forms/FinancePartnerForm.jsx';

const FinancePartnerTab = ({ db, userId, role }) => {
    const [view, setView] = useState('table');
    const [activeRecord, setActiveRecord] = useState(null);

    const handleOpenForm = (record = null) => {
        setActiveRecord(record);
        setView('form');
    };

    const handleCloseForm = () => {
        setView('table');
        setActiveRecord(null);
    };

    return (
        <div className="w-full">
            {view === 'table' ? (
                <FinancePartnerTable db={db} onOpenForm={handleOpenForm} role={role} />
            ) : (
                <FinancePartnerForm userId={userId} db={db} initialData={activeRecord} onClose={handleCloseForm} mode={activeRecord ? 'edit' : 'add'} role={role} />
            )}
        </div>
    );
};
export default FinancePartnerTab;