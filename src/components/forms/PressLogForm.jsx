// src/components/forms/PressLogForm.jsx

import React, { useState } from 'react';
import { ref, set, push, serverTimestamp } from 'firebase/database';
import { Megaphone, X, Users, Plus, Trash2 } from 'lucide-react'; // Iconos añadidos
import CardTitle from '../ui/CardTitle.jsx';
import InputField from '../ui/InputField.jsx';
import SelectField from '../ui/SelectField.jsx';
import { 
    INITIAL_PRESS_LOG_STATE,
    PRESS_LOG_ACTIVITY_OPTIONS,
    PRESS_LOG_FORMAT_OPTIONS,
    PRESS_LOG_REACH_OPTIONS,
    // Importar constantes de Media Stakeholder
    INITIAL_MEDIA_STAKEHOLDER_STATE,
    MEDIA_STAKEHOLDER_TYPE_OPTIONS,
    MEDIA_STAKEHOLDER_AMBITO_OPTIONS,
    MEDIA_STAKEHOLDER_ROLE_OPTIONS,
    MEDIA_STAKEHOLDER_POSITION_OPTIONS
} from '../../utils/constants.js'; 
import { getDbPaths } from '../../services/firebase.js'; 
import { useTranslation } from '../../context/TranslationContext.jsx';

// Componente helper para Checkbox
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

