import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { Handshake, Loader2, Search, ExternalLink } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import { useTranslation } from '../../context/TranslationContext.jsx';
import InputField from '../ui/InputField.jsx';

const PartnersDirectoryDashboard = ({ db }) => {
    const { t } = useTranslation();
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!db) return;
        const refPath = ref(db, getDbPaths().financePartners);
        const unsubscribe = onValue(refPath, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setPartners(Object.keys(data).map(key => ({ id: key, ...data[key] })));
            } else {
                setPartners([]);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db]);

    const filteredList = useMemo(() => {
        return partners.filter(p => 
            (p.name + p.area).toLowerCase().includes(search.toLowerCase())
        );
    }, [partners, search]);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                    <Handshake className="w-8 h-8 mr-3 text-blue-600" />
                    {t('sidebar.partners_directory')}
                </h1>
                <div className="w-full md:w-96">
                    <InputField label="" name="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('policy.search')} icon={Search} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredList.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all">
                        <h3 className="font-bold text-slate-800 text-lg mb-2">{item.name}</h3>
                        <p className="text-sm text-blue-600 font-medium mb-4">{item.area}</p>
                        
                        <div className="space-y-2 text-sm text-slate-600 border-t border-slate-100 pt-3">
                            <p><span className="font-medium">Contact:</span> {item.contact_person || 'N/A'}</p>
                            <p><span className="font-medium">Email:</span> {item.contact_email || 'N/A'}</p>
                            
                            {item.agreement_link && (
                                <a href={item.agreement_link} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:text-blue-800 mt-2">
                                    <ExternalLink className="w-3 h-3 mr-1" /> Agreement
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PartnersDirectoryDashboard;