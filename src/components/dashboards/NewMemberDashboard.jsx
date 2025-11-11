// src/components/dashboards/NewMemberDashboard.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { UserPlus, Loader2, List, Link as LinkIcon, Trash2, PlusCircle } from 'lucide-react'; // Import PlusCircle
import { useTranslation } from '../../context/TranslationContext.jsx';
import NewMemberRequestForm from '../forms/NewMemberRequestForm.jsx'; 
import CardTitle from '../ui/CardTitle.jsx';
import { getDbPaths } from '../../services/firebase.js';

// --- Helper para convertir snapshot ---
const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({
        id: key,
        ...val[key],
    }));
};

// --- Componente de Tabla (Admin) ---
// --- MODIFICADO: Acepta 'onOpenForm' ---
const SentRequestsTable = ({ db, t, onOpenForm }) => {
    const [requests, setRequests] = useState([]);
    const [directors, setDirectors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // 1. Cargar Solicitudes y Directores
    useEffect(() => {
        if (!db) return;
        setIsLoading(true);
        let requestsLoaded = false;
        let directorsLoaded = false;

        const checkDone = () => {
            if (requestsLoaded && directorsLoaded) setIsLoading(false);
        };

        // Cargar todas las solicitudes
        const requestsRef = ref(db, getDbPaths().memberRequests);
        const unsubRequests = onValue(requestsRef, (snapshot) => {
            try {
                const allRequests = snapshotToArray(snapshot).sort((a, b) => b.createdAt - a.createdAt);
                setRequests(allRequests);
            } catch (e) { console.error("Error processing member requests snapshot:", e); } 
            finally { requestsLoaded = true; checkDone(); }
        });

        // Cargar todos los roles para encontrar directores
        const rolesRef = ref(db, getDbPaths().userRoles);
        const unsubRoles = onValue(rolesRef, (snapshot) => {
            try {
                const allRoles = snapshotToArray(snapshot);
                const directorList = allRoles
                    .filter(u => u.role === 'director')
                    .map(d => ({ id: d.id, email: d.email })); // Guardar id y email
                setDirectors(directorList);
            } catch (e) { console.error("Error processing roles snapshot:", e); }
            finally { directorsLoaded = true; checkDone(); }
        }, { onlyOnce: true }); // Cargar solo una vez

        return () => {
            unsubRequests();
            unsubRoles();
        };
    }, [db]);

    // 2. Lógica para calcular estado de votos
    const requestsWithVoteStatus = useMemo(() => {
        return requests.map(req => {
            const votes = req.votes || {};
            const approvedBy = [];
            const rejectedBy = [];
            const pendingBy = [];

            directors.forEach(dir => {
                const vote = votes[dir.id]?.vote;
                if (vote === 'approved') {
                    approvedBy.push(dir.email);
                } else if (vote === 'rejected') {
                    rejectedBy.push(dir.email);
                } else {
                    pendingBy.push(dir.email);
                }
            });

            return { ...req, approvedBy, rejectedBy, pendingBy };
        });
    }, [requests, directors]);

    // 3. Handler para eliminar (solo admin)
    const handleDelete = async (id) => {
        if (db && window.confirm(t('policy.confirm_delete'))) { 
            try {
                const itemRef = ref(db, `${getDbPaths().memberRequests}/${id}`);
                await remove(itemRef); 
            } catch (e) { console.error("Error deleting member request:", e); }
        }
    };

    // 4. Helpers de Renderizado
    const getStatusLabel = (status) => {
        if (status === 'approved') return t('member_request.status.approved');
        if (status === 'rejected') return t('member_request.status.rejected');
        return t('member_request.status.pending');
    };
    
    const getStatusClass = (status) => {
        if (status === 'approved') return 'bg-green-900/50 text-green-300';
        if (status === 'rejected') return 'bg-red-900/50 text-red-300';
        return 'bg-yellow-900/50 text-yellow-300';
    };

    const renderVoteList = (list) => {
        if (list.length === 0) return <span className="text-gray-500">N/A</span>;
        return (
            <ul className="text-xs">
                {list.map(email => <li key={email} title={email} className="truncate max-w-xs">{email}</li>)}
            </ul>
        );
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
            {/* --- MODIFICADO: CardTitle ahora tiene un botón --- */}
            <div className="flex items-center justify-between p-4 bg-sky-900/70 rounded-t-xl border-b border-sky-700/50">
                <div className="flex items-center space-x-3">
                    <List className="w-5 h-5 text-sky-300" />
                    <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                        {`${t('member_request.sent_requests_title')} (${requests.length})`}
                    </h2>
                </div>
                <button
                    onClick={onOpenForm}
                    className="flex items-center space-x-2 bg-sky-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-sky-700 transition shadow-md"
                    title={t('member_request.form.title')}
                >
                    <PlusCircle className="w-4 h-4" />
                    <span>{t('member_request.form.title')}</span>
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-sky-800/50">
                    <thead className="bg-sky-900/70">
                        <tr>
                            {[
                                t('member_request.col.company_name'),
                                t('member_request.col.risk'),
                                t('member_request.col.status'),
                                t('member_request.votes.approved'), // Nueva clave
                                t('member_request.votes.rejected'), // Nueva clave
                                t('member_request.votes.pending'), // Nueva clave
                                t('admin.actions')
                            ].map(header => (
                                <th key={header} className="px-6 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-sky-950/50 divide-y divide-sky-800/50">
                        {requestsWithVoteStatus.length > 0 ? (
                            requestsWithVoteStatus.map(req => (
                                <tr key={req.id} className="hover:bg-sky-900/60 transition-colors">
                                    {/* Compañía y Link */}
                                    <td className="px-6 py-4 text-sm font-medium text-white">
                                        {req.company_name}
                                        {req.risk_link && (
                                            <a href={req.risk_link} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs text-blue-400 hover:text-blue-300 mt-1">
                                                <LinkIcon className="w-3 h-3 mr-1" />
                                                {t('member_request.col.risk_link')}
                                            </a>
                                        )}
                                    </td>
                                    {/* Riesgo */}
                                    <td className="px-6 py-4 text-sm font-semibold capitalize">
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                                            req.risk_status === 'High' ? 'bg-red-900/50 text-red-300' :
                                            req.risk_status === 'Medium' ? 'bg-yellow-900/50 text-yellow-300' :
                                            'bg-green-900/50 text-green-300'
                                        }`}>
                                            {t(`member_request.risk_opts.${req.risk_status.toLowerCase()}`)}
                                        </span>
                                    </td>
                                    {/* Estado General */}
                                    <td className="px-6 py-4 text-sm font-semibold capitalize">
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusClass(req.status)}`}>
                                            {getStatusLabel(req.status)}
                                        </span>
                                    </td>
                                    {/* Votos */}
                                    <td className="px-6 py-4 text-sm text-green-400">{renderVoteList(req.approvedBy)}</td>
                                    <td className="px-6 py-4 text-sm text-red-400">{renderVoteList(req.rejectedBy)}</td>
                                    <td className="px-6 py-4 text-sm text-yellow-400">{renderVoteList(req.pendingBy)}</td>
                                    {/* Acciones (Solo Admin) */}
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleDelete(req.id)}
                                            className="text-red-400 hover:text-red-200 p-1 rounded-full hover:bg-red-800/50 transition"
                                            title={t('admin.reject')}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="7" className="px-6 py-4 text-center text-gray-500">{t('member_request.director.no_pending')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const NewMemberDashboard = ({ userId, db }) => { 
    const { t } = useTranslation();
    const [view, setView] = useState('table'); // 'table' or 'form'
    
    const handleOpenForm = () => setView('form');
    const handleCloseForm = () => setView('table');
    
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
                <UserPlus className="w-8 h-8 mr-3 text-sky-400" />
                {t('member_request.admin_title')}
            </h1>
            
            {view === 'table' ? (
                <SentRequestsTable db={db} t={t} onOpenForm={handleOpenForm} />
            ) : (
                <NewMemberRequestForm
                    userId={userId} 
                    db={db}
                    onClose={handleCloseForm}
                />
            )}
        </div>
    );
};

export default NewMemberDashboard;