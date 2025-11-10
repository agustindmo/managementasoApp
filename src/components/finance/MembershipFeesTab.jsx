// src/components/finance/MembershipFeesTab.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { Users, Loader2, Save } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import { useTranslation } from '../../context/TranslationContext.jsx';
import CardTitle from '../ui/CardTitle.jsx';
import InputField from '../ui/InputField.jsx'; // Usaremos nuestro InputField oscuro

const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({
        id: key, 
        ...val[key],
    }));
};

const MembershipFeesTab = ({ db, userId }) => {
    const { t } = useTranslation();
    const [profiles, setProfiles] = useState([]);
    const [fees, setFees] = useState({}); // Objeto para { profileId: amount }
    const [isLoading, setIsLoading] = useState(true);
    const [savingId, setSavingId] = useState(null); // Para mostrar 'saving...' en un botón específico

    // 1. Cargar perfiles y cuotas existentes
    useEffect(() => {
        if (!db) return;
        
        const profilesRef = ref(db, getDbPaths().userProfiles);
        const feesRef = ref(db, getDbPaths().financeMembershipFees);
        
        let profilesLoaded = false;
        let feesLoaded = false;
        const checkDone = () => {
            if (profilesLoaded && feesLoaded) setIsLoading(false);
        };

        const unsubProfiles = onValue(profilesRef, (snapshot) => {
            setProfiles(snapshotToArray(snapshot));
            profilesLoaded = true;
            checkDone();
        });

        const unsubFees = onValue(feesRef, (snapshot) => {
            setFees(snapshot.val() || {});
            feesLoaded = true;
            checkDone();
        });

        return () => {
            unsubProfiles();
            unsubFees();
        };
    }, [db]);

    // 2. Handler para guardar una cuota
    const handleSaveFee = async (profileId) => {
        if (!db || !userId) return;
        setSavingId(profileId); // Mostrar spinner
        
        const newAmount = fees[profileId] || 0;
        
        try {
            const feeRef = ref(db, `${getDbPaths().financeMembershipFees}/${profileId}`);
            await update(feeRef, {
                amount: parseFloat(newAmount),
                lastUpdatedBy: userId,
                lastUpdatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating membership fee:", error);
            // Aquí se podría añadir un mensaje de error
        } finally {
            setSavingId(null); // Ocultar spinner
        }
    };
    
    // 3. Handler para cambiar el valor del input
    const handleFeeChange = (profileId, value) => {
        setFees(prev => ({
            ...prev,
            [profileId]: value
        }));
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="ml-3 text-sky-200">{t('finance.fees.loading')}</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
            <CardTitle title={t('finance.tab.fees')} icon={Users} />
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-sky-800/50">
                    <thead className="bg-sky-900/70">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider">{t('profile.company')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider">{t('finance.fees.amount')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider">{t('admin.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-sky-950/50 divide-y divide-sky-800/50">
                        {profiles.length > 0 ? (
                            profiles.map(profile => {
                                const isSavingThis = savingId === profile.id;
                                return (
                                    <tr key={profile.id} className="hover:bg-sky-900/60 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-white">{profile.company || profile.representative}</td>
                                        <td className="px-6 py-4">
                                            <InputField 
                                                label=""
                                                name={`fee_${profile.id}`}
                                                type="number"
                                                value={String(fees[profile.id]?.amount || fees[profile.id] || '')} // Manejar objeto o valor simple
                                                onChange={(e) => handleFeeChange(profile.id, e.target.value)}
                                                required={false}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleSaveFee(profile.id)}
                                                disabled={isSavingThis}
                                                className={`flex items-center justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition duration-300 ${
                                                    isSavingThis ? 'bg-sky-400 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700'
                                                }`}
                                            >
                                                {isSavingThis ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                <span className="ml-2">{isSavingThis ? t('profile.saving') : t('finance.fees.save')}</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr><td colSpan="3" className="px-6 py-4 text-center text-gray-500">{t('finance.fees.no_members')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default MembershipFeesTab;