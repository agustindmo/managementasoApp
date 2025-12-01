import React, { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { getDbPaths } from '../../services/firebase.js';
import { User, Save, Loader2, Building } from 'lucide-react';
import CardTitle from '../ui/CardTitle.jsx';
import InputField from '../ui/InputField.jsx';
import SelectField from '../ui/SelectField.jsx';
import { ECUADOR_PROVINCES, INDUSTRY_ACTIVITIES } from '../../utils/constants.js'; 
import { useTranslation } from '../../context/TranslationContext.jsx';

const UserProfile = ({ userId, db }) => {
    const { t } = useTranslation();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!db || !userId) return;
        const profileRef = ref(db, `${getDbPaths().userProfiles}/${userId}`);
        const unsubscribe = onValue(profileRef, (snapshot) => {
            if (snapshot.exists()) {
                setProfile(snapshot.val());
            } else {
                setProfile({
                    firstName: '', lastName: '', phone: '', 
                    company: '', role: '', activity: INDUSTRY_ACTIVITIES[0],
                    province: ECUADOR_PROVINCES[0], city: ''
                });
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db, userId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            const profileRef = ref(db, `${getDbPaths().userProfiles}/${userId}`);
            await update(profileRef, profile);
            setMessage(t('profile.success_save'));
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error("Error saving profile:", error);
            setMessage(t('member_request.form.fail'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="ml-3 text-slate-500">{t('profile.loading_admin')}</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
            <h1 className="text-3xl font-bold text-slate-800 mb-6 flex items-center">
                <User className="w-8 h-8 mr-3 text-blue-600" />
                {t('sidebar.user_profile')}
            </h1>

            <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-700 border-b border-slate-100 pb-2">{t('profile.personal_info')}</h3>
                            <InputField label={t('profile.first_name')} name="firstName" value={profile.firstName} onChange={handleChange} />
                            <InputField label={t('profile.last_name')} name="lastName" value={profile.lastName} onChange={handleChange} />
                            <InputField label={t('profile.phone')} name="phone" type="tel" value={profile.phone} onChange={handleChange} />
                        </div>
                        
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-700 border-b border-slate-100 pb-2 flex items-center"><Building className="w-4 h-4 mr-2" /> {t('member_request.form.company_title')}</h3>
                            <InputField label={t('member_request.form.company_name')} name="company" value={profile.company} onChange={handleChange} />
                            <InputField label={t('profile.role')} name="role" value={profile.role} onChange={handleChange} placeholder="e.g. CEO, Manager" />
                            <SelectField label={t('profile.activity')} name="activity" options={INDUSTRY_ACTIVITIES} value={profile.activity} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <h3 className="text-lg font-semibold text-slate-700">{t('member_request.form.activity_location_title')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SelectField label={t('member_request.form.province')} name="province" options={ECUADOR_PROVINCES} value={profile.province} onChange={handleChange} />
                            <InputField label={t('member_request.form.city')} name="city" value={profile.city} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 flex items-center justify-end border-t border-slate-200">
                    {message && (
                        <span className={`mr-4 text-sm font-medium ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                            {message}
                        </span>
                    )}
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition shadow-md disabled:opacity-70"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        <span>{t('finance.fees.save')}</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserProfile;