// src/components/forms/FinanceDonationForm.jsx

import React, { useState } from 'react';
import { ref, set, push, serverTimestamp } from 'firebase/database';
import { Gift, X, Loader2 } from 'lucide-react';
import CardTitle from '../ui/CardTitle.jsx';
import InputField from '../ui/InputField.jsx';
import { 
    INITIAL_DONATION_STATE,
} from '../../utils/constants.js'; 
import { getDbPaths } from '../../services/firebase.js'; 
import { useTranslation } from '../../context/TranslationContext.jsx';

// Componente helper para Checkbox (copiado de PressLogForm)
const CheckboxField = ({ label, name, checked, onChange }) => {
    const { t } = useTranslation();
    return (
        <label className="flex items-center space-x-2 text-gray-200 hover:text-white cursor-pointer">
            <input 
                type="checkbox"
                name={name}
                className="rounded text-sky-500 focus:ring-sky-600 bg-sky-950/50 border-sky-700"
                checked={checked}
                onChange={onChange}
            />
            <span>{t(label)}</span>
        </label>
    );
};

const FinanceDonationForm = ({ userId, db, mode = 'add', initialData = null, onClose }) => {
    const { t } = useTranslation();
    
    const [formData, setFormData] = useState(initialData || INITIAL_DONATION_STATE);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    const isReady = !!db && !!userId;
    const dbPathKey = 'financeDonations';
    
    const formTitle = mode === 'edit' 
        ? t('finance.donations.form_edit')
        : t('finance.donations.form_add');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev, 
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || '' : value)
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
            console.error(`Error ${mode} donation document: `, error);
            setMessage(t('activity.form.fail'));
            setMessageType('error');
            setIsLoading(false);
        }
    };

    return (
        <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <CardTitle title={formTitle} icon={Gift} />
                <button onClick={onClose} className="p-3 text-gray-400 hover:text-white transition" title="Close Form">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                        label={t('finance.donations.col.donor')} 
                        name="donor" 
                        value={String(formData.donor ?? '')} 
                        onChange={handleChange} 
                    />
                    <InputField 
                        label={t('finance.donations.col.amount')} 
                        name="amount" 
                        type="number" 
                        value={String(formData.amount ?? '')} 
                        onChange={handleChange} 
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                        label={t('finance.donations.col.date')} 
                        name="date" 
                        type="date" 
                        value={String(formData.date ?? '')} 
                        onChange={handleChange} 
                    />
                    <div className="flex items-center pt-6">
                        <CheckboxField
                            label={t('finance.donations.col.isContinued')}
                            name="isContinued"
                            checked={formData.isContinued}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <InputField 
                    label={t('finance.donations.col.purpose')} 
                    name="purpose" 
                    value={String(formData.purpose ?? '')} 
                    onChange={handleChange} 
                    rows={2}
                />
                
                <InputField 
                    label={t('finance.donations.col.relation')} 
                    name="relation" 
                    value={String(formData.relation ?? '')} 
                    onChange={handleChange} 
                    rows={2}
                />
                
                <InputField 
                    label={t('finance.donations.col.fundingSource')} 
                    name="fundingSource" 
                    value={String(formData.fundingSource ?? '')} 
                    onChange={handleChange} 
                    rows={2}
                />

                <InputField 
                    label={t('activity.col.link')} 
                    name="link" 
                    type="url" 
                    value={String(formData.link ?? '')} 
                    onChange={handleChange} 
                    required={false}
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

export default FinanceDonationForm;