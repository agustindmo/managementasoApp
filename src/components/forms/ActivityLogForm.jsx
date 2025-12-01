import React, { useState, useEffect, useMemo } from 'react';
import { ref, set, push, serverTimestamp, onValue } from 'firebase/database';
import { Clock, X, Plus, Trash2, Search } from 'lucide-react'; 
import CardTitle from '../ui/CardTitle.jsx';
import InputField from '../ui/InputField.jsx';
import SelectField from '../ui/SelectField.jsx';
import { 
    INITIAL_ACTIVITY_STATE, 
    ACTIVITY_TYPE_OPTIONS, 
    MEETING_MODE_OPTIONS
} from '../../utils/constants.js'; 
import { getDbPaths } from '../../services/firebase.js'; 
import { useTranslation } from '../../context/TranslationContext.jsx'; 

const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({
        id: key,
        ...val[key],
    }));
};

const MultiSelectSearch = ({ labelKey, selectedItems, allOptions, onAddItem, onRemoveItem, t }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return [];
        return allOptions.filter(
            opt => opt.toLowerCase().includes(searchTerm.toLowerCase()) &&
                   !selectedItems.includes(opt)
        );
    }, [searchTerm, allOptions, selectedItems]);

    return (
        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
            <label className="block text-sm font-medium text-gray-700">{t(labelKey)}</label>
            
            <InputField 
                label=""
                name={`search_${labelKey}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                required={false}
                placeholder={t('policy.search')}
                icon={Search}
            />

            {filteredOptions.length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-1 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                    {filteredOptions.slice(0, 10).map(option => (
                        <div 
                            key={option}
                            className="p-2 text-sm text-slate-700 rounded hover:bg-blue-50 cursor-pointer transition-colors"
                            onClick={() => {
                                onAddItem(option);
                                setSearchTerm('');
                            }}
                        >
                            {option}
                        </div>
                    ))}
                </div>
            )}

            <div className="flex flex-wrap gap-2 min-h-[20px] pt-2">
                {selectedItems.map((item, index) => (
                    <span key={index} className="flex items-center bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                        {item}
                        <button
                            type="button"
                            onClick={() => onRemoveItem(item)}
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


const ActivityLogForm = ({ userId, db, mode = 'add', initialData = null, onClose }) => {
    const { t } = useTranslation(); 
    const [formData, setFormData] = useState(initialData || INITIAL_ACTIVITY_STATE);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success'); 
    const [agendaData, setAgendaData] = useState([]); 

    const isReady = !!db && !!userId;
    const isMeeting = formData.activityType === 'meeting';
    const formTitle = mode === 'edit' 
        ? `${t('activity.form.edit_title')}: ${initialData?.id.substring(0, 8)}...` 
        : t('activity.form.add_title');

    useEffect(() => {
        if (!db) return;
        const agendaRef = ref(db, getDbPaths().agenda);
        const unsubscribe = onValue(agendaRef, (snapshot) => {
            try {
                setAgendaData(snapshotToArray(snapshot));
            } catch (e) { console.error("Error processing Agenda snapshot:", e); }
        }, (error) => { console.error("Agenda Subscription Error:", error); });
        return () => unsubscribe();
    }, [db]);
    
    const institutionOptions = useMemo(() => {
        const uniqueInstitutions = [...new Set(agendaData.map(item => item.institucion).filter(Boolean))].sort();
        return ['N/A', ...uniqueInstitutions];
    }, [agendaData]);
    
    const temaOptions = useMemo(() => {
        const uniqueTemas = [...new Set(agendaData.map(item => item.nombre).filter(Boolean))].sort();
        return ['N/A', ...uniqueTemas];
    }, [agendaData]);


    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev, 
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const addInstitution = (institution) => {
        setFormData(prev => ({
            ...prev,
            institution: [...(prev.institution || []), institution]
        }));
    };
    const removeInstitution = (institutionToRemove) => {
        setFormData(prev => ({
            ...prev,
            institution: (prev.institution || []).filter(item => item !== institutionToRemove)
        }));
    };

    const addTema = (tema) => {
        setFormData(prev => ({
            ...prev,
            tema: [...(prev.tema || []), tema]
        }));
    };
    const removeTema = (temaToRemove) => {
        setFormData(prev => ({
            ...prev,
            tema: (prev.tema || []).filter(item => item !== temaToRemove)
        }));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isReady) return; 

        setIsLoading(true);
        setMessage('');
        setMessageType('success');

        const submissionData = { ...formData };
        if (!isMeeting) {
            delete submissionData.meetingMode;
            delete submissionData.timeSpent;
            delete submissionData.participants;
        }

        try {
            const path = getDbPaths().activities;
            if (mode === 'edit' && initialData?.id) {
                const itemRef = ref(db, `${path}/${initialData.id}`);
                await set(itemRef, {
                    ...submissionData,
                    updatedAt: serverTimestamp(),
                });
                setMessage(t('activity.form.success_update')); 
            } else {
                const newItemRef = push(ref(db, path));
                await set(newItemRef, {
                    ...submissionData,
                    id: newItemRef.key,
                    createdAt: serverTimestamp(),
                    createdBy: userId,
                });
                setMessage(t('activity.form.success_add')); 
            }
            setTimeout(onClose, 1000); 
        } catch (error) {
            console.error(`Error ${mode} Activity document: `, error);
            setMessage(t('activity.form.fail')); 
            setMessageType('error');
            setIsLoading(false);
        }
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden max-w-4xl mx-auto">
            <div className="flex justify-between items-center pr-4">
                <CardTitle title={formTitle} icon={Clock} />
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition" title="Close">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                
                <SelectField 
                    label={t('activity.form.type')} 
                    name="activityType" 
                    options={ACTIVITY_TYPE_OPTIONS} 
                    value={formData.activityType} 
                    onChange={handleChange} 
                />

                {isMeeting && (
                    <div className="grid grid-cols-2 gap-4 border border-slate-200 p-4 rounded-lg bg-slate-50">
                        <SelectField 
                            label={t('activity.form.mode')} 
                            name="meetingMode" 
                            options={MEETING_MODE_OPTIONS} 
                            value={formData.meetingMode} 
                            onChange={handleChange} 
                        />
                         <InputField 
                            label={t('activity.form.time')} 
                            name="timeSpent" 
                            type="number" 
                            value={String(formData.timeSpent ?? 0)} 
                            onChange={handleChange} 
                            required={false}
                        />
                        <InputField 
                            label={t('activity.form.participants')} 
                            name="participants" 
                            value={String(formData.participants ?? '')} 
                            onChange={handleChange} 
                            rows={2}
                        />
                    </div>
                )}
                
                <InputField 
                    label={t('activity.form.date')} 
                    name="date" 
                    type="date" 
                    value={String(formData.date ?? '')} 
                    onChange={handleChange} 
                />
                
                <MultiSelectSearch
                    labelKey="activity.form.institution"
                    selectedItems={formData.institution || []}
                    allOptions={institutionOptions}
                    onAddItem={addInstitution}
                    onRemoveItem={removeInstitution}
                    t={t}
                />
                
                <MultiSelectSearch
                    labelKey="activity.form.tema"
                    selectedItems={formData.tema || []}
                    allOptions={temaOptions}
                    onAddItem={addTema}
                    onRemoveItem={removeTema}
                    t={t}
                />

                <InputField 
                    label={t('activity.form.link')} 
                    name="documentLink" 
                    type="url" 
                    value={String(formData.documentLink ?? '')} 
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

export default ActivityLogForm;