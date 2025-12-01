import React, { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { getDbPaths } from '../../services/firebase.js';
import { UserCheck, Loader2, Check, X } from 'lucide-react';
import { useTranslation } from '../../context/TranslationContext.jsx';

const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({ id: key, ...val[key] }));
};

const MemberApprovalDashboard = ({ db, userId }) => {
    const { t } = useTranslation();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db) return;
        const requestsRef = ref(db, getDbPaths().memberRequests);
        const unsubscribe = onValue(requestsRef, (snapshot) => {
            const allRequests = snapshotToArray(snapshot);
            setRequests(allRequests.filter(r => r.status === 'pending_director_approval'));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db]);

    const handleApproval = async (id, newStatus) => {
        try {
            const reqRef = ref(db, `${getDbPaths().memberRequests}/${id}`);
            await update(reqRef, { status: newStatus, approvedBy: userId });
        } catch (error) {
            console.error("Error updating request status:", error);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-6 flex items-center">
                <UserCheck className="w-8 h-8 mr-3 text-blue-600" />
                {t('sidebar.member_approvals')}
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {requests.length > 0 ? requests.map(req => (
                    <div key={req.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">{req.company_name}</h3>
                                <p className="text-sm text-slate-500">{req.city}, {req.province}</p>
                            </div>
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                        </div>
                        
                        <div className="space-y-2 mb-6 text-sm text-slate-600">
                            <p><strong className="text-slate-800">Legal Rep:</strong> {req.legal_rep}</p>
                            <p><strong className="text-slate-800">Activity:</strong> {req.activity}</p>
                            <p><strong className="text-slate-800">Risk Status:</strong> {req.risk_status}</p>
                            {req.risk_link && <a href={req.risk_link} target="_blank" className="text-blue-600 underline block mt-1">View Risk Report</a>}
                        </div>

                        <div className="flex space-x-3 border-t border-slate-100 pt-4">
                            <button
                                onClick={() => handleApproval(req.id, 'approved')}
                                className="flex-1 flex items-center justify-center py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                            >
                                <Check className="w-4 h-4 mr-2" /> Approve
                            </button>
                            <button
                                onClick={() => handleApproval(req.id, 'rejected')}
                                className="flex-1 flex items-center justify-center py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                            >
                                <X className="w-4 h-4 mr-2" /> Reject
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full text-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400">
                        {t('member_request.no_pending')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MemberApprovalDashboard;