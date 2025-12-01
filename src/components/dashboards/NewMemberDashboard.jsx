import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { getDbPaths } from '../../services/firebase.js';
import { UserPlus, PlusCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '../../context/TranslationContext.jsx';
import NewMemberRequestForm from '../forms/NewMemberRequestForm.jsx';

const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({ id: key, ...val[key] }));
};

const NewMemberDashboard = ({ userId, db }) => {
    const { t } = useTranslation();
    const [myRequests, setMyRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        if (!db || !userId) return;
        const requestsRef = ref(db, getDbPaths().memberRequests);
        const unsubscribe = onValue(requestsRef, (snapshot) => {
            const allRequests = snapshotToArray(snapshot);
            const userRequests = allRequests.filter(req => req.createdBy === userId);
            setMyRequests(userRequests);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db, userId]);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                    <UserPlus className="w-8 h-8 mr-3 text-blue-600" />
                    {t('sidebar.new_member_request')}
                </h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-md"
                >
                    <PlusCircle className="w-5 h-5" />
                    <span>{t('member_request.form.title')}</span>
                </button>
            </div>

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="relative w-full max-w-4xl my-8">
                        <NewMemberRequestForm userId={userId} db={db} onClose={() => setShowForm(false)} />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myRequests.length > 0 ? myRequests.map(req => (
                    <div key={req.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                        <h3 className="text-lg font-bold text-slate-800 mb-1">{req.company_name}</h3>
                        <p className="text-sm text-slate-500 mb-4">Legal Rep: {req.legal_rep}</p>
                        <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                            <span className="text-xs text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                req.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                req.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                                {t(`member_request.status.${req.status}`) || req.status}
                            </span>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full text-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400">
                        {t('member_request.no_requests')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewMemberDashboard;