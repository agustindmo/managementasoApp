import React, { useState } from 'react'; 
import { ref, set, push, serverTimestamp } from 'firebase/database'; 
import { CheckCircle, X } from 'lucide-react';
import CardTitle from '../ui/CardTitle.jsx';
import InputField from '../ui/InputField.jsx';
import SelectField from '../ui/SelectField.jsx';
import { INITIAL_MILESTONE_STATE, AMBITO_OPTIONS, TIPO_DE_ACTO_MILESTONES_OPTIONS, ANO_OPTIONS, ALL_YEAR_FILTER } from '../../utils/constants.js';
import { getDbPaths } from '../../services/firebase.js'; 
import { useTranslation } from '../../context/TranslationContext.jsx'; 

const MilestoneForm = ({ userId, db, mode = 'add', initialData = null, onClose }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState(initialData || INITIAL_MILESTONE_STATE);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    const isReady = !!db && !!userId;
    const formTitle = mode === 'edit' 
        ? `${t('policy.form.edit_milestone')}: ${formData?.nombre || '...'}` 
        : t('policy.form.add_milestone');

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isReady) return; 

        setIsLoading(true);
        setMessage('');
        setMessageType('success');

        try {
            const path = getDbPaths().milestones;
            if (mode === 'edit' && initialData?.id) {
                const itemRef = ref(db, `${path}/${initialData.id}`);
                await set(itemRef, {
                    ...formData,
                    updatedAt: serverTimestamp(),
                });
                setMessage(t('policy.form.success_milestone_update'));
            } else {
                const newItemRef = push(ref(db, path));
                await set(newItemRef, {
                    ...formData,
                    id: newItemRef.key, 
                    achievedAt: serverTimestamp(),
                    createdBy: userId,
                });
                setMessage(t('policy.form.success_milestone_add'));
            }
            setTimeout(onClose, 1000); 
        } catch (error) {
            console.error(`Error ${mode} Milestone document: `, error);
            setMessage(t('policy.form.fail')); 
            setMessageType('error');
            setIsLoading(false);
        }
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden max-w-4xl mx-auto">
            <div className="flex justify-between items-center pr-4">
                <CardTitle title={formTitle} icon={CheckCircle} />
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition" title="Close">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <InputField label={t('policy.form.nombre')} name="nombre" value={String(formData.nombre ?? '')} onChange={handleChange} />
                <InputField label={t('policy.form.okrs')} name="OKRs" value={String(formData.OKRs ?? '')} onChange={handleChange} rows={2} />

                <div className="grid grid-cols-2 gap-4">
                    <InputField label={t('policy.form.institucion')} name="institucion" value={String(formData.institucion ?? '')} onChange={handleChange} />
                    <SelectField label={t('policy.form.ambito')} name="ambito" options={AMBITO_OPTIONS} value={formData.ambito} onChange={handleChange} />
                </div>
                
                <SelectField label={t('policy.form.tipo_acto')} name="tipoDeActo" options={TIPO_DE_ACTO_MILESTONES_OPTIONS} value={formData.tipoDeActo} onChange={handleChange} />
                
                <div className="grid grid-cols-2 gap-4">
                    <SelectField label={t('policy.form.ano')} name="ano" options={ANO_OPTIONS.filter(opt => opt !== ALL_YEAR_FILTER)} value={formData.ano} onChange={handleChange} />
                    <InputField 
                        label={t('policy.form.ahorro')} 
                        name="ahorro" 
                        type="number" 
                        value={String(formData.ahorro ?? '')} 
                        onChange={handleChange} 
                    />
                </div>

                <InputField label={t('policy.form.archivo')} name="archivo" type="url" value={String(formData.archivo ?? '')} onChange={handleChange} required={false} />

                <button
                    type="submit"
                    disabled={isLoading || !isReady}
                    className={`w-full flex justify-center items-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-lg text-white transition duration-300 ease-in-out ${
                        isLoading || !isReady ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                    }`}
                >
                    {isLoading ? t('activity.form.saving') : !isReady ? t('activity.form.connecting') : (mode === 'edit' ? t('policy.form.update_milestone') : t('policy.form.add_milestone_btn'))}
                </button>
                {message && (
                    <p className={`text-center text-sm mt-3 ${messageType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {message}
                    </p>
                )}
            </form>
        </div>
    );
};

export default MilestoneForm;