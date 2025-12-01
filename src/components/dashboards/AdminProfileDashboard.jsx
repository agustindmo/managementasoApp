import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { getDbPaths } from '../../services/firebase.js';
import { List, Loader2, Download } from 'lucide-react';
import { useTranslation } from '../../context/TranslationContext.jsx';
import * as XLSX from 'xlsx';

const AdminProfileDashboard = ({ db }) => {
    const { t } = useTranslation();
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db) return;
        const profilesRef = ref(db, getDbPaths().userProfiles);
        const unsubscribe = onValue(profilesRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setProfiles(Object.keys(data).map(key => ({ id: key, ...data[key] })));
            } else {
                setProfiles([]);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db]);

    const handleDownloadXLSX = () => {
        if (profiles.length === 0) { alert(t('policy.no_records')); return; }
        const ws = XLSX.utils.json_to_sheet(profiles);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Profiles');
        XLSX.writeFile(wb, 'User_Profiles.xlsx');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="ml-3 text-slate-500">{t('profile.loading_admin')}</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                    <List className="w-8 h-8 mr-3 text-blue-600" />
                    {t('sidebar.admin_profiles')}
                </h1>
                <button onClick={handleDownloadXLSX} className="flex items-center space-x-2 bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition shadow-sm">
                    <Download className="w-4 h-4" />
                    <span>{t('policy.download_xlsx')}</span>
                </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t('profile.first_name')}</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t('profile.last_name')}</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t('member_request.form.company_name')}</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t('profile.role')}</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t('profile.phone')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {profiles.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{p.firstName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{p.lastName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{p.company}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{p.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{p.phone}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminProfileDashboard;