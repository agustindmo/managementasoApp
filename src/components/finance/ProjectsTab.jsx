// src/components/finance/ProjectsTab.jsx

import React from 'react';
import FinanceProjectDashboard from '../dashboards/FinanceProjectDashboard.jsx';

const ProjectsTab = ({ db, userId }) => {
    return (
        <FinanceProjectDashboard 
            db={db}
            userId={userId}
        />
    );
};
export default ProjectsTab;