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
        onAddMember(newMember); 
        setNewMember(INITIAL_NEW_MEMBER); 
    };

    return (
        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-4">
            <label className="block text-sm font-medium text-gray-700">{t('commission.col.members')}</label>

            <div className="p-3 border border-slate-200 bg-white rounded-lg space-y-3 shadow-sm">
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
                    className="w-full flex justify-center items-center py-2 px-3 border border-transparent text-xs font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('commission.form.add_member')}
                </button>
            </div>

            <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-600">{t('commission.form.member_list')}</h4>
                {members.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">{t('commission.form.no_members')}</p>
                ) : (
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                        {members.map((member, index) => (
                            <div key={index} className="flex items-start justify-between bg-white border border-slate-200 p-2.5 rounded-lg hover:shadow-sm transition-shadow">
                                <div className="text-sm">
                                    <p className="font-semibold text-slate-800">{member.name}</p>
                                    <p className="text-xs text-slate-500">{member.company || 'N/A'}</p>
                                    <p className="text-xs text-slate-400">{member.email || 'N/A'} {member.email && member.phone && ' | '} {member.phone || ''}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onRemoveMember(index)}
                                    className="p-1 text-red-500 hover:text-red-700 transition-colors"
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


const CommissionForm = ({ userId, db, mode = 'add', initialData = null, onClose, role }) => {
    const { t } = useTranslation();
    const isAdmin = role === 'admin';
    
    const [formData, setFormData] = useState(initialData ? 
        { ...initialData, members: initialData.members || [] } : 
        INITIAL_COMMISSION_STATE
    );
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    const isReady = !!db && !!userId;
    const dbPathKey = 'commissions';
    
    const formTitle = mode === 'edit' 
        ? t('commission.form.edit_title')
        : t('commission.form.add_title');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev, 
            [name]: value
        }));
    };

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
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden max-w-4xl mx-auto">
            <div className="flex justify-between items-center pr-4">
                <CardTitle title={formTitle} icon={Users} />
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition" title="Close">
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
                        className={`w-full flex justify-center items-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-lg text-white transition duration-300 ease-in-out ${
                            isLoading || !isReady ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                        }`}
                    >
                        {isLoading ? t('activity.form.saving') : !isReady ? t('activity.form.connecting') : (mode === 'edit' ? t('activity.form.update') : t('activity.form.add'))}
                    </button>
                )}
                {message && (
                    <p className={`text-center text-sm mt-3 ${messageType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {message}
                    </p>
                )}
            </form>
        </div>
    );
};

export default CommissionForm;