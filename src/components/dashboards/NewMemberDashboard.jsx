// src/components/dashboards/NewMemberDashboard.jsx

import React from 'react';
import { UserPlus } from 'lucide-react'; 
import { useTranslation } from '../../context/TranslationContext.jsx';
import NewMemberRequestForm from '../forms/NewMemberRequestForm.jsx'; 

const NewMemberDashboard = ({ userId, db }) => { 
    const { t } = useTranslation();
    
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
                <UserPlus className="w-8 h-8 mr-3 text-sky-400" />
                {t('member_request.admin_title')}
            </h1>
            
            <NewMemberRequestForm
                userId={userId} 
                db={db} 
            />
        </div>
    );
};

export default NewMemberDashboard;