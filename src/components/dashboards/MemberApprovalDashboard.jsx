// src/components/dashboards/MemberApprovalDashboard.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue, update, set, serverTimestamp } from 'firebase/database'; // Import set
import { Loader2, UserCheck, Check, X, Link as LinkIcon } from 'lucide-react'; // Import LinkIcon
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

// Helper para renderizar listas de array (CORREGIDO)
const RenderArray = ({ items }) => {
    // *** CORRECCIÓN: Comprobar si es un array antes de usar .length o .map ***
    if (!Array.isArray(items) || items.length === 0) {
        return <span className="text-gray-500">N/A</span>;
    }
    
    return (
        <ul className="text-xs list-disc list-inside">
            {items.map((item, index) => (
                <li key={index} className="truncate" title={item}>{item}</li>
            ))}
        </ul>
    );
};

const MemberApprovalDashboard = ({ db, userId }) => { 
    const { t } = useTranslation();
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [votingId, setVotingId] = useState(null); // Para deshabilitar botones durante el voto

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
        return requests.filter(r => 
            r.status === 'pending_director_approval' &&
            (!r.votes || !r.votes[userId]) // Ocultar si ya existe un voto de este director
        );
    }, [requests, userId]);
    
    // 3. Handlers para Votar
    const handleVoteAction = async (request, vote) => {
        if (!db || !userId) return;
        
        setVotingId(request.id); // Deshabilitar botones para esta fila
        
        try {
            const voteRef = ref(db, `${getDbPaths().memberRequests}/${request.id}/votes/${userId}`);
            
            await set(voteRef, {
                vote: vote,
                votedAt: serverTimestamp()
            });
            
        } catch (e) {
            console.error(`Error casting vote:`, e);
            setError(t('member_request.director.action_fail'));
        } finally {
            setVotingId(null); // Rehabilitar botones
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

    // --- Definir todas las cabeceras de la tabla ---
    const tableHeaders = [
        t('member_request.col.company_name'),
        t('member_request.col.commercial_name'),
        t('member_request.col.legal_rep'),
        t('member_request.col.ceo'),
        t('member_request.col.partners'),
        t('member_request.col.activity'),
        t('member_request.col.country'),
        t('member_request.col.province'),
        t('member_request.col.city'),
        t('member_request.col.commercial_refs'),
        t('member_request.col.risk'),
        t('admin.actions')
    ];

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
                                {tableHeaders.map(header => (
                                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-sky-950/50 divide-y divide-sky-800/50">
                            {pendingRequests.length > 0 ? (
                                pendingRequests.map(req => {
                                    const isVoting = votingId === req.id;
                                    return (
                                        <tr key={req.id} className="hover:bg-sky-900/60 transition-colors">
                                            {/* Company Info */}
                                            <td className="px-6 py-4 text-sm font-medium text-white" title={req.company_name}>{req.company_name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-400" title={req.commercial_name}>{req.commercial_name || 'N/A'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-400" title={req.legal_rep}>{req.legal_rep || 'N/A'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-400" title={req.ceo}>{req.ceo || 'N/A'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-400"><RenderArray items={req.partners} /></td>
                                            
                                            {/* Activity & Location */}
                                            <td className="px-6 py-4 text-sm text-gray-400">{req.activity}</td>
                                            <td className="px-6 py-4 text-sm text-gray-400">{req.country}</td>
                                            <td className="px-6 py-4 text-sm text-gray-400">{req.country === 'Ecuador' ? req.province : 'N/A'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-400">{req.country === 'Ecuador' ? req.city : 'N/A'}</td>

                                            {/* Refs & Risk */}
                                            <td className="px-6 py-4 text-sm text-gray-400"><RenderArray items={req.commercial_refs} /></td>
                                            <td className="px-6 py-4 text-sm font-semibold capitalize">
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                                    req.risk_status === 'High' ? 'bg-red-900/50 text-red-300' :
                                                    req.risk_status === 'Medium' ? 'bg-yellow-900/50 text-yellow-300' :
                                                    'bg-green-900/50 text-green-300'
                                                }`}>
                                                    {t(`member_request.risk_opts.${req.risk_status.toLowerCase()}`)}
                                                </span>
                                                {req.risk_link && (
                                                    <a href={req.risk_link} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs text-blue-400 hover:text-blue-300 mt-1">
                                                        <LinkIcon className="w-3 h-3 mr-1" />
                                                        {t('member_request.col.risk_link')} 
                                                    </a>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex space-x-3 justify-end">
                                                    <button
                                                        onClick={() => handleVoteAction(req, 'approved')}
                                                        disabled={isVoting}
                                                        className="flex items-center text-green-400 hover:text-green-200 p-1 rounded-full hover:bg-green-800/50 transition disabled:opacity-50"
                                                    >
                                                        {isVoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                                                        {t('admin.approve')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleVoteAction(req, 'rejected')}
                                                        disabled={isVoting}
                                                        className="flex items-center text-red-400 hover:text-red-200 p-1 rounded-full hover:bg-red-800/50 transition disabled:opacity-50"
                                                    >
                                                        {isVoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 mr-1" />}
                                                        {t('admin.reject')}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan={tableHeaders.length} className="px-6 py-4 text-center text-gray-500">{t('member_request.director.no_pending')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MemberApprovalDashboard;