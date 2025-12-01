import React, { useState } from 'react';
import FinanceAuditTable from '../tables/FinanceAuditTable.jsx';
import FinanceAuditForm from '../forms/FinanceAuditForm.jsx';

const AuditsTab = ({ db, userId, role }) => {
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
                <FinanceAuditTable db={db} onOpenForm={handleOpenForm} role={role} />
            ) : (
                <FinanceAuditForm userId={userId} db={db} initialData={activeRecord} onClose={handleCloseForm} mode={activeRecord ? 'edit' : 'add'} role={role} />
            )}
        </div>
    );
};
export default AuditsTab;