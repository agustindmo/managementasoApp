import React from 'react';
import { MessageCircle, Loader2 } from 'lucide-react'; 
import CommunicationsTable from '../tables/CommunicationsTable.jsx'; 
import { useTranslation } from '../../context/TranslationContext.jsx'; // Añadido

const CommunicationsDashboard = ({ db }) => { 
    const { t } = useTranslation(); // Añadido
    const isDbReady = !!db;

    if (!isDbReady) {
        return (
            <div className="flex justify-center items-center p-8">
                {/* Estilos oscuros */}
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="ml-3 text-sky-200">{t('comms.loading')}</p>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            {/* Estilos oscuros y traducción */}
            <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
                <MessageCircle className="w-8 h-8 mr-3 text-sky-400" />
                {t('comms.title')}
            </h1>
            
            <CommunicationsTable 
                db={db} 
            />
        </div>
    );
};

export default CommunicationsDashboard;