// src/components/finance/FinanceSummaryTab.jsx

import React from 'react';
import { BarChart } from 'lucide-react';
import { useTranslation } from '../../context/TranslationContext.jsx';
import CardTitle from '../ui/CardTitle.jsx';

const FinanceSummaryTab = ({ db }) => {
    const { t } = useTranslation();
    return (
        <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
            <CardTitle title={t('finance.tab.summary')} icon={BarChart} />
            <div className="p-6 text-gray-400">
                {t('finance.wip_desc')}
            </div>
        </div>
    );
};
export default FinanceSummaryTab;