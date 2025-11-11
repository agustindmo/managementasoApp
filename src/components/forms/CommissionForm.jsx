// src/components/forms/CommissionForm.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ref, set, push, serverTimestamp, onValue } from 'firebase/database';
import { Users, X, Loader2, Plus, Trash2, Search } from 'lucide-react';
import CardTitle from '../ui/CardTitle.jsx';
import InputField from '../ui/InputField.jsx';
import { 
    INITIAL_COMMISSION_STATE,
} from '../../utils/constants.js'; 
import { getDbPaths } from '../../services/firebase.js'; 
import { useTranslation } from '../../context/TranslationContext.jsx';

const snapshotToUserArray = (profileSnapshot, roleSnapshot) => {
    const profiles = profileSnapshot.val() || {};
    const roles = roleSnapshot.val() || {};
    
    return Object.keys(profiles).map(uid => ({
        id: uid,
        name: profiles[uid].representative || 'N/A',
        company: profiles[uid].company || 'N/A',
        email: roles[uid]?.email || 'N/A'
    }));
};

// --- Helper Component for Member Multi-Select ---
const MemberMultiSelect = ({ labelKey, selectedKeys, allMembers, onToggleMember, t }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return [];
        const lowerSearch = searchTerm.toLowerCase();
        return allMembers.filter(
            member => (member.name.toLowerCase().includes(lowerSearch) || 
                       member.company.toLowerCase().includes(lowerSearch)) &&
                       !selectedKeys.includes(member.id)
        );
    }, [searchTerm, allMembers, selectedKeys]);

    const selectedMembers = useMemo(() => {
        return selectedKeys.map(key => 
            allMembers.find(m => m.id === key) || { id: key, name: "Usuario Desconocido" }
        );
    }, [selectedKeys, allMembers]);

    return (
        <div className="p-4 rounded-lg border border-sky-800/50 bg-sky-950/30 space-y-3">
            <label className="block text-sm font-medium text-gray-200">{t(labelKey)}</label>
            
            <InputField 
                label=""
                name="search_member"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                required={false}
                placeholder={t('policy.search')}
                icon={Search}
            />

            {filteredOptions.length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-1 rounded-lg border border-sky-700 bg-black/40 p-2">
                    {filteredOptions.slice(0, 10).map(member => (
                        <div 
                            key={member.id}
                            className="p-2 text-sm text-gray-200 rounded-md hover:bg-sky-700 cursor-pointer"
                            onClick={() => {
                                onToggleMember(member.id);
                                setSearchTerm('');
                            }}
                        >
                            {member.name} <span className="text-xs text-gray-400">({member.company})</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Selected Items */}
            <div className="flex flex-col space-y-1 pt-2">
                {selectedMembers.map((member) => (
                    <span key={member.id} className="flex items-center justify-between bg-sky-700 text-white text-sm font-medium px-2 py-1 rounded-full">
                        {member.name} <span className="text-xs text-sky-200 ml-1.5">({member.company})</span>
                        <button
                            type="button"
                            onClick={() => onToggleMember(member.id)}
                            className="ml-1.5 text-sky-200 hover:text-white"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
            </div>
        </div>
    );
};


// --- Componente Principal del Formulario ---
const CommissionForm = ({ userId, db, mode = 'add', initialData = null, onClose, role }) => {
    const { t } = useTranslation();
    const isAdmin = role === 'admin';
    
    const [formData, setFormData] = useState(initialData ? 
        { ...initialData, memberKeys: initialData.memberKeys || [] } : 
        INITIAL_COMMISSION_STATE
    );
    const [allMembers, setAllMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    const isReady = !!db && !!userId;
    const dbPathKey = 'commissions';
    
    const formTitle = mode === 'edit' 
        ? t('commission.form.edit_title')
        : t('commission.form.add_title');

    // Cargar todos los perfiles de usuario
    useEffect(() => {
        if (!db) return;
        
        const profilesRef = ref(db, getDbPaths().userProfiles);
        const rolesRef = ref(db, getDbPaths().userRoles);
        
        let profilesSnap, rolesSnap;

        const loadData = () => {
            if (profilesSnap && rolesSnap) {
                setAllMembers(snapshotToUserArray(profilesSnap, rolesSnap));
            }
        };

        const unsubProfiles = onValue(profilesRef, (snapshot) => {
            profilesSnap = snapshot;
            loadData();
        }, (error) => console.error(error));
        
        const unsubRoles = onValue(rolesRef, (snapshot) => {
            rolesSnap = snapshot;
            loadData();
        }, (error) => console.error(error));

        return () => {
            unsubProfiles();
            unsubRoles();
        };
    }, [db]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev, 
            [name]: value
        }));
    };

    const handleToggleMember = (memberId) => {
        setFormData(prev => {
            const currentKeys = prev.memberKeys || [];
            const isSelected = currentKeys.includes(memberId);
            const newKeys = isSelected 
                ? currentKeys.filter(id => id !== memberId) 
                : [...currentKeys, memberId]; 
            return { ...prev, memberKeys: newKeys };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isReady || !isAdmin) return; 

        setIsLoading(true);
        setMessage('');
        setMessageType('success');

        try {
            const path = getDbPaths()[dbPathKey];
            
            if (mode === 'edit' && initialData?.id) {
                const itemRef = ref(db, `${path}/${initialData.id}`);
                await set(itemRef, {
                    ...formData,
                    updatedAt: serverTimestamp(),
                    updatedBy: userId,
                });
                setMessage(t('activity.form.success_update'));
            } else {
                const newItemRef = push(ref(db, path));
                await set(newItemRef, {
                    ...formData,
                    id: newItemRef.key,
                    createdAt: serverTimestamp(),
                    createdBy: userId,
                });
                setMessage(t('activity.form.success_add'));
            }

            setTimeout(onClose, 1000); 
        } catch (error) {
            console.error(`Error ${mode} commission: `, error);
            setMessage(t('activity.form.fail'));
            setMessageType('error');
            setIsLoading(false);
        }
    };

    return (
        <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <CardTitle title={formTitle} icon={Users} />
                <button onClick={onClose} className="p-3 text-gray-400 hover:text-white transition" title="Close Form">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                
                <InputField 
                    label={t('commission.col.name')} 
                    name="name" 
                    value={String(formData.name ?? '')} 
                    onChange={handleChange} 
                    disabled={!isAdmin}
                />
                
                <InputField 
                    label={t('commission.col.scope')} 
                    name="scope" 
                    value={String(formData.scope ?? '')} 
                    onChange={handleChange} 
                    rows={3}
                    disabled={!isAdmin}
                />

                <MemberMultiSelect
                    labelKey="commission.col.members"
                    selectedKeys={formData.memberKeys || []}
                    allMembers={allMembers}
                    onToggleMember={handleToggleMember}
                    t={t}
                />

                {isAdmin && (
                    <button
                        type="submit"
                        disabled={isLoading || !isReady}
                        className={`w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition duration-300 ease-in-out ${
                            isLoading || !isReady ? 'bg-sky-400 cursor-not-allowed opacity-70' : 'bg-sky-600 hover:bg-sky-700'
                        }`}
                    >
                        {isLoading ? t('activity.form.saving') : !isReady ? t('activity.form.connecting') : (mode === 'edit' ? t('activity.form.update') : t('activity.form.add'))}
                    </button>
                )}
                {message && (
                    <p className={`text-center text-sm mt-2 ${messageType === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {message}
                    </p>
                )}
            </form>
        </div>
    );
};

export default CommissionForm;