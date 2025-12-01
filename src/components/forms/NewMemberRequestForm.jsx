import React, { useState } from 'react';
import { ref, set, push, serverTimestamp } from 'firebase/database';
import { UserPlus, Loader2, CheckCircle, XCircle, Save, Plus, Trash2, X } from 'lucide-react'; 
import CardTitle from '../ui/CardTitle.jsx';
import InputField from '../ui/InputField.jsx';
import SelectField from '../ui/SelectField.jsx';
import { 
    INITIAL_MEMBER_REQUEST_STATE,
    INDUSTRY_ACTIVITIES,
    ECUADOR_PROVINCES,
    ECUADOR_DATA,
    MEMBER_REQUEST_STATUS_OPTIONS
} from '../../utils/constants.js'; 
import { getDbPaths } from '../../services/firebase.js'; 
import { useTranslation } from '../../context/TranslationContext.jsx';

const TagInput = ({ labelKey, items, onAddItem, onRemoveItem, t, buttonLabelKey }) => {
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
            <label className="block text-sm font-medium text-gray-700">{t(labelKey)}</label>
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
                    className="flex-shrink-0 flex justify-center items-center py-2 px-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition duration-300 shadow-sm h-10 mt-1"
                >
                    <Plus className="w-4 h-4" />
                    <span className="ml-1 hidden sm:inline">{t(buttonLabelKey)}</span>
                </button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[20px]">
                {items.map((item, index) => (
                    <span key={index} className="flex items-center bg-blue-100 text-blue-800 text-sm font-medium px-2 py-0.5 rounded-full">
                        {item}
                        <button
                            type="button"
                            onClick={() => onRemoveItem(index)}
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


const NewMemberRequestForm = ({ userId, db, onClose }) => { 
    const { t } = useTranslation();
    const [formData, setFormData] = useState(INITIAL_MEMBER_REQUEST_STATE);
    const [cityOptions, setCityOptions] = useState(ECUADOR_DATA[formData.province] || []);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success'); 

    const isReady = !!db && !!userId;

    const handleProvinceChange = (e) => {
        const newProvince = e.target.value;
        const newCities = ECUADOR_DATA[newProvince] || [];
        setCityOptions(newCities);
        setFormData(prev => ({
            ...prev,
            province: newProvince,
            city: newCities[0] || '' 
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addPartner = (partner) => {
        setFormData(prev => ({ ...prev, partners: [...prev.partners, partner] }));
    };
    const removePartner = (index) => {
        setFormData(prev => ({ ...prev, partners: prev.partners.filter((_, i) => i !== index) }));
    };

    const addReference = (reference) => {
        setFormData(prev => ({ ...prev, commercial_refs: [...prev.commercial_refs, reference] }));
    };
    const removeReference = (index) => {
        setFormData(prev => ({ ...prev, commercial_refs: prev.commercial_refs.filter((_, i) => i !== index) }));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isReady) return; 

        setIsLoading(true);
        setMessage('');
        setMessageType('success');

        try {
            const path = getDbPaths().memberRequests;
            const newItemRef = push(ref(db, path));
            
            await set(newItemRef, {
                ...formData,
                id: newItemRef.key, 
                status: 'pending_director_approval', 
                createdBy: userId,
                createdAt: serverTimestamp(),
            });
            
            setMessage(t('member_request.form.success_add'));
            setMessageType('success');
            setTimeout(onClose, 1000); 

        } catch (error) {
            console.error("Error creating new member request: ", error);
            setMessage(t('member_request.form.fail'));
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden max-w-4xl mx-auto">
            <div className="flex justify-between items-center pr-4">
                <CardTitle title={t('member_request.form.title')} icon={UserPlus} />
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition" title="Close">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800">{t('member_request.form.company_title')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label={t('member_request.form.company_name')} name="company_name" value={formData.company_name} onChange={handleChange} />
                        <InputField label={t('member_request.form.commercial_name')} name="commercial_name" value={formData.commercial_name} onChange={handleChange} required={false} />
                        <InputField label={t('member_request.form.legal_rep')} name="legal_rep" value={formData.legal_rep} onChange={handleChange} />
                        <InputField label={t('member_request.form.ceo')} name="ceo" value={formData.ceo} onChange={handleChange} required={false} />
                    </div>
                    
                    <TagInput
                        labelKey="member_request.form.partners"
                        items={formData.partners || []}
                        onAddItem={addPartner}
                        onRemoveItem={removePartner}
                        t={t}
                        buttonLabelKey="member_request.form.add_partner"
                    />
                </div>

                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800">{t('member_request.form.activity_location_title')}</h3>
                    <SelectField label={t('profile.activity')} name="activity" options={INDUSTRY_ACTIVITIES} value={formData.activity} onChange={handleChange} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField label={t('member_request.form.country')} name="country" value={formData.country} onChange={handleChange} />
                        
                        {formData.country === 'Ecuador' && (
                            <>
                                <SelectField label={t('member_request.form.province')} name="province" options={ECUADOR_PROVINCES} value={formData.province} onChange={handleProvinceChange} />
                                <SelectField label={t('member_request.form.city')} name="city" options={cityOptions} value={formData.city} onChange={handleChange} />
                            </>
                        )}
                    </div>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800">{t('member_request.form.risk_title')}</h3>
                    
                    <TagInput
                        labelKey="member_request.form.commercial_refs"
                        items={formData.commercial_refs || []}
                        onAddItem={addReference}
                        onRemoveItem={removeReference}
                        t={t}
                        buttonLabelKey="member_request.form.add_reference"
                    />

                    <SelectField 
                        label={t('member_request.form.risk_status')} 
                        name="risk_status" 
                        options={MEMBER_REQUEST_STATUS_OPTIONS.map(opt => ({ value: opt, label: t(`member_request.risk_opts.${opt.toLowerCase()}`) }))} 
                        value={formData.risk_status} 
                        onChange={handleChange} 
                    />
                    
                    <InputField 
                        label={t('member_request.form.risk_link')} 
                        name="risk_link" 
                        type="url"
                        value={formData.risk_link} 
                        onChange={handleChange} 
                        required={false} 
                    />
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-200">
                    {message && (
                        <span className={`text-sm flex items-center ${messageType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {messageType === 'success' ? <CheckCircle className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />} 
                            {message}
                        </span>
                    )}
                    <button
                        type="submit"
                        disabled={isLoading || !isReady}
                        className={`flex justify-center items-center py-2.5 px-5 border border-transparent text-sm font-bold rounded-lg text-white transition duration-300 ease-in-out ${
                            isLoading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md'
                        }`}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {t('member_request.form.submit')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewMemberRequestForm;