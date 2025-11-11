// src/components/forms/AnnouncementForm.jsx

import React, { useState } from 'react';
import { ref, set, push, serverTimestamp } from 'firebase/database';
import { Megaphone, X, Loader2 } from 'lucide-react';
import CardTitle from '../ui/CardTitle.jsx';
import InputField from '../ui/InputField.jsx';
import SelectField from '../ui/SelectField.jsx';
import { 
    INITIAL_ANNOUNCEMENT_STATE,
    EVENT_VISIBILITY_OPTIONS // Re-utilizando
} from '../../utils/constants.js'; 
import { getDbPaths } from '../../services/firebase.js'; 
import { useTranslation } from '../../context/TranslationContext.jsx';

const AnnouncementForm = ({ userId, db, mode = 'add', initialData = null, onClose, role }) => {
    const { t } = useTranslation();
    const isAdmin = role === 'admin';
    
    const [formData, setFormData] = useState(initialData || INITIAL_ANNOUNCEMENT_STATE);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    const isReady = !!db && !!userId;
    const dbPathKey = 'announcements';
    
    const formTitle = mode === 'edit' 
        ? t('bulletin.form.edit_title')
        : t('bulletin.form.add_title');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
            console.error(`Error ${mode} announcement: `, error);
            setMessage(t('activity.form.fail'));
            setMessageType('error');
            setIsLoading(false);
        }
    };

    return (
        <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <CardTitle title={formTitle} icon={Megaphone} />
                <button onClick={onClose} className="p-3 text-gray-400 hover:text-white transition" title="Close Form">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                
                <InputField 
                    label={t('bulletin.form.title')} 
                    name="title" 
                    value={String(formData.title ?? '')} 
                    onChange={handleChange} 
                    disabled={!isAdmin}
                />
                
                <SelectField 
                    label={t('event.form.visibility')} 
                    name="visibility" 
                    options={Object.keys(EVENT_VISIBILITY_OPTIONS).map(key => ({ value: key, label: t(`event.visibility.${key}`) }))} 
                    value={formData.visibility} 
                    onChange={handleChange} 
                    disabled={!isAdmin}
                />
                
                <InputField 
                    label={t('bulletin.form.content')} 
                    name="content"
                    as="textarea" // Usar textarea
                    value={String(formData.content ?? '')} 
                    onChange={handleChange} 
                    rows={8} // Más grande
                    disabled={!isAdmin}
                    placeholder={t('bulletin.form.content_placeholder')}
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

export default AnnouncementForm;