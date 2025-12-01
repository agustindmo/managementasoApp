import React, { useState } from 'react';
import { ref, set, push, serverTimestamp } from 'firebase/database';
import { MessageCircle, X } from 'lucide-react';
import CardTitle from '../ui/CardTitle.jsx';
import InputField from '../ui/InputField.jsx';
import SelectField from '../ui/SelectField.jsx';
import { 
    INITIAL_COMMS_LOG_STATE,
    COMMS_LOG_ACTIVITY_OPTIONS,
    COMMS_LOG_FORMAT_OPTIONS,
    COMMS_LOG_REACH_OPTIONS,
} from '../../utils/constants.js'; 
import { getDbPaths } from '../../services/firebase.js'; 
import { useTranslation } from '../../context/TranslationContext.jsx';

const CheckboxField = ({ label, name, checked, onChange, t }) => (
    <label className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 cursor-pointer">
        <input 
            type="checkbox"
            name={name}
            className="rounded text-blue-600 focus:ring-blue-500 border-gray-300"
            checked={checked}
            onChange={onChange}
        />
        <span>{t(label)}</span>
    </label>
);

const CommunicationsLogForm = ({ userId, db, mode = 'add', initialData = null, onClose }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState(initialData || INITIAL_COMMS_LOG_STATE);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    const isReady = !!db && !!userId;
    const formTitle = mode === 'edit' 
        ? `${t('comms_log.form.edit_title')}` 
        : t('comms_log.form.add_title');

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev, 
            [name]: type === 'number' ? parseFloat(value) || '' : value
        }));
    };

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isReady) return; 

        setIsLoading(true);
        setMessage('');
        setMessageType('success');

        try {
            const path = getDbPaths().communicationsLog;
            if (mode === 'edit' && initialData?.id) {
                const itemRef = ref(db, `${path}/${initialData.id}`);
                await set(itemRef, { ...formData, updatedAt: serverTimestamp(), updatedBy: userId });
                setMessage(t('comms_log.form.success_update'));
            } else {
                const newItemRef = push(ref(db, path));
                await set(newItemRef, { ...formData, id: newItemRef.key, createdAt: serverTimestamp(), createdBy: userId });
                setMessage(t('comms_log.form.success_add'));
            }
            setTimeout(onClose, 1000); 
        } catch (error) {
            console.error(`Error ${mode} comms log document: `, error);
            setMessage(t('comms_log.form.fail'));
            setMessageType('error');
            setIsLoading(false);
        }
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden max-w-4xl mx-auto">
            <div className="flex justify-between items-center pr-4">
                <CardTitle title={formTitle} icon={MessageCircle} />
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition" title="Close">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SelectField 
                        label={t('comms_log.form.activity')} 
                        name="activity" 
                        options={COMMS_LOG_ACTIVITY_OPTIONS.map(opt => ({ value: opt, label: t(`comms_log.activity_opts.${opt.toLowerCase().replace(/ /g, '_')}`) }))} 
                        value={formData.activity} 
                        onChange={handleChange} 
                    />
                    <InputField 
                        label={t('comms_log.form.date')} 
                        name="date" 
                        type="date" 
                        value={String(formData.date ?? '')} 
                        onChange={handleChange} 
                    />
                </div>

                <InputField 
                    label={t('comms_log.form.media')} 
                    name="mediaName" 
                    value={String(formData.mediaName ?? '')} 
                    onChange={handleChange} 
                    placeholder={t('comms_log.form.media_placeholder')}
                    required={false}
                />

                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                    <label className="block text-sm font-medium text-slate-700">{t('comms_log.form.format')}</label>
                    <div className="flex flex-wrap gap-x-6 gap-y-3">
                        {COMMS_LOG_FORMAT_OPTIONS.map(format => (
                            <CheckboxField
                                key={format}
                                label={`comms_log.format_opts.${format.toLowerCase()}`}
                                name={format}
                                checked={(formData.format || []).includes(format)}
                                onChange={() => handleFormatChange(format)}
                                t={t}
                            />
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SelectField 
                        label={t('comms_log.form.reach')} 
                        name="reach" 
                        options={COMMS_LOG_REACH_OPTIONS.map(opt => ({ value: opt, label: t(`comms_log.reach_opts.${opt.toLowerCase()}`) }))} 
                        value={formData.reach} 
                        onChange={handleChange} 
                    />
                    <InputField 
                        label={t('comms_log.form.audience')} 
                        name="audience" 
                        type="number" 
                        value={String(formData.audience ?? '')} 
                        onChange={handleChange} 
                        required={false}
                    />
                    <InputField 
                        label={t('comms_log.form.free_press')} 
                        name="freePress" 
                        type="number" 
                        value={String(formData.freePress ?? '')} 
                        onChange={handleChange} 
                        required={false}
                    />
                </div>

                <InputField 
                    label={t('comms_log.form.link')} 
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

export default CommunicationsLogForm;