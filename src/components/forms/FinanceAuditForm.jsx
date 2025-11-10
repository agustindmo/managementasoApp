// src/components/forms/FinanceAuditForm.jsx

import React, { useState } from 'react';
import { ref, set, push, serverTimestamp } from 'firebase/database';
import { FileText, X, Loader2 } from 'lucide-react';
import CardTitle from '../ui/CardTitle.jsx';
import InputField from '../ui/InputField.jsx';
import { 
    INITIAL_AUDIT_STATE,
} from '../../utils/constants.js'; 
import { getDbPaths } from '../../services/firebase.js'; 
import { useTranslation } from '../../context/TranslationContext.jsx';

const FinanceAuditForm = ({ userId, db, mode = 'add', initialData = null, onClose }) => {
    const { t } = useTranslation();
    
    const [formData, setFormData] = useState(initialData || INITIAL_AUDIT_STATE);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    const isReady = !!db && !!userId;
    const dbPathKey = 'financeAudits';
    
    const formTitle = mode === 'edit' 
        ? t('finance.audits.form_edit')
        : t('finance.audits.form_add');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev, 
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isReady) return; 

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
            console.error(`Error ${mode} audit document: `, error);
            setMessage(t('activity.form.fail'));
            setMessageType('error');
            setIsLoading(false);
        }
    };

    return (
        <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <CardTitle title={formTitle} icon={FileText} />
                <button onClick={onClose} className="p-3 text-gray-400 hover:text-white transition" title="Close Form">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField 
                        label={t('finance.audits.col.auditor')} 
                        name="auditor" 
                        value={String(formData.auditor ?? '')} 
                        onChange={handleChange} 
                    />
                    <InputField 
                        label={t('finance.audits.col.startDate')} 
                        name="startDate" 
                        type="date" 
                        value={String(formData.startDate ?? '')} 
                        onChange={handleChange} 
                    />
                    <InputField 
                        label={t('finance.audits.col.endDate')} 
                        name="endDate" 
                        type="date" 
                        value={String(formData.endDate ?? '')} 
                        onChange={handleChange} 
                    />
                </div>

                <InputField 
                    label={t('finance.audits.col.goals')} 
                    name="goals" 
                    value={String(formData.goals ?? '')} 
                    onChange={handleChange} 
                    rows={3}
                />

                <InputField 
                    label={t('finance.audits.col.results')} 
                    name="results" 
                    value={String(formData.results ?? '')} 
                    onChange={handleChange} 
                    rows={3}
                />
                
                <InputField 
                    label={t('finance.audits.col.observations')} 
                    name="observations" 
                    value={String(formData.observations ?? '')} 
                    onChange={handleChange} 
                    rows={3}
                />

                <button
                    type="submit"
                    disabled={isLoading || !isReady}
                    className={`w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition duration-300 ease-in-out ${
                        isLoading || !isReady ? 'bg-sky-400 cursor-not-allowed opacity-70' : 'bg-sky-600 hover:bg-sky-700'
                    }`}
                >
                    {isLoading ? t('activity.form.saving') : !isReady ? t('activity.form.connecting') : (mode === 'edit' ? t('activity.form.update') : t('activity.form.add'))}
                </button>
                {message && (
                    <p className={`text-center text-sm mt-2 ${messageType === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {message}
                    </p>
                )}
            </form>
        </div>
    );
};

export default FinanceAuditForm;