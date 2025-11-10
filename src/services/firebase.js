// src/services/firebase.js

// This file now only handles path generation. 
// It MUST NOT import or export db/auth/initializeApp to prevent conflicts with App.jsx,
// which manages the database state centrally.

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

/**
 * Generates the public Firestore collection paths based on the application ID.
 * @returns {object} Object containing collection paths for agenda and milestones.
 */
export const getDbPaths = () => {
    // Public data path structure: /artifacts/{appId}/public/data/{collectionName}
    const base = `/artifacts/${appId}/public/data`;
    // Private (Admin) data structure: /artifacts/{appId}/admin/{collectionName}
    const adminBase = `/artifacts/${appId}/admin`;
    
    return {
        agenda: `${base}/agendaItems`,
        milestones: `${base}/milestones`,
        activities: `${base}/activities`, 
        // Admin/Auth related paths
        userRequests: `${adminBase}/userRequests`, 
        userRoles: `${adminBase}/userRoles`,       
        userProfiles: `${adminBase}/userProfiles`,
        pressLog: `${adminBase}/pressLog`,

        // TAREA 10: Nueva ruta para Solicitudes de Miembros
        memberRequests: `${adminBase}/memberRequests`,

        // TAREA 11: Nuevas rutas para Finanzas
        financeSummary: `${adminBase}/financeSummary`,
        financeMembershipFees: `${adminBase}/financeMembershipFees`,
        financeDonations: `${adminBase}/financeDonations`,
        financeServices: `${adminBase}/financeServices`,
        financeProjects: `${adminBase}/financeProjects`,
        financeAudits: `${adminBase}/financeAudits`,

        // TAREA 1: Nuevas rutas para Costos de Resumen
        financeAdminCosts: `${adminBase}/financeAdminCosts`,
        financeNonOpCosts: `${adminBase}/financeNonOpCosts`,

        // TAREA 7 (Nueva): Ruta para Proveedores
        financeProviders: `${adminBase}/financeProviders`,
    };
};