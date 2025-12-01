import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { Users, Loader2, Search, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import { useTranslation } from '../../context/TranslationContext.jsx';
import InputField from '../ui/InputField.jsx';
import PublicAffairsStakeholderForm from '../forms/PublicAffairsStakeholderForm.jsx';

const PublicAffairsDirectoryDashboard = ({ db, userId, role }) => {
    const { t } = useTranslation();
    const isAdmin = role === 'admin';
    const [stakeholders, setStakeholders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    
    const [showForm, setShowForm] = useState(false);
    const [activeRecord, setActiveRecord] = useState(null);

    useEffect(() => {
        if (!db) return;
        const refPath = ref(db, getDbPaths().publicStakeholders);
        const unsubscribe = onValue(refPath, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setStakeholders(Object.keys(data).map(key => ({ id: key, ...data[key] })));
            } else {
                setStakeholders([]);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db]);

    const filteredStakeholders = useMemo(() => {
        return stakeholders.filter(s => 
            (s.name + s.role + s.institution).toLowerCase().includes(search.toLowerCase())
        );
    }, [stakeholders, search]);

    const handleOpenForm = (record = null) => {
        if (!isAdmin) return;
        setActiveRecord(record);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!isAdmin || !confirm(t('stakeholder.confirm_delete'))) return;
        try { await remove(ref(db, `${getDbPaths().publicStakeholders}/${id}`)); }
        catch (e) { console.error(e); }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;

    if (showForm) {
        return (
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <PublicAffairsStakeholderForm
                    userId={userId}
                    db={db}
                    mode={activeRecord ? 'edit' : 'add'}
                    initialData={activeRecord}
                    onClose={() => { setShowForm(false); setActiveRecord(null); }}
                    role={role}
                />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                    <Users className="w-8 h-8 mr-3 text-blue-600" />
                    {t('sidebar.public_affairs_directory')}
                </h1>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="w-full md:w-64">
                        <InputField label="" name="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('policy.search')} icon={Search} />
                    </div>
                    {isAdmin && (
                        <button onClick={() => handleOpenForm(null)} className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md flex-shrink-0 h-10 mt-1">
                            <PlusCircle className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStakeholders.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all relative group">
                        {isAdmin && (
                            <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenForm(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        )}
                        <h3 className="font-bold text-slate-800 text-lg mb-1 pr-16">{item.name}</h3>
                        <p className="text-sm text-blue-600 font-medium mb-4">{t(item.role)}</p>
                        
                        <div className="space-y-2 text-sm text-slate-600">
                            <p><span className="font-medium">Scope:</span> {item.ambito}</p>
                            <p><span className="font-medium">Position:</span> {t(item.position)}</p>
                            {item.contact_person && <p className="mt-3 pt-3 border-t border-slate-100"><span className="font-medium">Contact:</span> {item.contact_person}</p>}
                            {item.contact_email && <p className="text-slate-500">{item.contact_email}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PublicAffairsDirectoryDashboard;