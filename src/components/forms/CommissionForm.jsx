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

// --- TASK 6: Removed snapshotToUserArray ---
// --- TASK 6: Removed MemberMultiSelect Helper Component ---

// --- TASK 6: NEW Helper Component for managing member list ---
const CommissionMemberInput = ({ members, onAddMember, onRemoveMember, t }) => {
    
    const INITIAL_NEW_MEMBER = { name: '', email: '', phone: '', company: '' };
    const [newMember, setNewMember] = useState(INITIAL_NEW_MEMBER);

    const handleNewMemberChange = (e) => {
        const { name, value } = e.target;
        setNewMember(prev => ({ ...prev, [name]: value }));
    };

    const handleAddClick = () => {
        if (!newMember.name) {
            alert(t('commission.form.name_required') || 'Member name is required.');
            return;
        }
        onAddMember(newMember); // Add the member object
        setNewMember(INITIAL_NEW_MEMBER); // Clear the form
    };

    return (
        <div className="p-4 rounded-lg border border-sky-800/50 bg-sky-950/30 space-y-4">
            <label className="block text-sm font-medium text-gray-200">{t('commission.col.members')}</label>

            {/* Input fields for new member */}
            <div className="p-3 border border-sky-700/50 rounded-lg space-y-3">
                <InputField 
                    label={t('commission.form.member_name')}
                    name="name"
                    value={newMember.name}
                    onChange={handleNewMemberChange}
                    required={true}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <InputField 
                        label={t('commission.form.member_email')}
                        name="email"
                        type="email"
                        value={newMember.email}
                        onChange={handleNewMemberChange}
                    />
                    <InputField 
                        label={t('commission.form.member_phone')}
                        name="phone"
                        type="tel"
                        value={newMember.phone}
                        onChange={handleNewMemberChange}
                    />
                </div>
                <InputField 
                    label={t('commission.form.member_company')}
                    name="company"
                    value={newMember.company}
                    onChange={handleNewMemberChange}
                />
                <button
                    type="button"
                    onClick={handleAddClick}
                    className="w-full flex justify-center items-center py-2 px-3 border border-transparent text-xs font-medium rounded-lg text-white bg-sky-600 hover:bg-sky-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('commission.form.add_member')}
                </button>
            </div>

            {/* List of added members */}
            <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">{t('commission.form.member_list')}</h4>
                {members.length === 0 ? (
                    <p className="text-xs text-gray-500">{t('commission.form.no_members')}</p>
                ) : (
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                        {members.map((member, index) => (
                            <div key={index} className="flex items-start justify-between bg-sky-800/50 p-2.5 rounded-lg">
                                <div className="text-sm">
                                    <p className="font-semibold text-white">{member.name}</p>
                                    <p className="text-xs text-gray-300">{member.company || 'N/A'}</p>
                                    <p className="text-xs text-gray-400">{member.email || 'N/A'} {member.email && member.phone && ' | '} {member.phone || ''}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onRemoveMember(index)}
                                    className="p-1 text-red-400 hover:text-red-200"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};


// --- Componente Principal del Formulario ---
const CommissionForm = ({ userId, db, mode = 'add', initialData = null, onClose, role }) => {
    const { t } = useTranslation();
    const isAdmin = role === 'admin';
    
    // --- TASK 6: Updated state to use 'members' array ---
    const [formData, setFormData] = useState(initialData ? 
        { ...initialData, members: initialData.members || [] } : 
        INITIAL_COMMISSION_STATE
    );
    // --- TASK 6: Removed allMembers state ---
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    const isReady = !!db && !!userId;
    const dbPathKey = 'commissions';
    
    const formTitle = mode === 'edit' 
        ? t('commission.form.edit_title')
        : t('commission.form.add_title');

    // --- TASK 6: Removed useEffect that fetched user profiles ---

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev, 
            [name]: value
        }));
    };

    // --- TASK 6: Handlers for the new member object list ---
    const handleAddMember = (memberObject) => {
        setFormData(prev => ({
            ...prev,
            members: [...(prev.members || []), memberObject]
        }));
    };

    const handleRemoveMember = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            members: (prev.members || []).filter((_, index) => index !== indexToRemove)
        }));
    };
    // --- End Task 6 Handlers ---


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isReady || !isAdmin) return; 

        setIsLoading(true);
        setMessage('');
        setMessageType('success');

        try {
            const path = getDbPaths()[dbPathKey];
            
            // FormData is already in the correct format { name, scope, members: [...] }
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

                {/* --- TASK 6: Replaced MemberMultiSelect --- */}
                <CommissionMemberInput
                    members={formData.members || []}
                    onAddMember={handleAddMember}
                    onRemoveMember={handleRemoveMember}
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