import React, { useState } from 'react';
import { ref, set, push, serverTimestamp } from 'firebase/database';
import { Users, X, Loader2 } from 'lucide-react';
import CardTitle from '../ui/CardTitle.jsx';
import InputField from '../ui/InputField.jsx';
import SelectField from '../ui/SelectField.jsx';
import { 
    INITIAL_PUBLIC_STAKEHOLDER_STATE,
    STAKEHOLDER_AMBITO_OPTIONS,
    STAKEHOLDER_ROLE_OPTIONS,
    STAKEHOLDER_POSITION_OPTIONS
} from '../../utils/constants.js'; 
import { getDbPaths } from '../../services/firebase.js'; 
import { useTranslation } from '../../context/TranslationContext.jsx';

const PublicAffairsStakeholderForm = ({ userId, db, mode = 'add', initialData = null, onClose, role }) => {
    const { t } = useTranslation();
    const isAdmin = role === 'admin';
    
    const [formData, setFormData] = useState(initialData || INITIAL_PUBLIC_STAKEHOLDER_STATE);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    const isReady = !!db && !!userId;
    const dbPathKey = 'publicStakeholders';
    
    const formTitle = mode === 'edit' 
        ? t('public_affairs_directory.form.edit_title')
        : t('public_affairs_directory.form.add_title');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev, 
            [name]: value
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
            console.error(`Error ${mode} public stakeholder: `, error);
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
                    label={t('stakeholder.col.name')} 
                    name="name" 
                    value={String(formData.name ?? '')} 
                    onChange={handleChange} 
                    disabled={!isAdmin}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SelectField 
                        label={t('stakeholder.col.scope')} 
                        name="ambito" 
                        options={Object.values(STAKEHOLDER_AMBITO_OPTIONS)} 
                        value={formData.ambito} 
                        onChange={handleChange} 
                        disabled={!isAdmin}
                    />
                    <SelectField 
                        label={t('stakeholder.col.position')} 
                        name="position" 
                        options={STAKEHOLDER_POSITION_OPTIONS.map(opt => ({ value: opt, label: t(opt) }))}
                        value={formData.position} 
                        onChange={handleChange} 
                        disabled={!isAdmin}
                    />
                    <SelectField 
                        label={t('stakeholder.col.role')} 
                        name="role" 
                        options={STAKEHOLDER_ROLE_OPTIONS.map(opt => ({ value: opt, label: t(opt) }))}
                        value={formData.role} 
                        onChange={handleChange} 
                        disabled={!isAdmin}
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField 
                        label={t('profile.contact_name')} 
                        name="contact_person" 
                        value={String(formData.contact_person ?? '')} 
                        onChange={handleChange} 
                        required={false}
                        disabled={!isAdmin}
                    />
                    <InputField 
                        label={t('profile.contact_email')} 
                        name="contact_email" 
                        type="email"
                        value={String(formData.contact_email ?? '')} 
                        onChange={handleChange} 
                        required={false}
                        disabled={!isAdmin}
                    />
                    <InputField 
                        label={t('profile.contact_phone')} 
                        name="contact_phone" 
                        type="tel"
                        value={String(formData.contact_phone ?? '')} 
                        onChange={handleChange} 
                        required={false}
                        disabled={!isAdmin}
                    />
                </div>

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

export default PublicAffairsStakeholderForm;