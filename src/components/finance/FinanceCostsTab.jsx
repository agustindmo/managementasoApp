// src/components/finance/FinanceCostsTab.jsx

import React from 'react';
import FinanceCostDashboard from '../dashboards/FinanceCostDashboard.jsx';

// This component receives userId, db, and role from FinanceDashboard
const FinanceCostsTab = ({ userId, db, role }) => {
    return (
        <div className="space-y-8">
            {/* 1. Contenedor para Costos Administrativos */}
            <FinanceCostDashboard 
                userId={userId}
                db={db}
                costType="admin"
                role={role} 
            />

            {/* 2. Contenedor para Costos No Operativos */}
            <FinanceCostDashboard 
                userId={userId}
                db={db}
                costType="non_op"
                role={role}
            />
        </div>
    );
};
export default FinanceCostsTab;