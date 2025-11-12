// src/components/forms/EventForm.jsx

import React, { useState } from 'react';
import { ref, set, push, serverTimestamp } from 'firebase/database';
import { Calendar, X, Loader2, Plus, Trash2 } from 'lucide-react';
import CardTitle from '../ui/CardTitle.jsx';
import InputField from '../ui/InputField.jsx';
import SelectField from '../ui/SelectField.jsx';
import { 
    INITIAL_EVENT_STATE,
    EVENT_TYPE_OPTIONS,
    EVENT_PARTICIPANT_ROLES,
    EVENT_VISIBILITY_OPTIONS
} from '../../utils/constants.js'; 
import { getDbPaths } from '../../services/firebase.js'; 
import { useTranslation } from '../../context/TranslationContext.jsx';

// ... (TagInput y ParticipantInput helpers sin cambios) ...
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
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-200">{t(labelKey)}</label>
            <div className="flex space-x-2">
                <InputField 
                    label=""
                    name="tagValue"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    required={false}
                    placeholder={t('event.form.topic_placeholder')}
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
const ParticipantInput = ({ labelKey, items, onAddItem, onRemoveItem, t }) => {
    const [name, setName] = useState('');
    const [role, setRole] = useState(EVENT_PARTICIPANT_ROLES[0]);
    const handleAdd = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onAddItem({ id: Date.now(), name: name.trim(), role: role });
            setName('');
            setRole(EVENT_PARTICIPANT_ROLES[0]);
        }
    };
    return (
        <div className="p-4 rounded-lg border border-sky-800/50 bg-sky-950/30 space-y-3">
            <label className="block text-sm font-medium text-gray-200">{t(labelKey)}</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <InputField 
                    label={t('event.form.participant_name')}
                    name="participantName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={false}
                />
                <SelectField
                    label={t('event.form.participant_role')}
                    name="participantRole"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    options={EVENT_PARTICIPANT_ROLES}
                />
                <button
                    type="button"
                    onClick={handleAdd}
                    className="flex-shrink-0 flex justify-center items-center py-2 px-3 border border-transparent text-sm font-medium rounded-lg text-white bg-sky-600 hover:bg-sky-700 transition duration-300 shadow-md h-10"
                >
                    <Plus className="w-4 h-4 mr-1" /> {t('event.form.add_participant')}
                </button>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1 pt-2">
                {items.map((p) => (
                    <li key={p.id} className="flex justify-between items-start bg-sky-950/50 p-2 rounded-md hover:bg-sky-900/60">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-white">{p.name} <span className="text-xs text-sky-300">({p.role})</span></p>
                        </div>
                        <button
                            type="button"
                            onClick={() => onRemoveItem(p.id)}
                            className="text-red-400 hover:text-red-300 p-1 ml-2"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </li>
                ))}
            </div>
        </div>
    );
};
// ... (fin de helpers) ...