const PressLogForm = ({ userId, db, mode = 'add', initialData = null, onClose }) => {
    const { t } = useTranslation();
    
    // Asegurar que los arrays existan en los datos iniciales
    const initialFormData = initialData ? 
        { ...initialData, format: initialData.format || [], mediaStakeholders: initialData.mediaStakeholders || [] } : 
        INITIAL_PRESS_LOG_STATE;
        
    const [formData, setFormData] = useState(initialFormData);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    // Nuevo estado for media stakeholders
    const [newStakeholder, setNewStakeholder] = useState(INITIAL_MEDIA_STAKEHOLDER_STATE);

    const isReady = !!db && !!userId;
    const formTitle = mode === 'edit' 
        ? `${t('press_log.form.edit_title')}` 
        : t('press_log.form.add_title');

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev, 
            [name]: type === 'number' ? parseFloat(value) || '' : value
        }));
    };

    // Handler para los checkboxes de "Formato"
    const handleFormatChange = (formatOption) => {
        setFormData(prev => {
            const currentFormats = prev.format || [];
            const isChecked = currentFormats.includes(formatOption);
            const newFormats = isChecked
                ? currentFormats.filter(item => item !== formatOption)
                : [...currentFormats, formatOption];
            return { ...prev, format: newFormats };
        });
    };

    // --- Handlers de Media Stakeholder (NUEVO) ---
    const handleStakeholderChange = (e) => {
        const { name, value } = e.target;
        setNewStakeholder(prev => ({ ...prev, [name]: value }));
    };
    
    const addStakeholder = (e) => {
        e.preventDefault();
        if (!newStakeholder.name.trim()) {
            setMessage(t('policy.form.stakeholder_error'));
            setMessageType('error');
            return;
        }
        
        const stakeholderToAdd = {
            id: Date.now(), 
            ...newStakeholder,
        };
        setFormData(prev => ({ ...prev, mediaStakeholders: [...prev.mediaStakeholders, stakeholderToAdd] }));
        setNewStakeholder(INITIAL_MEDIA_STAKEHOLDER_STATE);
        setMessage('');
    };
    
    const removeStakeholder = (id) => {
        setFormData(prev => ({ ...prev, mediaStakeholders: prev.mediaStakeholders.filter(s => s.id !== id) }));
    };

    // --- Submit Actualizado ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isReady) return; 

        setIsLoading(true);
        setMessage('');
        setMessageType('success');

        try {
            const path = getDbPaths().pressLog;
            
            // Limpiar IDs temporales
            const cleanData = {
                ...formData,
                mediaStakeholders: (formData.mediaStakeholders || []).map(({ id, ...rest }) => rest),
            };

            if (mode === 'edit' && initialData?.id) {
                const itemRef = ref(db, `${path}/${initialData.id}`);
                await set(itemRef, {
                    ...cleanData,
                    updatedAt: serverTimestamp(),
                    updatedBy: userId,
                });
                setMessage(t('press_log.form.success_update'));
            } else {
                const newItemRef = push(ref(db, path));
                await set(newItemRef, {
                    ...cleanData,
                    id: newItemRef.key,
                    createdAt: serverTimestamp(),
                    createdBy: userId,
                });
                setMessage(t('press_log.form.success_add'));
            }

            setTimeout(onClose, 1000); 
        } catch (error) {
            console.error(`Error ${mode} comms log document: `, error);
            setMessage(t('press_log.form.fail'));
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField 
                        label={t('press_log.form.activity')} 
                        name="activity" 
                        options={PRESS_LOG_ACTIVITY_OPTIONS.map(opt => ({ value: opt, label: t(`press_log.activity_opts.${opt.toLowerCase().replace(/ /g, '_')}`) }))} 
                        value={formData.activity} 
                        onChange={handleChange} 
                    />
                    <InputField 
                        label={t('press_log.form.date')} 
                        name="date" 
                        type="date" 
                        value={String(formData.date ?? '')} 
                        onChange={handleChange} 
                    />
                </div>

                <InputField 
                    label={t('press_log.form.media')} 
                    name="mediaName" 
                    value={String(formData.mediaName ?? '')} 
                    onChange={handleChange} 
                    placeholder={t('press_log.form.media_placeholder')}
                    required={false}
                />

                <div className="p-4 rounded-lg border border-sky-800/50 bg-sky-950/30 space-y-2">
                    <label className="block text-sm font-medium text-gray-200">{t('press_log.form.format')}</label>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {PRESS_LOG_FORMAT_OPTIONS.map(format => (
                            <CheckboxField
                                key={format}
                                label={`press_log.format_opts.${format.toLowerCase()}`}
                                name={format}
                                checked={(formData.format || []).includes(format)}
                                onChange={() => handleFormatChange(format)}
                            />
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SelectField 
                        label={t('press_log.form.reach')} 
                        name="reach" 
                        options={PRESS_LOG_REACH_OPTIONS.map(opt => ({ value: opt, label: t(`press_log.reach_opts.${opt.toLowerCase()}`) }))} 
                        value={formData.reach} 
                        onChange={handleChange} 
                    />
                    <InputField 
                        label={t('press_log.form.audience')} 
                        name="audience" 
                        type="number" 
                        value={String(formData.audience ?? '')} 
                        onChange={handleChange} 
                        required={false}
                    />
                    <InputField 
                        label={t('press_log.form.free_press')} 
                        name="freePress" 
                        type="number" 
                        value={String(formData.freePress ?? '')} 
                        onChange={handleChange} 
                        required={false}
                    />
                </div>

                <InputField 
                    label={t('press_log.form.link')} 
                    name="link" 
                    type="url" 
                    value={String(formData.link ?? '')} 
                    onChange={handleChange} 
                    required={false}
                />

                {/* --- Media Stakeholder Entry Section (NUEVO) --- */}
                <div className="border-t border-sky-800/50 pt-4 mt-4">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-sky-400" />
                        {t('media_stakeholder.form_title')} ({formData.mediaStakeholders.length})
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end bg-sky-950/30 border border-sky-800/50 p-4 rounded-lg">
                         <InputField 
                            label={t('policy.form.stakeholder_name')} 
                            name="name" 
                            value={newStakeholder.name} 
                            onChange={handleStakeholderChange} 
                            required={false} 
                        />
                        <SelectField 
                            label={t('policy.form.stakeholder_type')} 
                            name="type" 
                            options={Object.values(MEDIA_STAKEHOLDER_TYPE_OPTIONS).map(opt => ({ value: opt, label: t(`stakeholder.category.${opt.replace(/ /g, '_')}`) }))}
                            value={newStakeholder.type} 
                            onChange={handleStakeholderChange} 
                        />
                         <SelectField 
                            label={t('policy.form.stakeholder_scope')} 
                            name="ambito" 
                            options={Object.values(MEDIA_STAKEHOLDER_AMBITO_OPTIONS)} 
                            value={newStakeholder.ambito} 
                            onChange={handleStakeholderChange} 
                        />
                        <SelectField 
                            label={t('policy.form.stakeholder_role')} 
                            name="role" 
                            options={MEDIA_STAKEHOLDER_ROLE_OPTIONS.map(opt => ({ value: opt, label: t(opt) }))} 
                            value={newStakeholder.role} 
                            onChange={handleStakeholderChange} 
                        />
                        <SelectField 
                            label={t('policy.form.stakeholder_position')} 
                            name="position" 
                            options={MEDIA_STAKEHOLDER_POSITION_OPTIONS.map(opt => ({ value: opt, label: t(opt) }))} 
                            value={newStakeholder.position} 
                            onChange={handleStakeholderChange} 
                        />
                        <button
                            type="button"
                            onClick={addStakeholder}
                            className="w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-sky-600 hover:bg-sky-700 transition duration-300 shadow-md h-10"
                            title="Add Media Stakeholder"
                        >
                            <Plus className="w-4 h-4 mr-1" /> {t('policy.form.stakeholder_add')}
                        </button>
                    </div>

                    <div className="max-h-40 overflow-y-auto border border-sky-800/50 rounded-lg p-2 bg-black/30">
                        {formData.mediaStakeholders.length === 0 ? (
                            <p className="text-center text-sm text-gray-500">{t('policy.form.stakeholder_empty')}</p>
                        ) : (
                            <ul className="space-y-1">
                                {formData.mediaStakeholders.map((s, index) => (
                                    <li key={s.id} className="flex justify-between items-start bg-sky-950/50 p-2 rounded-md hover:bg-sky-900/60">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-white">{index + 1}. {s.name}</p>
                                            <p className="text-xs text-gray-400 capitalize">
                                                {t(s.role)} | {t(s.position)} | {s.ambito} | {t(`stakeholder.category.${s.type.replace(/ /g, '_')}`)}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeStakeholder(s.id)}
                                            className="text-red-400 hover:text-red-300 p-1 ml-2"
                                            title="Remove Stakeholder"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* --- Botón de Submit --- */}
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

export default PressLogForm;