import React, { useState } from 'react';
import FinanceServiceTable from '../tables/FinanceServiceTable.jsx';
import FinanceServiceForm from '../forms/FinanceServiceForm.jsx';

const ServicesTab = ({ db, userId, role }) => {
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
                <FinanceServiceTable db={db} onOpenForm={handleOpenForm} role={role} />
            ) : (
                <FinanceServiceForm userId={userId} db={db} initialData={activeRecord} onClose={handleCloseForm} mode={activeRecord ? 'edit' : 'add'} role={role} />
            )}
        </div>
    );
};
export default ServicesTab;