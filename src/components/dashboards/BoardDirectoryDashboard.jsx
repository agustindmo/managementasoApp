import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { Users, Loader2, Search, MapPin, Briefcase } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import { useTranslation } from '../../context/TranslationContext.jsx';
import InputField from '../ui/InputField.jsx';

const BoardDirectoryDashboard = ({ db }) => {
    const { t } = useTranslation();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!db) return;
        const profilesRef = ref(db, getDbPaths().userProfiles);
        const unsubscribe = onValue(profilesRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                // Filter for users with role 'director'
                const boardMembers = Object.values(data).filter(user => user.role === 'director');
                setMembers(boardMembers);
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
                    <Users className="w-8 h-8 mr-3 text-blue-600" />
                    {t('sidebar.board_directory')}
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
                {filteredMembers.length > 0 ? filteredMembers.map((member, index) => (
                    <div key={index} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all flex flex-col">
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
                                {member.firstName?.[0]}{member.lastName?.[0]}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">{member.firstName} {member.lastName}</h3>
                                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">{t('roles.director')}</p>
                            </div>
                        </div>
                        <div className="space-y-3 text-sm text-slate-600 flex-grow">
                            <div className="flex items-start">
                                <Briefcase className="w-4 h-4 mr-2 text-slate-400 mt-0.5" />
                                <span>{member.company}</span>
                            </div>
                            <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                                {member.city}, {member.province}
                            </div>
                        </div>
                    </div>
                )) : (
                    <p className="col-span-3 text-center text-slate-400 italic p-8">{t('stakeholder.no_stakeholders_found')}</p>
                )}
            </div>
        </div>
    );
};

export default BoardDirectoryDashboard;