import React, { useState } from 'react';
import { ref, set, push, serverTimestamp } from 'firebase/database';
import { Radio, X } from 'lucide-react';
import CardTitle from '../ui/CardTitle.jsx';
import InputField from '../ui/InputField.jsx';
import SelectField from '../ui/SelectField.jsx';
import { 
    INITIAL_MEDIA_STAKEHOLDER_STATE,
    MEDIA_STAKEHOLDER_CATEGORY_OPTIONS,
    MEDIA_SCOPE_OPTIONS,
    STAKEHOLDER_POSITION_OPTIONS
} from '../../utils/constants.js'; 
import { getDbPaths } from '../../services/firebase.js'; 
import { useTranslation } from '../../context/TranslationContext.jsx';

const MediaStakeholderForm = ({ userId, db, mode = 'add', initialData = null, onClose }) => {
    const { t } = useTranslation();
    
    const [formData, setFormData] = useState(initialData || INITIAL_MEDIA_STAKEHOLDER_STATE);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    const isReady = !!db && !!userId;
    const dbPathKey = 'mediaStakeholders';
    
    const formTitle = mode === 'edit' 
        ? t('media_stakeholder.form_edit') || 'Edit Media Contact'
        : t('media_stakeholder.form_add') || 'Add Media Contact';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isReady) return; 

        setIsLoading(true);
        setMessage('');
        setMessageType('success');

        try {
            const path = getDbPaths()[dbPathKey];
            const payload = { ...formData, updatedAt: serverTimestamp(), updatedBy: userId };

            if (mode === 'edit' && initialData?.id) {
                await set(ref(db, `${path}/${initialData.id}`), payload);
                setMessage(t('activity.form.success_update'));
            } else {
                const newItemRef = push(ref(db, path));
                await set(newItemRef, { ...payload, id: newItemRef.key, createdAt: serverTimestamp(), createdBy: userId });
                setMessage(t('activity.form.success_add'));
            }
            setTimeout(onClose, 1000); 
        } catch (error) {
            console.error(`Error ${mode} media stakeholder: `, error);
            setMessage(t('activity.form.fail'));
            setMessageType('error');
            setIsLoading(false);
        }
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden max-w-4xl mx-auto">
            <div className="flex justify-between items-center pr-4">
                <CardTitle title={formTitle} icon={Radio} />
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                        label={t('stakeholder.col.name')} 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        placeholder="Journalist Name"
                    />
                    <InputField 
                        label="Institution / Media Outlet" 
                        name="institution" 
                        value={formData.institution || ''} 
                        onChange={handleChange} 
                        placeholder="e.g. El Universo, CNN"
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                        label={t('stakeholder.col.email')} 
                        name="email" 
                        type="email"
                        value={formData.email} 
                        onChange={handleChange} 
                        required={false}
                    />
                    <InputField 
                        label={t('stakeholder.col.phone')} 
                        name="phone" 
                        type="tel"
                        value={formData.phone} 
                        onChange={handleChange} 
                        required={false}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg">
                    <SelectField 
                        label={t('stakeholder.col.type')} 
                        name="type" 
                        options={MEDIA_STAKEHOLDER_CATEGORY_OPTIONS.map(opt => ({ value: opt, label: opt }))}
                        value={formData.type} 
                        onChange={handleChange} 
                    />
                    <SelectField 
                        label={t('stakeholder.col.scope')} 
                        name="scope" 
                        options={MEDIA_SCOPE_OPTIONS.map(opt => ({ value: opt, label: opt }))}
                        value={formData.scope} 
                        onChange={handleChange} 
                    />
                    <SelectField 
                        label={t('stakeholder.col.position')} 
                        name="position" 
                        options={STAKEHOLDER_POSITION_OPTIONS.map(opt => ({ value: opt, label: t(opt) }))}
                        value={formData.position} 
                        onChange={handleChange} 
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !isReady}
                    className="w-full flex justify-center items-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all disabled:opacity-50"
                >
                    {isLoading ? t('activity.form.saving') : (mode === 'edit' ? t('activity.form.update') : t('activity.form.add'))}
                </button>
                {message && <p className={`text-center text-sm mt-3 ${messageType === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
            </form>
        </div>
    );
};

export default MediaStakeholderForm;