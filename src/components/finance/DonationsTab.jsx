// src/components/finance/DonationsTab.jsx

import React from 'react';
import FinanceDonationDashboard from '../dashboards/FinanceDonationDashboard.jsx';

const DonationsTab = ({ db, userId }) => {
    return (
        <FinanceDonationDashboard 
            db={db}
            userId={userId}
        />
    );
};
export default DonationsTab;