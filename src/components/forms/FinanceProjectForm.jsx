// src/components/forms/FinanceProjectForm.jsx

import React, { useState } from 'react';
import { ref, set, push, serverTimestamp } from 'firebase/database';
import { Star, X, Loader2, Plus, Trash2 } from 'lucide-react';
import CardTitle from '../ui/CardTitle.jsx';
import InputField from '../ui/InputField.jsx';
import SelectField from '../ui/SelectField.jsx';
import { 
    INITIAL_PROJECT_STATE,
    FUNDING_SOURCE_OPTIONS,
    ECUADOR_PROVINCES,
    ECUADOR_DATA
} from '../../utils/constants.js'; 
import { getDbPaths } from '../../services/firebase.js'; 
import { useTranslation } from '../../context/TranslationContext.jsx';

// --- Helper Components ---

// Componente helper para Checkbox
const CheckboxField = ({ label, name, checked, onChange, t }) => (
    <label className="flex items-center space-x-2 text-gray-200 hover:text-white cursor-pointer">
        <input 
            type="checkbox"
            name={name}
            className="rounded text-sky-500 focus:ring-sky-600 bg-sky-950/50 border-sky-700"
            checked={checked}
            onChange={onChange}
        />
        <span>{t ? t(label) : label}</span>
    </label>
);

