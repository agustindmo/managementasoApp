import React, { useState } from 'react';
import { ref, set, push, serverTimestamp } from 'firebase/database';
import { Handshake, X } from 'lucide-react';
import CardTitle from '../ui/CardTitle.jsx';
import InputField from '../ui/InputField.jsx';
import SelectField from '../ui/SelectField.jsx';
import { 
    INITIAL_PARTNER_STATE,
    PARTNER_AREA_OPTIONS
} from '../../utils/constants.js'; 
import { getDbPaths } from '../../services/firebase.js'; 
import { useTranslation } from '../../context/TranslationContext.jsx';

const FinancePartnerForm = ({ userId, db, mode = 'add', initialData = null, onClose, role }) => {
    const { t } = useTranslation();
    const isAdmin = role === 'admin';
    
    const [formData, setFormData] = useState(initialData || INITIAL_PARTNER_STATE);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    const isReady = !!db && !!userId;
    const dbPathKey = 'financePartners';
    
    const formTitle = mode === 'edit' 
        ? t('finance.relations.partner.form_edit')
        : t('finance.relations.partner.form_add');

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
            console.error(`Error ${mode} partner document: `, error);
            setMessage(t('activity.form.fail'));
            setMessageType('error');
            setIsLoading(false);
        }
    };

    return (
        <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden max-w-4xl mx-auto">
            <div className="flex justify-between items-center pr-4">
                <CardTitle title={formTitle} icon={Handshake} />
                <button onClick={onClose} className="p-3 text-gray-400 hover:text-white transition">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                        label="Institution / Organization" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        disabled={!isAdmin}
                    />
                     <SelectField 
                        label={t('finance.relations.partner.col.area')} 
                        name="area" 
                        options={PARTNER_AREA_OPTIONS} 
                        value={formData.area} 
                        onChange={handleChange} 
                        disabled={!isAdmin}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField 
                        label={t('finance.relations.partner.col.contact_person')} 
                        name="contact_person" 
                        value={formData.contact_person} 
                        onChange={handleChange} 
                        required={false}
                        disabled={!isAdmin}
                    />
                    <InputField 
                        label={t('finance.relations.partner.col.contact_email')} 
                        name="contact_email" 
                        type="email"
                        value={formData.contact_email} 
                        onChange={handleChange} 
                        required={false}
                        disabled={!isAdmin}
                    />
                    <InputField 
                        label="Contact Phone" 
                        name="contact_phone" 
                        type="tel"
                        value={formData.contact_phone || ''} 
                        onChange={handleChange} 
                        required={false}
                        disabled={!isAdmin}
                    />
                </div>

                <InputField 
                    label={t('finance.relations.partner.col.agreement_link')} 
                    name="agreement_link" 
                    type="url" 
                    value={formData.agreement_link} 
                    onChange={handleChange} 
                    required={false}
                    disabled={!isAdmin}
                />

                {isAdmin && (
                    <button
                        type="submit"
                        disabled={isLoading || !isReady}
                        className="w-full flex justify-center items-center py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg transition-all disabled:opacity-70"
                    >
                        {isLoading ? t('activity.form.saving') : (mode === 'edit' ? t('activity.form.update') : t('activity.form.add'))}
                    </button>
                )}
                {message && <p className={`text-center text-sm mt-2 ${messageType === 'error' ? 'text-red-400' : 'text-green-400'}`}>{message}</p>}
            </form>
        </div>
    );
};

export default FinancePartnerForm;