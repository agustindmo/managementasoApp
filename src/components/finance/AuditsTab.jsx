// src/components/finance/AuditsTab.jsx

import React from 'react';
import FinanceAuditDashboard from '../dashboards/FinanceAuditDashboard.jsx';

const AuditsTab = ({ db, userId, role }) => { // <-- role prop
    return (
        <FinanceAuditDashboard 
            db={db}
            userId={userId}
            role={role} // <-- Pass role
        />
    );
};
export default AuditsTab;