// Componente helper para entradas de tags (Objetivos, Beneficiarios)
const TagInput = ({ labelKey, items, onAddItem, onRemoveItem, t }) => {
    const [value, setValue] = useState('');

    const handleAdd = (e) => {
        e.preventDefault();
        if (value.trim()) {
            onAddItem(value.trim());
            setValue('');
        }
    };

    return (
        <div className="p-4 rounded-lg border border-sky-800/50 bg-sky-950/30 space-y-3">
            <label className="block text-sm font-medium text-gray-200">{t(labelKey)}</label>
            <div className="flex space-x-2">
                <InputField 
                    label=""
                    name="tagValue"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    required={false}
                />
                <button
                    type="button"
                    onClick={handleAdd}
                    className="flex-shrink-0 flex justify-center items-center py-2 px-3 border border-transparent text-sm font-medium rounded-lg text-white bg-sky-600 hover:bg-sky-700 transition duration-300 shadow-md h-10 mt-1"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[20px]">
                {items.map((item, index) => (
                    <span key={index} className="flex items-center bg-sky-700 text-white text-sm font-medium px-2 py-0.5 rounded-full">
                        {item}
                        <button
                            type="button"
                            onClick={() => onRemoveItem(index)}
                            className="ml-1.5 text-sky-200 hover:text-white"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
            </div>
        </div>
    );
};

// --- Main Form Component ---

const FinanceProjectForm = ({ userId, db, mode = 'add', initialData = null, onClose }) => {
    const { t } = useTranslation();
    
    const [formData, setFormData] = useState(initialData || INITIAL_PROJECT_STATE);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    // Estado para el formulario de multi-ubicación
    const [newLocation, setNewLocation] = useState({ province: ECUADOR_PROVINCES[0], city: ECUADOR_DATA[ECUADOR_PROVINCES[0]][0] });
    const [cityOptions, setCityOptions] = useState(ECUADOR_DATA[ECUADOR_PROVINCES[0]] || []);

    const isReady = !!db && !!userId;
    const dbPathKey = 'financeProjects';
    
    const formTitle = mode === 'edit' 
        ? t('finance.projects.form_edit')
        : t('finance.projects.form_add');

    // --- Handlers ---

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev, 
            [name]: type === 'number' ? parseFloat(value) || '' : value
        }));
    };

    const handleCheckboxChange = (option) => {
        setFormData(prev => {
            const currentSources = prev.fundingSources || [];
            const isChecked = currentSources.includes(option);
            const newSources = isChecked
                ? currentSources.filter(item => item !== option)
                : [...currentSources, option];
            return { ...prev, fundingSources: newSources };
        });
    };

    // Handlers para Objetivos
    const addObjective = (objective) => {
        setFormData(prev => ({ ...prev, objectives: [...prev.objectives, objective] }));
    };
    const removeObjective = (index) => {
        setFormData(prev => ({ ...prev, objectives: prev.objectives.filter((_, i) => i !== index) }));
    };

    // Handlers para Beneficiarios
    const addBeneficiary = (beneficiary) => {
        setFormData(prev => ({ ...prev, beneficiaries: [...prev.beneficiaries, beneficiary] }));
    };
    const removeBeneficiary = (index) => {
        setFormData(prev => ({ ...prev, beneficiaries: prev.beneficiaries.filter((_, i) => i !== index) }));
    };
    
    // Handlers para Ubicaciones
    const handleLocationProvinceChange = (e) => {
        const newProvince = e.target.value;
        const newCities = ECUADOR_DATA[newProvince] || [];
        setCityOptions(newCities);
        setNewLocation({ province: newProvince, city: newCities[0] || '' });
    };
    
    const handleLocationCityChange = (e) => {
        setNewLocation(prev => ({ ...prev, city: e.target.value }));
    };

    const addLocation = (e) => {
        e.preventDefault();
        setFormData(prev => ({ ...prev, locations: [...prev.locations, newLocation] }));
    };
    
    const removeLocation = (index) => {
        setFormData(prev => ({ ...prev, locations: prev.locations.filter((_, i) => i !== index) }));
    };

    // --- Submit ---
    
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
            console.error(`Error ${mode} project document: `, error);
            setMessage(t('activity.form.fail'));
            setMessageType('error');
            setIsLoading(false);
        }
    };

    return (
        <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <CardTitle title={formTitle} icon={Star} />
                <button onClick={onClose} className="p-3 text-gray-400 hover:text-white transition" title="Close Form">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                
                <InputField 
                    label={t('finance.projects.col.name')} 
                    name="name" 
                    value={String(formData.name ?? '')} 
                    onChange={handleChange} 
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField 
                        label={t('finance.projects.col.amount')} 
                        name="amount" 
                        type="number" 
                        value={String(formData.amount ?? '')} 
                        onChange={handleChange} 
                    />
                    <InputField 
                        label={t('finance.projects.col.startDate')} 
                        name="startDate" 
                        type="date" 
                        value={String(formData.startDate ?? '')} 
                        onChange={handleChange} 
                    />
                    <InputField 
                        label={t('finance.projects.col.endDate')} 
                        name="endDate" 
                        type="date" 
                        value={String(formData.endDate ?? '')} 
                        onChange={handleChange} 
                    />
                </div>

                <div className="p-4 rounded-lg border border-sky-800/50 bg-sky-950/30 space-y-2">
                    <label className="block text-sm font-medium text-gray-200">{t('finance.projects.col.fundingSources')}</label>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {FUNDING_SOURCE_OPTIONS.map(source => (
                            <CheckboxField
                                key={source}
                                label={source} // Se puede traducir si se añaden claves
                                name={source}
                                checked={(formData.fundingSources || []).includes(source)}
                                onChange={() => handleCheckboxChange(source)}
                            />
                        ))}
                    </div>
                </div>
                
                <TagInput
                    labelKey="finance.projects.col.objectives"
                    items={formData.objectives || []}
                    onAddItem={addObjective}
                    onRemoveItem={removeObjective}
                    t={t}
                />
                
                <TagInput
                    labelKey="finance.projects.col.beneficiaries"
                    items={formData.beneficiaries || []}
                    onAddItem={addBeneficiary}
                    onRemoveItem={removeBeneficiary}
                    t={t}
                />

                <div className="p-4 rounded-lg border border-sky-800/50 bg-sky-950/30 space-y-3">
                    <label className="block text-sm font-medium text-gray-200">{t('finance.projects.col.locations')}</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <SelectField label={t('profile.farm_province')} name="province" options={ECUADOR_PROVINCES} value={newLocation.province} onChange={handleLocationProvinceChange} />
                        <SelectField label={t('profile.farm_city')} name="city" options={cityOptions} value={newLocation.city} onChange={handleLocationCityChange} />
                        <button
                            type="button"
                            onClick={addLocation}
                            className="flex justify-center items-center py-2 px-3 border border-transparent text-sm font-medium rounded-lg text-white bg-sky-600 hover:bg-sky-700 transition duration-300 shadow-md h-10"
                        >
                            <Plus className="w-4 h-4 mr-1" /> {t('profile.add_farm')}
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[20px] pt-2">
                        {(formData.locations || []).map((loc, index) => (
                            <span key={index} className="flex items-center bg-sky-700 text-white text-sm font-medium px-2 py-0.5 rounded-full">
                                {loc.city}, {loc.province}
                                <button
                                    type="button"
                                    onClick={() => removeLocation(index)}
                                    className="ml-1.5 text-sky-200 hover:text-white"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                <InputField 
                    label={t('finance.projects.col.impactLink')} 
                    name="impactLink" 
                    type="url" 
                    value={String(formData.impactLink ?? '')} 
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

export default FinanceProjectForm;