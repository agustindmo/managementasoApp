import React, { useState, useEffect, useMemo } from 'react';
import { Users, Loader2, UserPlus, UserCheck, XCircle, Edit, Trash2 } from 'lucide-react';
import { ref, onValue, update, remove, set, serverTimestamp } from 'firebase/database';
import { getDbPaths } from '../../services/firebase.js';
import CardTitle from '../ui/CardTitle.jsx';
import { useTranslation } from '../../context/TranslationContext.jsx'; 

const ROLE_OPTIONS = ['user', 'director', 'admin'];

// Función para procesar la lista de PENDIENTES
const snapshotToRequestsArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({
        id: key,
        ...val[key],
    })).filter(item => item.status === 'pending'); 
};

// TAREA 1: Nueva función para procesar la lista de ACTIVOS
const snapshotToActiveUsersArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({
        id: key, // Este es el UID
        ...val[key], // Esto incluye 'email' y 'role'
    }));
};

const UserAdminDashboard = ({ db, userId }) => {
    const { t } = useTranslation(); 
    const [pendingRequests, setPendingRequests] = useState([]);
    const [activeUsers, setActiveUsers] = useState([]); // TAREA 1: Nuevo estado
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. Fetch data
    useEffect(() => {
        if (!db) return;
        
        const paths = getDbPaths();
        
        // Suscripción 1: Solicitudes pendientes
        const requestsRef = ref(db, paths.userRequests);
        const unsubscribeRequests = onValue(requestsRef, (snapshot) => {
            try {
                setPendingRequests(snapshotToRequestsArray(snapshot));
                setIsLoading(false); // Quitar esto si ambas cargas deben ser atómicas
                setError(null); 
            } catch (e) {
                console.error("Error processing user requests snapshot:", e);
                setError(t('admin.process_fail')); 
                setIsLoading(false);
            }
        }, (err) => {
            console.error("User requests subscription error:", err);
            if (err.message.includes('permission_denied')) {
                setError(t('admin.permission_denied')); 
            } else {
                 setError(t('admin.connect_fail')); 
            }
            setIsLoading(false);
        });

        // TAREA 1: Suscripción 2: Usuarios activos
        const rolesRef = ref(db, paths.userRoles);
        const unsubscribeRoles = onValue(rolesRef, (snapshot) => {
            try {
                setActiveUsers(snapshotToActiveUsersArray(snapshot));
                setIsLoading(false);
                setError(null);
            } catch (e) {
                console.error("Error processing user roles snapshot:", e);
                setError(t('admin.process_fail'));
                setIsLoading(false);
            }
        }, (err) => {
            console.error("User roles subscription error:", err);
            if (err.message.includes('permission_denied')) {
                setError(t('admin.permission_denied'));
            } else {
                 setError(t('admin.connect_fail'));
            }
            setIsLoading(false);
        });


        return () => {
            unsubscribeRequests();
            unsubscribeRoles(); // TAREA 1: Limpiar la nueva suscripción
        };
    }, [db, t]); 

    // 2. Handle role assignment/rejection (para PENDIENTES)
    const handleAssignRole = async (request) => {
        const newRole = prompt(t('admin.prompt_modify', {email: request.email}), 'user');

        if (!newRole || !ROLE_OPTIONS.includes(newRole.toLowerCase())) {
            alert(t('admin.invalid_role'));
            return;
        }

        const roleToAssign = newRole.toLowerCase();

        try {
            const userRoleRef = ref(db, `${getDbPaths().userRoles}/${request.uid}`);
            await set(userRoleRef, {
                email: request.email,
                role: roleToAssign,
                assignedBy: userId,
                assignedAt: serverTimestamp(),
            });
    
            const requestRef = ref(db, `${getDbPaths().userRequests}/${request.uid}`);
            await remove(requestRef); 
        } catch (e) {
            console.error("Error assigning role/deleting request:", e);
            setError(t('admin.modify_fail'));
        }
    };
    
    const handleRejectRequest = async (request) => {
         if (window.confirm(t('admin.confirm_eliminate_request', {email: request.email}))) { // Asumiendo que esta clave existe
             try {
                const requestRef = ref(db, `${getDbPaths().userRequests}/${request.uid}`);
                await remove(requestRef); 
             } catch (e) {
                console.error("Error rejecting request:", e);
                setError(t('admin.eliminate_fail'));
             }
        }
    };

    // --- TAREA 1: Nuevos Handlers para USUARIOS ACTIVOS ---
    
    // Modificar el rol de un usuario activo
    const handleModifyRole = async (user) => {
        const newRole = prompt(t('admin.prompt_modify', {email: user.email}), user.role);

        if (!newRole || !ROLE_OPTIONS.includes(newRole.toLowerCase())) {
            alert(t('admin.invalid_role'));
            return;
        }

        const roleToAssign = newRole.toLowerCase();

        try {
            // Simplemente actualizamos (update) el campo 'role' en el nodo del usuario
            const userRoleRef = ref(db, `${getDbPaths().userRoles}/${user.id}`);
            await update(userRoleRef, {
                role: roleToAssign,
                updatedBy: userId,
                updatedAt: serverTimestamp(),
            });
        } catch (e) {
            console.error("Error modifying role:", e);
            setError(t('admin.modify_fail'));
        }
    };

    // Eliminar el rol de un usuario (revocar acceso)
    const handleEliminateUser = async (user) => {
        if (window.confirm(t('admin.confirm_eliminate'))) {
             try {
                // Eliminar el registro completo del rol
                const userRoleRef = ref(db, `${getDbPaths().userRoles}/${user.id}`);
                await remove(userRoleRef); 
                
                // (Opcional) Limpiar también cualquier solicitud pendiente por si acaso
                const requestRef = ref(db, `${getDbPaths().userRequests}/${user.id}`);
                await remove(requestRef);
             } catch (e) {
                console.error("Error eliminating user role:", e);
                setError(t('admin.eliminate_fail'));
             }
        }
    };
    // --- Fin de nuevos handlers ---


    if (isLoading && pendingRequests.length === 0 && activeUsers.length === 0) { // Solo mostrar carga si ambas listas están vacías
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="ml-3 text-sky-200">{t('admin.loading')}</p>
            </div>
        );
    }
    
    if (error) {
        return <div className="p-4 text-center text-red-400 bg-red-900/50 border border-red-700 rounded-lg">{error}</div>;
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
                <Users className="w-8 h-8 mr-3 text-sky-400" />
                {t('admin.user_panel_title')} 
            </h1>

            {/* --- Tabla de Solicitudes Pendientes --- */}
            <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden mb-8">
                <CardTitle 
                    title={`${t('admin.pending_requests')} (${pendingRequests.length})`} 
                    icon={UserPlus} 
                />
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-sky-800/50">
                        <thead className="bg-sky-900/70">
                            <tr>
                                {[t('admin.email'), t('admin.user_id'), t('admin.requested_role'), t('admin.time_submitted'), t('admin.actions')].map(header => (
                                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-sky-950/50 divide-y divide-sky-800/50">
                            {pendingRequests.length > 0 ? (
                                pendingRequests.map(request => (
                                    <tr key={request.uid} className="hover:bg-sky-900/60 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-white">{request.email}</td>
                                        <td className="px-6 py-4 text-sm text-gray-400 truncate max-w-[150px]">{request.uid}</td>
                                        <td className="px-6 py-4 text-sm text-purple-400 font-semibold capitalize">{request.requestedRole}</td>
                                        <td className="px-6 py-4 text-sm text-gray-400">
                                            {request.timestamp ? new Date(request.timestamp).toLocaleString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex space-x-3 justify-end">
                                                <button
                                                    onClick={() => handleAssignRole(request)}
                                                    className="flex items-center text-green-400 hover:text-green-200 p-1 rounded-full hover:bg-green-800/50 transition"
                                                    title={t('admin.approve')}
                                                >
                                                    <UserCheck className="w-4 h-4 mr-1" /> {t('admin.approve')}
                                                </button>
                                                <button
                                                    onClick={() => handleRejectRequest(request)}
                                                    className="flex items-center text-red-400 hover:text-red-200 p-1 rounded-full hover:bg-red-800/50 transition"
                                                    title={t('admin.reject')}
                                                >
                                                    <XCircle className="w-4 h-4 mr-1" /> {t('admin.reject')}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">{t('admin.no_pending')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* --- TAREA 1: Nueva Tabla de Usuarios Activos --- */}
            <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
                <CardTitle title={`${t('admin.active_users_title')} (${activeUsers.length})`} icon={Users} />
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-sky-800/50">
                        <thead className="bg-sky-900/70">
                            <tr>
                                {[t('admin.email'), t('admin.user_id'), t('admin.col.assigned_role'), t('admin.actions')].map(header => (
                                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-sky-950/50 divide-y divide-sky-800/50">
                            {activeUsers.length > 0 ? (
                                activeUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-sky-900/60 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-white">{user.email}</td>
                                        <td className="px-6 py-4 text-sm text-gray-400 truncate max-w-[150px]">{user.id}</td>
                                        <td className="px-6 py-4 text-sm text-sky-300 font-semibold capitalize">{user.role}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex space-x-3 justify-end">
                                                <button
                                                    onClick={() => handleModifyRole(user)}
                                                    className="flex items-center text-sky-400 hover:text-sky-200 p-1 rounded-full hover:bg-sky-800/50 transition"
                                                    title={t('admin.modify_role')}
                                                >
                                                    <Edit className="w-4 h-4 mr-1" /> {t('admin.modify_role')}
                                                </button>
                                                <button
                                                    onClick={() => handleEliminateUser(user)}
                                                    className="flex items-center text-red-400 hover:text-red-200 p-1 rounded-full hover:bg-red-800/50 transition"
                                                    title={t('admin.eliminate_user')}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-1" /> {t('admin.eliminate_user')}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">{t('admin.no_active_users')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 bg-black/30 border-t border-sky-700/50">
                    <p className="text-xs text-gray-500">{t('admin.active_users_note')}</p>
                </div>
            </div>
        </div>
    );
};

export default UserAdminDashboard;