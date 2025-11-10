// src/components/finance/AuditsTab.jsx

import React from 'react';
import { FileText } from 'lucide-react';
import { useTranslation } from '../../context/TranslationContext.jsx';
import CardTitle from '../ui/CardTitle.jsx';

const AuditsTab = ({ db }) => {
    const { t } = useTranslation();
    return (
        <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
            <CardTitle title={t('finance.tab.audits')} icon={FileText} />
            <div className="p-6 text-gray-400">
                {t('finance.wip_desc')}
            </div>
        </div>
    );
};
export default AuditsTab;