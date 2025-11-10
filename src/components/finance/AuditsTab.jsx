// src/components/finance/AuditsTab.jsx

import React from 'react';
import FinanceAuditDashboard from '../dashboards/FinanceAuditDashboard.jsx';

const AuditsTab = ({ db, userId }) => {
    return (
        <FinanceAuditDashboard 
            db={db}
            userId={userId}
        />
    );
};
export default AuditsTab;