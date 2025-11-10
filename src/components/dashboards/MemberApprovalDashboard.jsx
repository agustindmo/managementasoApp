// src/components/dashboards/MemberApprovalDashboard.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue, update, set } from 'firebase/database';
import { Loader2, UserCheck, Check, X } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import { useTranslation } from '../../context/TranslationContext.jsx';
import CardTitle from '../ui/CardTitle.jsx';

// Convertir snapshot a array
const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({
        id: key,
        ...val[key],
    }));
};

const MemberApprovalDashboard = ({ db, userId }) => { 
    const { t } = useTranslation();
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. Cargar solicitudes de miembros
    useEffect(() => {
        if (!db) return;
        
        const requestsRef = ref(db, getDbPaths().memberRequests);
        
        const unsubscribe = onValue(requestsRef, (snapshot) => {
            try {
                const allRequests = snapshotToArray(snapshot);
                setRequests(allRequests);
                setIsLoading(false);
            } catch (e) {
                console.error("Error processing member requests snapshot:", e);
                setError(t('admin.process_fail'));
                setIsLoading(false);
            }
        }, (err) => {
            console.error("Member requests subscription error:", err);
            setError(t('admin.connect_fail'));
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [db, t]);

    // 2. Filtrar solicitudes pendientes
    const pendingRequests = useMemo(() => {
        return requests.filter(r => r.status === 'pending_director_approval');
    }, [requests]);
    
    // 3. Handlers para Aprobar/Rechazar
    const handleRequestAction = async (request, newStatus) => {
        if (!db) return;
        
        try {
            const requestRef = ref(db, `${getDbPaths().memberRequests}/${request.id}`);
            
            // Actualizar el estado de la solicitud
            await update(requestRef, {
                status: newStatus,
                reviewedBy: userId,
                reviewedAt: serverTimestamp()
            });

            // Si se aprueba, crear el perfil de usuario
            if (newStatus === 'approved') {
                const profileRef = ref(db, `${getDbPaths().userProfiles}/${request.id}`);
                
                // Crear un nuevo perfil de miembro basado en la solicitud
                // Omitimos los campos de estado y de admin
                const { 
                    status, 
                    createdBy, 
                    createdAt,
                    reviewedBy,
                    reviewedAt, 
                    ...profileData 
                } = request;

                await set(profileRef, {
                    ...profileData,
                    member_since: serverTimestamp(),
                    // Inicializar los campos que faltan en el perfil
                    contacts: [],
                    farms: [],
                    export_certifications: [],
                    farm_certifications: [],
                });
            }
            // Si se rechaza, no se hace nada más que actualizar el estado.
            
        } catch (e) {
            console.error(`Error ${newStatus} member request:`, e);
            setError(t('member_request.director.action_fail'));
        }
    };


    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="ml-3 text-sky-200">{t('member_request.director.loading')}</p>
            </div>
        );
    }
    
    if (error) {
        return <div className="p-4 text-center text-red-400 bg-red-900/50 border border-red-700 rounded-lg">{error}</div>;
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
                <UserCheck className="w-8 h-8 mr-3 text-sky-400" />
                {t('member_request.director_title')}
            </h1>
            
            <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
                <CardTitle title={`${t('member_request.pending_title')} (${pendingRequests.length})`} icon={UserCheck} />
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-sky-800/50">
                        <thead className="bg-sky-900/70">
                            <tr>
                                {[
                                    t('member_request.col.company_name'),
                                    t('member_request.col.activity'),
                                    t('member_request.col.province'),
                                    t('member_request.col.risk'),
                                    t('admin.actions')
                                ].map(header => (
                                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-sky-950/50 divide-y divide-sky-800/50">
                            {pendingRequests.length > 0 ? (
                                pendingRequests.map(req => (
                                    <tr key={req.id} className="hover:bg-sky-900/60 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-white">{req.company_name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-400">{req.activity}</td>
                                        <td className="px-6 py-4 text-sm text-gray-400">{req.province}</td>
                                        <td className="px-6 py-4 text-sm font-semibold capitalize">
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                                                req.risk_status === 'High' ? 'bg-red-900/50 text-red-300' :
                                                req.risk_status === 'Medium' ? 'bg-yellow-900/50 text-yellow-300' :
                                                'bg-green-900/50 text-green-300'
                                            }`}>
                                                {t(`member_request.risk_opts.${req.risk_status.toLowerCase()}`)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex space-x-3 justify-end">
                                                <button
                                                    onClick={() => handleRequestAction(req, 'approved')}
                                                    className="flex items-center text-green-400 hover:text-green-200 p-1 rounded-full hover:bg-green-800/50 transition"
                                                >
                                                    <Check className="w-4 h-4 mr-1" /> {t('admin.approve')}
                                                </button>
                                                <button
                                                    onClick={() => handleRequestAction(req, 'rejected')}
                                                    className="flex items-center text-red-400 hover:text-red-200 p-1 rounded-full hover:bg-red-800/50 transition"
                                                >
                                                    <X className="w-4 h-4 mr-1" /> {t('admin.reject')}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">{t('member_request.director.no_pending')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MemberApprovalDashboard;