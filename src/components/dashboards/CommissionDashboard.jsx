import React, { useState, useEffect } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { Users2, Loader2, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import { useTranslation } from '../../context/TranslationContext.jsx';
import CommissionForm from '../forms/CommissionForm.jsx';

const CommissionDashboard = ({ db, userId, role }) => {
    const { t } = useTranslation();
    const isAdmin = role === 'admin';
    const [commissions, setCommissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [activeRecord, setActiveRecord] = useState(null);

    useEffect(() => {
        if (!db) return;
        const refPath = ref(db, getDbPaths().commissions);
        const unsubscribe = onValue(refPath, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setCommissions(Object.keys(data).map(key => ({ id: key, ...data[key] })));
            } else {
                setCommissions([]);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db]);

    const handleOpenForm = (record = null) => {
        if (!isAdmin) return;
        setActiveRecord(record);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!isAdmin || !confirm(t('stakeholder.confirm_delete'))) return;
        try { await remove(ref(db, `${getDbPaths().commissions}/${id}`)); }
        catch (e) { console.error(e); }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;

    if (showForm) {
        return (
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <CommissionForm
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
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                    <Users2 className="w-8 h-8 mr-3 text-blue-600" />
                    {t('sidebar.commissions_directory')}
                </h1>
                {isAdmin && (
                    <button onClick={() => handleOpenForm(null)} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-md">
                        <PlusCircle className="w-5 h-5" />
                        <span>{t('commission.form.add_title')}</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {commissions.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative group hover:shadow-md transition-all">
                        {isAdmin && (
                            <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenForm(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        )}
                        <h3 className="font-bold text-slate-800 text-xl mb-2">{item.name}</h3>
                        <p className="text-sm text-slate-600 mb-4 italic">{item.scope}</p>
                        
                        <div className="border-t border-slate-100 pt-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">{t('commission.form.member_list')} ({(item.members || []).length})</h4>
                            <div className="flex flex-wrap gap-2">
                                {(item.members || []).map((member, idx) => (
                                    <div key={idx} className="flex items-center bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full border border-blue-100">
                                        {member.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CommissionDashboard;