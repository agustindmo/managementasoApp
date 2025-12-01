import React, { useState, useEffect, useMemo } from 'react';
import { ref, set, push, serverTimestamp, onValue } from 'firebase/database';
import { Megaphone, X, Loader2, Search } from 'lucide-react';
import CardTitle from '../ui/CardTitle.jsx';
import InputField from '../ui/InputField.jsx';
import SelectField from '../ui/SelectField.jsx';
import { 
    INITIAL_PRESS_LOG_STATE,
    PRESS_LOG_FORMAT_OPTIONS, // Corrected Import
    PRESS_LOG_ACTION_OPTIONS,
    PRESS_LOG_REACH_OPTIONS,
    IMPACT_OPTIONS
} from '../../utils/constants.js'; 
import { getDbPaths } from '../../services/firebase.js'; 
import { useTranslation } from '../../context/TranslationContext.jsx';

const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({ id: key, ...val[key] }));
};

// Helper: Multi-select for Agenda Items
const MultiSearchSelect = ({ labelKey, placeholderKey, selectedItems = [], allOptions, onToggleItem, t }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return [];
        return allOptions.filter(
            opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
                   !selectedItems.includes(opt.value)
        );
    }, [searchTerm, allOptions, selectedItems]);

    const selectedOptionsData = useMemo(() => {
        return selectedItems.map(key => 
            allOptions.find(m => m.value === key) || { value: key, label: "Unknown Item" }
        );
    }, [selectedItems, allOptions]);

    return (
        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
            <label className="block text-sm font-medium text-slate-700">{t(labelKey)}</label>
            
            <InputField 
                label=""
                name="search_item"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                required={false}
                placeholder={t(placeholderKey)}
                icon={Search}
            />

            {filteredOptions.length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-1 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                    {filteredOptions.slice(0, 10).map(opt => (
                        <div 
                            key={opt.value}
                            className="p-2 text-sm text-slate-700 rounded hover:bg-blue-50 cursor-pointer transition-colors"
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

            <div className="flex flex-wrap gap-2 pt-2 min-h-[24px]">
                {selectedOptionsData.map((opt) => (
                    <span key={opt.value} className="flex items-center bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full border border-blue-200">
                        <span className="truncate max-w-[150px]">{opt.label}</span>
                        <button
                            type="button"
                            onClick={() => onToggleItem(opt.value)}
                            className="ml-1.5 text-blue-600 hover:text-blue-800"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
            </div>
        </div>
    );
};

const PressLogForm = ({ userId, db, mode = 'add', initialData = null, onClose }) => { 
    const { t } = useTranslation();
    
    const [formData, setFormData] = useState(() => {
        // Ensure arrays are initialized
        const base = initialData || INITIAL_PRESS_LOG_STATE;
        return {
            ...base,
            agendaItems: base.agendaItems || [],
            mediaEntries: base.mediaEntries || []
        };
    });

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');
    const [agendaItemOptions, setAgendaItemOptions] = useState([]);

    const isReady = !!db && !!userId;
    const dbPathKey = 'pressLog';
    const formTitle = mode === 'edit' ? t('press_log.form.edit_title') : t('press_log.form.add_title');

    // Load Agenda Items for the multi-select
    useEffect(() => {
        if (!db) return;
        const agendaRef = ref(db, getDbPaths().agenda);
        const unsub = onValue(agendaRef, (snapshot) => {
            const items = snapshotToArray(snapshot);
            setAgendaItemOptions(items.map(item => ({ value: item.id, label: item.nombre || 'Untitled' })));
        });
        return () => unsub();
    }, [db]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => {
                const current = prev.mediaEntries || [];
                const updated = checked ? [...current, name] : current.filter(item => item !== name);
                return { ...prev, mediaEntries: updated };
            });
        } else {
            setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || '' : value }));
        }
    };

    const handleToggleAgendaItem = (itemId) => {
        setFormData(prev => {
            const current = prev.agendaItems || [];
            const updated = current.includes(itemId) ? current.filter(id => id !== itemId) : [...current, itemId];
            return { ...prev, agendaItems: updated };
        });
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
                await set(ref(db, `${path}/${initialData.id}`), {
                    ...formData,
                    updatedAt: serverTimestamp(),
                    updatedBy: userId,
                    createdAt: initialData.createdAt, 
                    createdBy: initialData.createdBy,
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
            console.error(`Error ${mode} Press Log: `, error);
            setMessage(t('activity.form.fail'));
            setMessageType('error');
            setIsLoading(false);
        }
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden max-w-4xl mx-auto">
            <div className="flex justify-between items-center pr-4">
                <CardTitle title={formTitle} icon={Megaphone} />
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition" title="Close">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField 
                        label={t('press_log.col.date')} 
                        name="date" 
                        type="date" 
                        value={String(formData.date ?? '')} 
                        onChange={handleChange} 
                    />
                    <SelectField 
                        label={t('press_log.col.action')} 
                        name="action" 
                        options={PRESS_LOG_ACTION_OPTIONS.map(opt => ({ value: opt, label: t(`press_log.action_opts.${opt.toLowerCase().replace(/ /g, '_')}`) }))}
                        value={formData.action} 
                        onChange={handleChange} 
                    />
                </div>

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

                {/* Media Formats Checkboxes */}
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
                    <label className="block text-sm font-medium text-slate-700">{t('press_log.form.format')}</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {PRESS_LOG_FORMAT_OPTIONS.map(format => (
                            <label key={format} className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 cursor-pointer">
                                <input 
                                    type="checkbox"
                                    name={format}
                                    checked={(formData.mediaEntries || []).includes(format)}
                                    onChange={handleChange}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>{t(`press_log.format_opts.${format.toLowerCase()}`) || format}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    label={t('press_log.col.link')} 
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
                    <p className={`text-center text-sm mt-3 ${messageType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {message}
                    </p>
                )}
            </form>
        </div>
    );
};

export default PressLogForm;