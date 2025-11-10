// src/components/forms/NewMemberRequestForm.jsx

import React, { useState } from 'react';
import { ref, set, push, serverTimestamp } from 'firebase/database';
import { UserPlus, Loader2, CheckCircle, XCircle, Save } from 'lucide-react';
import CardTitle from '../ui/CardTitle.jsx';
import InputField from '../ui/InputField.jsx';
import SelectField from '../ui/SelectField.jsx';
import { 
    INITIAL_MEMBER_REQUEST_STATE,
    INDUSTRY_ACTIVITIES,
    ECUADOR_PROVINCES,
    ECUADOR_DATA,
    MEMBER_REQUEST_STATUS_OPTIONS
} from '../../utils/constants.js'; 
import { getDbPaths } from '../../services/firebase.js'; 
import { useTranslation } from '../../context/TranslationContext.jsx';

const NewMemberRequestForm = ({ userId, db }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState(INITIAL_MEMBER_REQUEST_STATE);
    const [cityOptions, setCityOptions] = useState(ECUADOR_DATA[formData.province] || []);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success'); 

    const isReady = !!db && !!userId;

    const handleProvinceChange = (e) => {
        const newProvince = e.target.value;
        const newCities = ECUADOR_DATA[newProvince] || [];
        setCityOptions(newCities);
        setFormData(prev => ({
            ...prev,
            province: newProvince,
            city: newCities[0] || '' // Seleccionar la primera ciudad de la nueva lista
        }));
    };

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
            const path = getDbPaths().memberRequests;
            const newItemRef = push(ref(db, path));
            
            await set(newItemRef, {
                ...formData,
                id: newItemRef.key, 
                status: 'pending_director_approval', // Estado inicial
                createdBy: userId,
                createdAt: serverTimestamp(),
            });
            
            setMessage(t('member_request.form.success_add'));
            setMessageType('success');
            setFormData(INITIAL_MEMBER_REQUEST_STATE); // Resetear formulario
            setCityOptions(ECUADOR_DATA[INITIAL_MEMBER_REQUEST_STATE.province] || []);

            setTimeout(() => setMessage(''), 3000); 
        } catch (error) {
            console.error("Error creating new member request: ", error);
            setMessage(t('member_request.form.fail'));
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden max-w-4xl mx-auto">
            <CardTitle title={t('member_request.form.title')} icon={UserPlus} />
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                
                {/* Sección 1: Compañía */}
                <div className="p-4 rounded-lg border border-sky-800/50 bg-sky-950/30 space-y-4">
                    <h3 className="text-lg font-semibold text-white">{t('member_request.form.company_title')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label={t('member_request.form.company_name')} name="company_name" value={formData.company_name} onChange={handleChange} />
                        <InputField label={t('member_request.form.commercial_name')} name="commercial_name" value={formData.commercial_name} onChange={handleChange} required={false} />
                        <InputField label={t('member_request.form.legal_rep')} name="legal_rep" value={formData.legal_rep} onChange={handleChange} />
                        <InputField label={t('member_request.form.ceo')} name="ceo" value={formData.ceo} onChange={handleChange} required={false} />
                    </div>
                    <InputField label={t('member_request.form.partners')} name="partners" value={formData.partners} onChange={handleChange} rows={2} required={false} />
                </div>

                {/* Sección 2: Actividad y Ubicación */}
                <div className="p-4 rounded-lg border border-sky-800/50 bg-sky-950/30 space-y-4">
                    <h3 className="text-lg font-semibold text-white">{t('member_request.form.activity_location_title')}</h3>
                    <SelectField label={t('profile.activity')} name="activity" options={INDUSTRY_ACTIVITIES} value={formData.activity} onChange={handleChange} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SelectField label={t('profile.farm_province')} name="province" options={ECUADOR_PROVINCES} value={formData.province} onChange={handleProvinceChange} />
                        <SelectField label={t('profile.farm_city')} name="city" options={cityOptions} value={formData.city} onChange={handleChange} />
                    </div>
                </div>

                {/* Sección 3: Referencias y Riesgo */}
                <div className="p-4 rounded-lg border border-sky-800/50 bg-sky-950/30 space-y-4">
                    <h3 className="text-lg font-semibold text-white">{t('member_request.form.risk_title')}</h3>
                    <InputField label={t('member_request.form.commercial_refs')} name="commercial_refs" value={formData.commercial_refs} onChange={handleChange} rows={3} required={false} />
                    <SelectField 
                        label={t('member_request.form.risk_status')} 
                        name="risk_status" 
                        options={MEMBER_REQUEST_STATUS_OPTIONS.map(opt => ({ value: opt, label: t(`member_request.risk_opts.${opt.toLowerCase()}`) }))} 
                        value={formData.risk_status} 
                        onChange={handleChange} 
                    />
                </div>

                {/* Botón de Guardar */}
                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-sky-800/50">
                    {message && (
                        <span className={`text-sm flex items-center ${messageType === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                            {messageType === 'success' ? <CheckCircle className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />} 
                            {message}
                        </span>
                    )}
                    <button
                        type="submit"
                        disabled={isLoading || !isReady}
                        className={`flex justify-center items-center py-2 px-5 border border-transparent text-sm font-medium rounded-lg text-white transition duration-300 ease-in-out ${
                            isLoading ? 'bg-sky-400 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700'
                        }`}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {t('member_request.form.submit')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewMemberRequestForm;