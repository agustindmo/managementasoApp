import React, { useState } from 'react';
import { ref, set, push, serverTimestamp } from 'firebase/database';
import { DollarSign, X, Loader2 } from 'lucide-react';
import CardTitle from '../ui/CardTitle.jsx';
import InputField from '../ui/InputField.jsx';
import SelectField from '../ui/SelectField.jsx';
import { 
    INITIAL_COST_STATE_ADMIN,
    INITIAL_COST_STATE_NON_OP,
    COST_CATEGORIES_ADMIN,
    COST_CATEGORIES_NON_OP
} from '../../utils/constants.js'; 
import { getDbPaths } from '../../services/firebase.js'; 
import { useTranslation } from '../../context/TranslationContext.jsx';

const FinanceCostForm = ({ userId, db, mode = 'add', initialData = null, onClose, costType, role }) => { 
    const { t } = useTranslation();
    const isAdmin = role === 'admin'; 
    
    const isAdmintype = costType === 'admin';
    const initialFormState = isAdmintype ? INITIAL_COST_STATE_ADMIN : INITIAL_COST_STATE_NON_OP;
    const categoryOptions = isAdmintype ? COST_CATEGORIES_ADMIN : COST_CATEGORIES_NON_OP;
    const dbPathKey = isAdmintype ? 'financeAdminCosts' : 'financeNonOpCosts';
    
    const [formData, setFormData] = useState(initialData || initialFormState);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    const isReady = !!db && !!userId;
    
    const formTitle = mode === 'edit' 
        ? t(isAdmintype ? 'finance.admin_costs.form_edit' : 'finance.nonop_costs.form_edit')
        : t(isAdmintype ? 'finance.admin_costs.form_add' : 'finance.nonop_costs.form_add');

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev, 
            [name]: type === 'number' ? parseFloat(value) || '' : value
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
            console.error(`Error ${mode} cost document: `, error);
            setMessage(t('activity.form.fail'));
            setMessageType('error');
            setIsLoading(false);
        }
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden max-w-4xl mx-auto">
            <div className="flex justify-between items-center pr-4">
                <CardTitle title={formTitle} icon={DollarSign} />
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition" title="Close">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                        label={t('finance.col.date')} 
                        name="date" 
                        type="date" 
                        value={String(formData.date ?? '')} 
                        onChange={handleChange} 
                        disabled={!isAdmin} 
                    />
                    <SelectField 
                        label={t('finance.col.category')} 
                        name="category" 
                        options={categoryOptions} 
                        value={formData.category} 
                        onChange={handleChange} 
                        disabled={!isAdmin} 
                    />
                </div>

                <InputField 
                    label={t('finance.col.description')} 
                    name="description" 
                    value={String(formData.description ?? '')} 
                    onChange={handleChange} 
                    placeholder={t('finance.col.description_placeholder')}
                    required={true}
                    rows={2}
                    disabled={!isAdmin} 
                />

                <InputField 
                    label={t('finance.col.amount')} 
                    name="amount" 
                    type="number" 
                    value={String(formData.amount ?? '')} 
                    onChange={handleChange} 
                    required={true}
                    disabled={!isAdmin} 
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

export default FinanceCostForm;