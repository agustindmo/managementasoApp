// src/components/forms/PressLogForm.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ref, set, push, serverTimestamp, onValue } from 'firebase/database';
import { Megaphone, X, Plus, Trash2, Search } from 'lucide-react';
import CardTitle from '../ui/CardTitle.jsx';
import InputField from '../ui/InputField.jsx';
import SelectField from '../ui/SelectField.jsx';
import { 
    INITIAL_PRESS_LOG_STATE,
    PRESS_LOG_FORMAT_OPTIONS,
    PRESS_LOG_REACH_OPTIONS,
    IMPACT_OPTIONS,
} from '../../utils/constants.js'; 
import { getDbPaths } from '../../services/firebase.js'; 
import { useTranslation } from '../../context/TranslationContext.jsx';

// --- Helper: Snapshot to Array ---
const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({
        id: key,
        ...val[key],
    }));
};

// --- Helper: Componente de Búsqueda Multi-Select (para Agenda y Stakeholders) ---
const MultiSearchSelect = ({ labelKey, placeholderKey, selectedItems, allOptions, onToggleItem, t }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return [];
        return allOptions.filter(
            opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
                   !selectedItems.includes(opt.value)
        );
    }, [searchTerm, allOptions, selectedItems]);

    return (
        <div className="p-4 rounded-lg border border-sky-800/50 bg-sky-950/30 space-y-3">
            <label className="block text-sm font-medium text-gray-200">{t(labelKey)}</label>
            <InputField 
                label=""
                name={`search_${labelKey}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                required={false}
                placeholder={t(placeholderKey)}
                icon={Search}
            />
            {/* Resultados de Búsqueda */}
            {filteredOptions.length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-1 rounded-lg border border-sky-700 bg-black/40 p-2">
                    {filteredOptions.slice(0, 5).map(opt => (
                        <div 
                            key={opt.value}
                            className="p-2 text-sm text-gray-200 rounded-md hover:bg-sky-700 cursor-pointer"
                            onClick={() => {
                                onToggleItem(opt.value);
                                setSearchTerm('');
                            }}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
            {/* Items Seleccionados */}
            <div className="flex flex-wrap gap-2 min-h-[20px] pt-2">
                {selectedItems.map((itemKey) => {
                    const itemLabel = allOptions.find(o => o.value === itemKey)?.label || itemKey;
                    return (
                        <span key={itemKey} className="flex items-center bg-sky-700 text-white text-sm font-medium px-2 py-0.5 rounded-full">
                            {itemLabel}
                            <button
                                type="button"
                                onClick={() => onToggleItem(itemKey)}
                                className="ml-1.5 text-sky-200 hover:text-white"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

// --- Helper: Componente de Entradas de Medios (Media + Formato) ---
const MediaEntry = ({ t, onAdd, onRemove, entries }) => {
    const [mediaName, setMediaName] = useState('');
    const [format, setFormat] = useState(PRESS_LOG_FORMAT_OPTIONS[0]);

    const handleAdd = (e) => {
        e.preventDefault();
        if (!mediaName.trim()) return;
        onAdd({ name: mediaName.trim(), format: format });
        setMediaName('');
        setFormat(PRESS_LOG_FORMAT_OPTIONS[0]);
    };

    return (
        <div className="p-4 rounded-lg border border-sky-800/50 bg-sky-950/30 space-y-3">
            <label className="block text-sm font-medium text-gray-200">{t('press_log.form.media_entries')}</label>
            {/* Formulario de Añadir */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <InputField 
                    label={t('press_log.form.media_name')}
                    name="newMediaName"
                    value={mediaName}
                    onChange={(e) => setMediaName(e.target.value)}
                    required={false}
                />
                <SelectField
                    label={t('press_log.form.format')}
                    name="newMediaFormat"
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    options={PRESS_LOG_FORMAT_OPTIONS.map(opt => ({ value: opt, label: t(`press_log.format_opts.${opt.toLowerCase()}`) }))}
                />
                <button
                    type="button"
                    onClick={handleAdd}
                    className="flex-shrink-0 flex justify-center items-center py-2 px-3 border border-transparent text-sm font-medium rounded-lg text-white bg-sky-600 hover:bg-sky-700 transition duration-300 shadow-md h-10"
                >
                    <Plus className="w-4 h-4 mr-1" /> {t('press_log.form.add_media')}
                </button>
            </div>
            {/* Lista de Añadidos */}
            <div className="flex flex-wrap gap-2 min-h-[20px] pt-2">
                {entries.map((entry, index) => (
                    <span key={index} className="flex items-center bg-sky-700 text-white text-sm font-medium px-2 py-0.5 rounded-full">
                        {entry.name} <span className="text-xs text-sky-200 ml-1.5">({t(`press_log.format_opts.${entry.format.toLowerCase()}`)})</span>
                        <button
                            type="button"
                            onClick={() => onRemove(index)}
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


// --- Componente Principal del Formulario ---
const PressLogForm = ({ userId, db, mode = 'add', initialData = null, onClose }) => {
    const { t } = useTranslation();
    
    // Asegurar que los arrays existan en los datos iniciales
    const initialFormData = initialData ? 
        { ...initialData, 
          agendaItems: initialData.agendaItems || [], 
          mediaEntries: initialData.mediaEntries || [],
          mediaStakeholderKeys: initialData.mediaStakeholderKeys || []
        } : 
        INITIAL_PRESS_LOG_STATE;
        
    const [formData, setFormData] = useState(initialFormData);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    // --- Cargar datos para selects ---
    const [agendaOptions, setAgendaOptions] = useState([]);
    const [stakeholderOptions, setStakeholderOptions] = useState([]);

    const isReady = !!db && !!userId;
    const formTitle = mode === 'edit' 
        ? `${t('press_log.form.edit_title')}` 
        : t('press_log.form.add_title');

    // Cargar Agenda y Media Stakeholders
    useEffect(() => {
        if (!db) return;
        // Cargar Agenda
        const agendaRef = ref(db, getDbPaths().agenda);
        const unsubAgenda = onValue(agendaRef, (snapshot) => {
            const data = snapshotToArray(snapshot);
            const options = data.map(item => ({ value: item.id, label: item.nombre }));
            setAgendaOptions([...options, { value: 'other', label: t('press_log.form.other_item') }]);
        });

        // Cargar Media Stakeholders
        const stakeholdersRef = ref(db, getDbPaths().mediaStakeholders);
        const unsubStakeholders = onValue(stakeholdersRef, (snapshot) => {
            const data = snapshotToArray(snapshot);
            const options = data.map(item => ({ value: item.id, label: item.name }));
            setStakeholderOptions(options);
        });

        return () => {
            unsubAgenda();
            unsubStakeholders();
        };
    }, [db, t]);

    const showOtherAgendaField = useMemo(() => {
        return (formData.agendaItems || []).includes('other');
    }, [formData.agendaItems]);

    // --- Handlers Generales ---
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev, 
            [name]: type === 'number' ? parseFloat(value) || '' : value
        }));
    };

    // --- Handlers Específicos ---
    const handleAgendaToggle = (itemId) => {
        setFormData(prev => {
            const currentItems = prev.agendaItems || [];
            const isSelected = currentItems.includes(itemId);
            const newItems = isSelected 
                ? currentItems.filter(name => name !== itemId) 
                : [...currentItems, itemId]; 
            return { ...prev, agendaItems: newItems };
        });
    };
    
    const handleStakeholderToggle = (stakeholderId) => {
        setFormData(prev => {
            const currentKeys = prev.mediaStakeholderKeys || [];
            const isSelected = currentKeys.includes(stakeholderId);
            const newKeys = isSelected 
                ? currentKeys.filter(id => id !== stakeholderId) 
                : [...currentKeys, stakeholderId]; 
            return { ...prev, mediaStakeholderKeys: newKeys };
        });
    };
    
    const addMediaEntry = (entry) => {
        setFormData(prev => ({
            ...prev,
            mediaEntries: [...(prev.mediaEntries || []), entry]
        }));
    };
    const removeMediaEntry = (index) => {
        setFormData(prev => ({
            ...prev,
            mediaEntries: (prev.mediaEntries || []).filter((_, i) => i !== index)
        }));
    };

    // --- Submit ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isReady) return; 

        setIsLoading(true);
        setMessage('');
        setMessageType('success');

        try {
            const path = getDbPaths().pressLog;
            
            // Limpiar "other" si no está seleccionado
            const cleanData = { ...formData };
            if (!showOtherAgendaField) {
                cleanData.otherAgendaItem = '';
            }
            
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
            console.error(`Error ${mode} press log document: `, error);
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
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                
                <InputField 
                    label={t('press_log.form.date')} 
                    name="date" 
                    type="date" 
                    value={String(formData.date ?? '')} 
                    onChange={handleChange} 
                />

                <MultiSearchSelect
                    labelKey="press_log.form.agenda_items"
                    placeholderKey="press_log.form.search_agenda"
                    selectedItems={formData.agendaItems || []}
                    allOptions={agendaOptions}
                    onToggleItem={handleAgendaToggle}
                    t={t}
                />

                {showOtherAgendaField && (
                    <InputField 
                        label={t('press_log.form.other_item')} 
                        name="otherAgendaItem" 
                        value={String(formData.otherAgendaItem ?? '')} 
                        onChange={handleChange} 
                        placeholder={t('press_log.form.other_placeholder')}
                    />
                )}
                
                <MediaEntry
                    t={t}
                    entries={formData.mediaEntries || []}
                    onAdd={addMediaEntry}
                    onRemove={removeMediaEntry}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField 
                        label={t('press_log.form.impact')} 
                        name="impact" 
                        options={IMPACT_OPTIONS.map(opt => ({ value: opt, label: t(`press_log.impact_opts.${opt.toLowerCase()}`) }))} 
                        value={formData.impact} 
                        onChange={handleChange} 
                    />
                    <SelectField 
                        label={t('press_log.form.reach')} 
                        name="reach" 
                        options={PRESS_LOG_REACH_OPTIONS.map(opt => ({ value: opt, label: t(`press_log.reach_opts.${opt.toLowerCase()}`) }))} 
                        value={formData.reach} 
                        onChange={handleChange} 
                    />
                </div>
                
                <MultiSearchSelect
                    labelKey="press_log.form.stakeholders"
                    placeholderKey="stakeholder.search_placeholder"
                    selectedItems={formData.mediaStakeholderKeys || []}
                    allOptions={stakeholderOptions}
                    onToggleItem={handleStakeholderToggle}
                    t={t}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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