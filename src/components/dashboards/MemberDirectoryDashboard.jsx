import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { BookUser, Loader2, Search, MapPin } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import { useTranslation } from '../../context/TranslationContext.jsx';
import InputField from '../ui/InputField.jsx';

const MemberDirectoryDashboard = ({ db }) => {
    const { t } = useTranslation();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!db) return;
        const membersRef = ref(db, getDbPaths().userProfiles);
        const unsubscribe = onValue(membersRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setMembers(Object.values(data));
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db]);

    const filteredMembers = useMemo(() => {
        return members.filter(m => 
            (m.firstName + ' ' + m.lastName + m.company).toLowerCase().includes(search.toLowerCase())
        );
    }, [members, search]);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                    <BookUser className="w-8 h-8 mr-3 text-blue-600" />
                    {t('sidebar.member_directory')}
                </h1>
                <div className="w-full md:w-96">
                    <InputField 
                        label="" 
                        name="search" 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        placeholder={t('policy.search')} 
                        icon={Search}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMembers.map((member, index) => (
                    <div key={index} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all">
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                                {member.firstName?.[0]}{member.lastName?.[0]}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">{member.firstName} {member.lastName}</h3>
                                <p className="text-sm text-slate-500">{member.role}</p>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm text-slate-600">
                            <p className="font-semibold text-slate-800">{member.company}</p>
                            <div className="flex items-center text-slate-500">
                                <MapPin className="w-3 h-3 mr-1" />
                                {member.city}, {member.province}
                            </div>
                            <p>{member.activity}</p>
                            <p className="text-blue-600">{member.phone}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MemberDirectoryDashboard;