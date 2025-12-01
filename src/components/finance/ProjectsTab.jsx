import React, { useState } from 'react';
import FinanceProjectTable from '../tables/FinanceProjectTable.jsx';
import FinanceProjectForm from '../forms/FinanceProjectForm.jsx';

const ProjectsTab = ({ db, userId, role }) => {
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
                <FinanceProjectTable db={db} onOpenForm={handleOpenForm} role={role} />
            ) : (
                <FinanceProjectForm userId={userId} db={db} initialData={activeRecord} onClose={handleCloseForm} mode={activeRecord ? 'edit' : 'add'} role={role} />
            )}
        </div>
    );
};
export default ProjectsTab;