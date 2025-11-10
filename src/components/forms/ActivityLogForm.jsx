// src/components/forms/ActivityLogForm.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ref, set, push, serverTimestamp, onValue } from 'firebase/database';
import { Clock, X } from 'lucide-react';
import CardTitle from '../ui/CardTitle.jsx';
import InputField from '../ui/InputField.jsx';
import SelectField from '../ui/SelectField.jsx';
import { 
    INITIAL_ACTIVITY_STATE, 
    ACTIVITY_TYPE_OPTIONS, 
    MEETING_MODE_OPTIONS
} from '../../utils/constants.js'; 
import { getDbPaths } from '../../services/firebase.js'; 
import { useTranslation } from '../../context/TranslationContext.jsx'; // Tarea 2

const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({
        id: key,
        ...val[key],
    }));
};

const ActivityLogForm = ({ userId, db, mode = 'add', initialData = null, onClose }) => {
    const { t } = useTranslation(); // Tarea 2
    const [formData, setFormData] = useState(initialData || INITIAL_ACTIVITY_STATE);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success'); // 'success' or 'error'
    const [agendaData, setAgendaData] = useState([]); 

    const isReady = !!db && !!userId;
    const isMeeting = formData.activityType === 'meeting';
    // Tarea 2: Títulos traducidos
    const formTitle = mode === 'edit' 
        ? `${t('activity.form.edit_title')}: ${initialData?.id.substring(0, 8)}...` 
        : t('activity.form.add_title');

    // Fetch Agenda data for dynamic options
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
    
    // Derived options from fetched agenda data
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
                setMessage(t('activity.form.success_update')); // Tarea 2
            } else {
                const newItemRef = push(ref(db, path));
                await set(newItemRef, {
                    ...submissionData,
                    id: newItemRef.key,
                    createdAt: serverTimestamp(),
                    createdBy: userId,
                });
                setMessage(t('activity.form.success_add')); // Tarea 2
            }

            setTimeout(onClose, 1000); 
        } catch (error) {
            console.error(`Error ${mode} Activity document in Realtime DB: `, error);
            setMessage(t('activity.form.fail')); // Tarea 2
            setMessageType('error');
            setIsLoading(false);
        }
    };

    // Tarea 1: Contenedor oscuro
    return (
        <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <CardTitle title={formTitle} icon={Clock} />
                <button onClick={onClose} className="p-3 text-gray-400 hover:text-white transition" title="Close Form">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                
                {/* Tarea 2: Etiquetas traducidas */}
                <SelectField 
                    label={t('activity.form.type')} 
                    name="activityType" 
                    options={ACTIVITY_TYPE_OPTIONS} 
                    value={formData.activityType} 
                    onChange={handleChange} 
                />

                {isMeeting && (
                    // Tarea 1: Estilo de sección oscuro
                    <div className="grid grid-cols-2 gap-4 border border-sky-800/50 p-4 rounded-lg bg-sky-950/30">
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
                
                <div className="grid grid-cols-2 gap-4">
                    <InputField 
                        label={t('activity.form.date')} 
                        name="date" 
                        type="date" 
                        value={String(formData.date ?? '')} 
                        onChange={handleChange} 
                    />
                    <SelectField 
                        label={t('activity.form.institution')} 
                        name="institution" 
                        options={institutionOptions} 
                        value={formData.institution} 
                        onChange={handleChange} 
                    />
                </div>
                
                <SelectField 
                    label={t('activity.form.tema')} 
                    name="tema" 
                    options={temaOptions} 
                    value={formData.tema} 
                    onChange={handleChange} 
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
                    // Tarea 1: Botón con paleta sky
                    className={`w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition duration-300 ease-in-out ${
                        isLoading || !isReady ? 'bg-sky-400 cursor-not-allowed opacity-70' : 'bg-sky-600 hover:bg-sky-700'
                    }`}
                >
                    {/* Tarea 2: Texto de botón traducido */}
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

export default ActivityLogForm;