// src/components/finance/ServicesTab.jsx

import React from 'react';
import FinanceServiceDashboard from '../dashboards/FinanceServiceDashboard.jsx';

const ServicesTab = ({ db, userId }) => {
    return (
        <FinanceServiceDashboard 
            db={db}
            userId={userId}
        />
    );
};
export default ServicesTab;