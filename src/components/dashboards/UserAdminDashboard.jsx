import React, { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { getDbPaths } from '../../services/firebase.js';
import { Users, Loader2, Shield, CheckCircle, XCircle, Search } from 'lucide-react';
import CardTitle from '../ui/CardTitle.jsx';
import InputField from '../ui/InputField.jsx';
import SelectField from '../ui/SelectField.jsx';
import { USER_ROLES } from '../../utils/constants.js';
import { useTranslation } from '../../context/TranslationContext.jsx';

const UserAdminDashboard = ({ db, userId }) => {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    useEffect(() => {
        if (!db) return;
        const usersRef = ref(db, getDbPaths().userRoles);
        const unsubscribe = onValue(usersRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const userList = Object.keys(data).map(key => ({
                    uid: key,
                    ...data[key]
                }));
                setUsers(userList);
            } else {
                setUsers([]);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db]);

    const handleRoleChange = async (targetUid, newRole) => {
        if (!db) return;
        try {
            const userRef = ref(db, `${getDbPaths().userRoles}/${targetUid}`);
            await update(userRef, { role: newRole });
        } catch (error) {
            console.error("Error updating role:", error);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (user.uid || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

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
            <h1 className="text-3xl font-bold text-slate-800 mb-6 flex items-center">
                <Shield className="w-8 h-8 mr-3 text-blue-600" />
                {t('sidebar.user_admin')}
            </h1>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="w-full sm:w-96">
                        <InputField
                            label=""
                            name="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('policy.search')}
                            icon={Search}
                        />
                    </div>
                    <div className="w-full sm:w-64">
                        <SelectField
                            label=""
                            name="roleFilter"
                            options={[{ value: 'all', label: 'All Roles' }, ...Object.values(USER_ROLES).map(r => ({ value: r, label: t(`roles.${r}`) || r } ))]}
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">UID / Email</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t('profile.role')}</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t('activity.col.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.uid} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900">{user.email || 'No Email'}</div>
                                            <div className="text-xs text-slate-500 font-mono">{user.uid}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                                                  user.role === 'director' ? 'bg-blue-100 text-blue-800' : 
                                                  'bg-green-100 text-green-800'}`}>
                                                {t(`roles.${user.role}`) || user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                                                className="mt-1 block w-full py-1 px-2 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            >
                                                {Object.values(USER_ROLES).map((role) => (
                                                    <option key={role} value={role}>
                                                        {t(`roles.${role}`) || role}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="px-6 py-4 text-center text-slate-500">
                                        {t('stakeholder.no_stakeholders_found')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserAdminDashboard;