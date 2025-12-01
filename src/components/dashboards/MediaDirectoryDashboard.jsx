import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { Radio, Loader2, Search, Mail, Phone } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import { useTranslation } from '../../context/TranslationContext.jsx';
import InputField from '../ui/InputField.jsx';

const MediaDirectoryDashboard = ({ db }) => {
    const { t } = useTranslation();
    const [mediaList, setMediaList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!db) return;
        const refPath = ref(db, getDbPaths().mediaStakeholders);
        const unsubscribe = onValue(refPath, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setMediaList(Object.keys(data).map(key => ({ id: key, ...data[key] })));
            } else {
                setMediaList([]);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db]);

    const filteredList = useMemo(() => {
        return mediaList.filter(m => 
            (m.name + (m.email || '')).toLowerCase().includes(search.toLowerCase())
        );
    }, [mediaList, search]);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                    <Radio className="w-8 h-8 mr-3 text-blue-600" />
                    {t('sidebar.media_directory')}
                </h1>
                <div className="w-full md:w-96">
                    <InputField label="" name="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('policy.search')} icon={Search} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredList.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all">
                        <h3 className="font-bold text-slate-800 text-lg mb-1">{item.name}</h3>
                        <div className="flex space-x-2 mb-4">
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">{t(`press_log.format_opts.${(item.type || '').toLowerCase()}`)}</span>
                            <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">{t(`stakeholder.scope.${(item.scope || '').toLowerCase()}`)}</span>
                        </div>
                        
                        <div className="space-y-2 text-sm text-slate-600">
                            {item.email && (
                                <div className="flex items-center">
                                    <Mail className="w-4 h-4 mr-2 text-slate-400" />
                                    <a href={`mailto:${item.email}`} className="hover:text-blue-600 transition">{item.email}</a>
                                </div>
                            )}
                            {item.phone && (
                                <div className="flex items-center">
                                    <Phone className="w-4 h-4 mr-2 text-slate-400" />
                                    <span>{item.phone}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MediaDirectoryDashboard;