// --- Componente Principal del Formulario ---
const EventForm = ({ userId, db, mode = 'add', initialData = null, onClose, role }) => {
    const { t } = useTranslation();
    const isAdmin = role === 'admin';
    
    const [formData, setFormData] = useState(initialData || INITIAL_EVENT_STATE);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    const isReady = !!db && !!userId;
    const dbPathKey = 'events';
    
    const formTitle = mode === 'edit' 
        ? t('event.form.edit_title')
        : t('event.form.add_title');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev, 
            [name]: value
        }));
    };

    // --- Handlers para Tópicos ---
    const addTopic = (topic) => {
        setFormData(prev => ({ ...prev, topics: [...(prev.topics || []), topic] }));
    };
    const removeTopic = (index) => {
        setFormData(prev => ({ ...prev, topics: (prev.topics || []).filter((_, i) => i !== index) }));
    };

    // --- Handlers para Participantes ---
    const addParticipant = (participant) => {
        setFormData(prev => ({ ...prev, participants: [...(prev.participants || []), participant] }));
    };
    const removeParticipant = (id) => {
        setFormData(prev => ({ ...prev, participants: (prev.participants || []).filter(p => p.id !== id) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isReady || !isAdmin) return; 

        setIsLoading(true);
        setMessage('');
        setMessageType('success');

        try {
            const path = getDbPaths()[dbPathKey];
            
            const cleanData = {
                ...formData,
                participants: (formData.participants || []).map(({ id, ...rest }) => rest),
            };
            
            if (mode === 'edit' && initialData?.id) {
                const itemRef = ref(db, `${path}/${initialData.id}`);
                await set(itemRef, {
                    ...cleanData,
                    updatedAt: serverTimestamp(),
                    updatedBy: userId,
                });
                setMessage(t('activity.form.success_update'));
            } else {
                const newItemRef = push(ref(db, path));
                await set(newItemRef, {
                    ...cleanData,
                    id: newItemRef.key,
                    createdAt: serverTimestamp(),
                    createdBy: userId,
                });
                setMessage(t('activity.form.success_add'));
            }

            setTimeout(onClose, 1000); 
        } catch (error) {
            console.error(`Error ${mode} event document: `, error);
            setMessage(t('activity.form.fail'));
            setMessageType('error');
            setIsLoading(false);
        }
    };

    return (
        <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <CardTitle title={formTitle} icon={Calendar} />
                <button onClick={onClose} className="p-3 text-gray-400 hover:text-white transition" title="Close Form">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                
                <InputField 
                    label={t('event.form.name')} 
                    name="name" 
                    value={String(formData.name ?? '')} 
                    onChange={handleChange} 
                    disabled={!isAdmin}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField 
                        label={t('event.form.event_type')} 
                        name="eventType" 
                        options={EVENT_TYPE_OPTIONS} 
                        value={formData.eventType} 
                        onChange={handleChange} 
                        disabled={!isAdmin}
                    />
                    <SelectField 
                        label={t('event.form.visibility')} 
                        name="visibility" 
                        options={Object.keys(EVENT_VISIBILITY_OPTIONS).map(key => ({ value: key, label: t(`event.visibility.${key}`) }))} 
                        value={formData.visibility} 
                        onChange={handleChange} 
                        disabled={!isAdmin}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                        label={t('event.form.start_date')} 
                        name="startDate" 
                        type="date" 
                        value={String(formData.startDate ?? '')} 
                        onChange={handleChange} 
                        disabled={!isAdmin}
                    />
                    <InputField 
                        label={t('event.form.end_date')} 
                        name="endDate" 
                        type="date" 
                        value={String(formData.endDate ?? '')} 
                        onChange={handleChange} 
                        disabled={!isAdmin}
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                        label={t('event.form.start_time')} 
                        name="startTime" 
                        type="time" 
                        value={String(formData.startTime ?? '')} 
                        onChange={handleChange} 
                        disabled={!isAdmin}
                    />
                    <InputField 
                        label={t('event.form.end_time')} 
                        name="endTime" 
                        type="time" 
                        value={String(formData.endTime ?? '')} 
                        onChange={handleChange} 
                        disabled={!isAdmin}
                    />
                </div>
                
                {/* --- UPDATED FIELD BLOCK --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* call_link is kept and is optional (no required prop) */}
                    <InputField 
                        label={t('governance.meeting.col.call_link')} 
                        name="call_link" 
                        type="url" 
                        value={String(formData.call_link ?? '')} 
                        onChange={handleChange} 
                        disabled={!isAdmin}
                        // Removed required={true} if it existed; it's optional now.
                    />
                    {/* minute_link InputField is REMOVED */}
                </div>
                
                <TagInput
                    labelKey="event.form.topics"
                    items={formData.topics || []}
                    onAddItem={addTopic}
                    onRemoveItem={removeTopic}
                    t={t}
                />
                
                <ParticipantInput
                    labelKey="event.form.participants"
                    items={formData.participants || []}
                    onAddItem={addParticipant}
                    onRemoveItem={removeParticipant}
                    t={t}
                />

                {isAdmin && (
                    <button
                        type="submit"
                        disabled={isLoading || !isReady}
                        className={`w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition duration-300 ease-in-out ${
                            isLoading || !isReady ? 'bg-sky-400 cursor-not-allowed opacity-70' : 'bg-sky-600 hover:bg-sky-700'
                        }`}
                    >
                        {isLoading ? t('activity.form.saving') : !isReady ? t('activity.form.connecting') : (mode === 'edit' ? t('activity.form.update') : t('activity.form.add'))}
                    </button>
                )}
                {message && (
                    <p className={`text-center text-sm mt-2 ${messageType === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {message}
                    </p>
                )}
            </form>
        </div>
    );
};

export default EventForm;