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

    const selectedOptions = useMemo(() => {
        return selectedItems.map(key => 
            allOptions.find(m => m.value === key) || { value: key, label: "Invalid Item" }
        );
    }, [selectedItems, allOptions]);

    return (
        <div className="p-4 rounded-lg border border-sky-800/50 bg-sky-950/30 space-y-3">
            <label className="block text-sm font-medium text-gray-200">{t(labelKey)}</label>
            
            <InputField 
                label=""
                name="search_member"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                required={false}
                placeholder={t(placeholderKey)}
                icon={Search}
            />

            {filteredOptions.length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-1 rounded-lg border border-sky-700 bg-black/40 p-2">
                    {filteredOptions.slice(0, 10).map(opt => (
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

            {/* Selected Items */}
            <div className="flex flex-wrap gap-2 pt-2">
                {selectedOptions.map((opt) => (
                    <span key={opt.value} className="flex items-center bg-sky-700 text-white text-sm font-medium px-2.5 py-0.5 rounded-full">
                        {opt.label}
                        <button
                            type="button"
                            onClick={() => onToggleItem(opt.value)}
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
    
    // --- TASK: Removed mediaStakeholderKeys from initial state setup ---
    const [formData, setFormData] = useState(() => {
        const state = initialData ? { ...initialData } : { ...INITIAL_PRESS_LOG_STATE };
        state.agendaItems = state.agendaItems || [];
        state.mediaEntries = state.mediaEntries || [];
        // state.mediaStakeholderKeys = state.mediaStakeholderKeys || []; // Removed
        return state;
    });

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');
    
    // State for Agenda Item options
    const [agendaItemOptions, setAgendaItemOptions] = useState([]);
    
    // --- TASK: Removed mediaStakeholderOptions state ---

    const isReady = !!db && !!userId;
    const dbPathKey = 'pressLog';
    
    const formTitle = mode === 'edit' 
        ? t('press_log.form.edit_title')
        : t('press_log.form.add_title');

    // --- Effect to load Agenda Items ---
    useEffect(() => {
        if (!db) return;
        const agendaRef = ref(db, getDbPaths().agenda);
        
        const unsubAgenda = onValue(agendaRef, (snapshot) => {
            const items = snapshotToArray(snapshot);
            setAgendaItemOptions(
                items.map(item => ({
                    value: item.id,
                    label: item.nombre || 'Untitled'
                }))
            );
        });
        
        return () => unsubAgenda();
    }, [db]);

    // --- TASK: Removed useEffect that fetched mediaStakeholders ---

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (type === 'checkbox') {
            // Handle Format checkboxes (mediaEntries)
            setFormData(prev => {
                const currentEntries = prev.mediaEntries || [];
                const newEntries = checked
                    ? [...currentEntries, name]
                    : currentEntries.filter(entry => entry !== name);
                return { ...prev, mediaEntries: newEntries };
            });
        } else {
            setFormData(prev => ({
                ...prev, 
                [name]: value
            }));
        }
    };

    // --- Handler for Agenda Multi-select ---
    const handleToggleAgendaItem = (itemId) => {
        setFormData(prev => {
            const currentItems = prev.agendaItems || [];
            const isSelected = currentItems.includes(itemId);
            const newItems = isSelected 
                ? currentItems.filter(id => id !== itemId) 
                : [...currentItems, itemId]; 
            return { ...prev, agendaItems: newItems };
        });
    };
    
    // --- TASK: Removed handleToggleStakeholder ---

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isReady) return; 

        setIsLoading(true);
        setMessage('');
        setMessageType('success');
        
        // --- TASK: Removed mediaStakeholderKeys from data payload ---
        const dataToSave = {
            date: formData.date,
            agendaItems: formData.agendaItems || [],
            otherAgendaItem: formData.otherAgendaItem || '',
            mediaEntries: formData.mediaEntries || [],
            impact: formData.impact,
            reach: formData.reach,
            audience: formData.audience || '',
            freePress: formData.freePress || '',
            link: formData.link || '',
            // mediaStakeholderKeys: formData.mediaStakeholderKeys || [], // Removed
        };

        try {
            const path = getDbPaths()[dbPathKey];
            
            if (mode === 'edit' && initialData?.id) {
                const itemRef = ref(db, `${path}/${initialData.id}`);
                await set(itemRef, {
                    ...dataToSave,
                    id: initialData.id, // Ensure ID is preserved
                    updatedAt: serverTimestamp(),
                    updatedBy: userId,
                    createdAt: initialData.createdAt, // Preserve original create date
                    createdBy: initialData.createdBy, // Preserve original creator
                });
                setMessage(t('press_log.form.success_update'));
            } else {
                const newItemRef = push(ref(db, path));
                await set(newItemRef, {
                    ...dataToSave,
                    id: newItemRef.key,
                    createdAt: serverTimestamp(),
                    createdBy: userId,
                });
                setMessage(t('press_log.form.success_add'));
            }

            setTimeout(onClose, 1000); 
        } catch (error) {
            console.error(`Error ${mode} press log: `, error);
            setMessage(t('activity.form.fail'));
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
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                
                <InputField 
                    label={t('press_log.form.date')} 
                    name="date" 
                    type="date"
                    value={String(formData.date ?? '')} 
                    onChange={handleChange} 
                />

                <MultiSearchSelect
                    labelKey="press_log.col.agenda_items"
                    placeholderKey="policy.search"
                    selectedItems={formData.agendaItems}
                    allOptions={agendaItemOptions}
                    onToggleItem={handleToggleAgendaItem}
                    t={t}
                />
                
                <InputField 
                    label={t('press_log.form.other_agenda')} 
                    name="otherAgendaItem" 
                    value={String(formData.otherAgendaItem ?? '')} 
                    onChange={handleChange} 
                    required={false}
                    placeholder={t('press_log.form.other_agenda_placeholder')}
                />
                
                {/* --- TASK: Removed Stakeholder MultiSearchSelect --- */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <SelectField 
                        label={t('press_log.col.impact')} 
                        name="impact" 
                        options={IMPACT_OPTIONS} 
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
                
                 <div className="p-4 rounded-lg border border-sky-800/50 bg-sky-950/30 space-y-3">
                    <label className="block text-sm font-medium text-gray-200">{t('press_log.form.format')}</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {PRESS_LOG_FORMAT_OPTIONS.map(format => (
                            <label key={format} className="flex items-center space-x-2 text-gray-300">
                                <input 
                                    type="checkbox"
                                    name={format} // The value itself
                                    checked={(formData.mediaEntries || []).includes(format)}
                                    onChange={handleChange}
                                    className="rounded border-gray-600 bg-gray-700 text-sky-500 focus:ring-sky-600"
                                />
                                <span>{t(`press_log.format_opts.${format.toLowerCase()}`)}</span>
                            </label>
                        ))}
                    </div>
                </div>

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