// src/components/finance/ProjectsTab.jsx

import React from 'react';
import { Star } from 'lucide-react';
import { useTranslation } from '../../context/TranslationContext.jsx';
import CardTitle from '../ui/CardTitle.jsx';

const ProjectsTab = ({ db }) => {
    const { t } = useTranslation();
    return (
        <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
            <CardTitle title={t('finance.tab.projects')} icon={Star} />
            <div className="p-6 text-gray-400">
                {t('finance.wip_desc')}
            </div>
        </div>
    );
};
export default ProjectsTab;