import React, { useState } from 'react';
import FinanceDonationTable from '../tables/FinanceDonationTable.jsx';
import FinanceDonationForm from '../forms/FinanceDonationForm.jsx';

const DonationsTab = ({ db, userId, role }) => {
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
                <FinanceDonationTable
                    db={db}
                    onOpenForm={handleOpenForm}
                    role={role}
                />
            ) : (
                <FinanceDonationForm
                    userId={userId}
                    db={db}
                    initialData={activeRecord}
                    onClose={handleCloseForm}
                    mode={activeRecord ? 'edit' : 'add'}
                    role={role}
                />
            )}
        </div>
    );
};

export default DonationsTab;