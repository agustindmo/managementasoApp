import React, { useState } from 'react';
import { ref, set, push, serverTimestamp } from 'firebase/database';
import { Gift, X } from 'lucide-react';
import CardTitle from '../ui/CardTitle.jsx';
import InputField from '../ui/InputField.jsx';
import { 
    INITIAL_DONATION_STATE,
} from '../../utils/constants.js'; 
import { getDbPaths } from '../../services/firebase.js'; 
import { useTranslation } from '../../context/TranslationContext.jsx';

const CheckboxField = ({ label, name, checked, onChange, t }) => {
    return (
        <label className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 cursor-pointer">
            <input 
                type="checkbox"
                name={name}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
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
    const formTitle = mode === 'edit' ? t('finance.donations.form_edit') : t('finance.donations.form_add');

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
                await set(ref(db, `${path}/${initialData.id}`), { ...formData, updatedAt: serverTimestamp(), updatedBy: userId });
                setMessage(t('activity.form.success_update'));
            } else {
                const newItemRef = push(ref(db, path));
                await set(newItemRef, { ...formData, id: newItemRef.key, createdAt: serverTimestamp(), createdBy: userId });
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
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden max-w-4xl mx-auto">
            <div className="flex justify-between items-center pr-4">
                <CardTitle title={formTitle} icon={Gift} />
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition" title="Close">
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
                            label="finance.donations.col.isContinued"
                            name="isContinued"
                            checked={formData.isContinued}
                            onChange={handleChange}
                            t={t}
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
                    className={`w-full flex justify-center items-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-lg text-white transition duration-300 ease-in-out ${
                        isLoading || !isReady ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                    }`}
                >
                    {isLoading ? t('activity.form.saving') : !isReady ? t('activity.form.connecting') : (mode === 'edit' ? t('activity.form.update') : t('activity.form.add'))}
                </button>
                {message && (
                    <p className={`text-center text-sm mt-2 ${messageType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {message}
                    </p>
                )}
            </form>
        </div>
    );
};

export default FinanceDonationForm;