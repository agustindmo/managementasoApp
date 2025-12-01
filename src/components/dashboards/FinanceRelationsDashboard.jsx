import React from 'react';
import { Handshake } from 'lucide-react';
import { useTranslation } from '../../context/TranslationContext.jsx';
import FinancePartnerTab from '../finance/FinancePartnerTab.jsx';

const FinanceRelationsDashboard = ({ db, userId, role }) => {
    const { t } = useTranslation();

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-6 flex items-center">
                <Handshake className="w-8 h-8 mr-3 text-blue-600" />
                {t('sidebar.finance_relations')}
            </h1>
            <FinancePartnerTab db={db} userId={userId} role={role} />
        </div>
    );
};

export default FinanceRelationsDashboard;