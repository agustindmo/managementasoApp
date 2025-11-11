import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getDatabase, ref as dbRef, onValue } from 'firebase/database'; 
import { LogOut, Globe, Loader2 } from 'lucide-react'; 

// Import services and components
import { getDbPaths } from './services/firebase.js'; 
import LoginScreen from './LoginScreen.jsx';
import Sidebar from './components/Sidebar.jsx';
import AdminDashboard from './components/dashboards/AdminDashboard.jsx';
import UserDashboardDisplay from './components/dashboards/UserDashboard.jsx';
import DirectorDashboardDisplay from './components/dashboards/DirectorDashboard.jsx';
import AgendaDashboard from './components/dashboards/AgendaDashboard.jsx';
import ObjectivesDashboard from './components/dashboards/ObjectivesDashboard.jsx';
import ActivityLogDashboard from './components/dashboards/ActivityLogDashboard.jsx';
import StakeholderMapDashboard from './components/dashboards/StakeholderMapDashboard.jsx';
import { TranslationProvider, useTranslation } from './context/TranslationContext.jsx'; 
import UserAdminDashboard from './components/dashboards/UserAdminDashboard.jsx'; 
import CommunicationsDashboard from './components/dashboards/CommunicationsDashboard.jsx'; 
import UserProfile from './components/dashboards/UserProfile.jsx';
import AdminProfileDashboard from './components/dashboards/AdminProfileDashboard.jsx';
import PressLogDashboard from './components/dashboards/PressLogDashboard.jsx';
import NewMemberDashboard from './components/dashboards/NewMemberDashboard.jsx';
import MemberApprovalDashboard from './components/dashboards/MemberApprovalDashboard.jsx';
import FinanceDashboard from './components/dashboards/FinanceDashboard.jsx';
import FinanceRelationsDashboard from './components/dashboards/FinanceRelationsDashboard.jsx';
import MediaStakeholderMapDashboard from './components/dashboards/MediaStakeholderDashboard.jsx';
import EventDashboard from './components/dashboards/EventDashboard.jsx'; 
import MemberDirectoryDashboard from './components/dashboards/MemberDirectoryDashboard.jsx';
import BoardDirectoryDashboard from './components/dashboards/BoardDirectoryDashboard.jsx';
import PublicAffairsDirectoryDashboard from './components/dashboards/PublicAffairsDirectoryDashboard.jsx';
import MediaDirectoryDashboard from './components/dashboards/MediaDirectoryDashboard.jsx';
import PartnersDirectoryDashboard from './components/dashboards/PartnersDirectoryDashboard.jsx';
import CommissionDashboard from './components/dashboards/CommissionDashboard.jsx';
import GovernanceDashboard from './components/dashboards/GovernanceDashboard.jsx';
import BulletinDashboard from './components/dashboards/BulletinDashboard.jsx';


// Placeholder views 
const SectorDashboard = () => <div className="ml-64 p-8 text-center text-gray-600">Sector e Institución View (Placeholder)</div>;
const PilarDashboard = () => <div className="ml-64 p-8 text-center text-gray-600">Pilar y Agenda View (Placeholder)</div>;
const CondicionDashboard = () => <div className="ml-64 p-8 text-center text-gray-600">Condición e Instrumento View (Placeholder)</div>;


// --- 1. CONFIGURATION FALLBACK ---
const HARDCODED_FALLBACK_CONFIG = {
    apiKey: "AIzaSyBC8dNvx1YFTrwJN74wuYWL7AzZg18cLso", 
    authDomain: "policyapp-e5b9e.firebaseapp.com",
    projectId: "policyapp-e5b9e", 
    storageBucket: "policyapp-e5b9e.firebasestorage.app",
    messagingSenderId: "87174025679",
    appId: "1:87174025679:web:8c8ef3781274356c8542ba",
    databaseURL: "https://policyapp-e5b9e-default-rtdb.firebaseio.com/",
    measurementId: "G-66W843QQY2"
};
const getFirebaseConfig = () => {
    const envConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
    if (envConfig.projectId && envConfig.projectId !== 'missing-project-id-fallback') {
        return envConfig; 
    }
    return HARDCODED_FALLBACK_CONFIG;
};
// --------------------------------------------------------

function AppContent() {
    const { t, toggleLanguage, language } = useTranslation();
    const [dbInstance, setDbInstance] = useState(null);
    const [authInstance, setAuthInstance] = useState(null);
    const [userId, setUserId] = useState(null);
    const [role, setRole] = useState(null); 
    const [isAppInitialized, setIsAppInitialized] = useState(false); 
    const [activeView, setActiveView] = useState('resumen'); 

    const isReady = !!dbInstance && !!authInstance && isAppInitialized;

    // 1. Firebase Initialization and Auth Setup
    useEffect(() => {
        let auth, db;
        const config = getFirebaseConfig(); 
        let unsubscribeAuth = () => {};
        let unsubscribeRole = () => {};

        if (!config.projectId) {
            console.error("CRITICAL: Configuration check failed.");
            setIsAppInitialized(true); 
            return;
        }
        try {
            const app = initializeApp(config);
            db = getDatabase(app); 
            auth = getAuth(app);
            setDbInstance(db); 
            setAuthInstance(auth);
            setIsAppInitialized(true); 
            console.log(`Firebase services initialized for project: ${config.projectId}`);
        } catch (error) {
            console.error("CRITICAL: Firebase initialization failed:", error);
            setIsAppInitialized(true); 
            return;
        }
        unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                const rolePath = getDbPaths().userRoles;
                const roleRef = dbRef(db, `${rolePath}/${user.uid}/role`);
                if (unsubscribeRole) unsubscribeRole(); 
                unsubscribeRole = onValue(roleRef, (snapshot) => {
                    const assignedRole = snapshot.val() || 'pending'; 
                    setRole(assignedRole);
                    if (assignedRole === 'admin') setActiveView('user_admin'); 
                    else if (assignedRole === 'director') setActiveView('member_approvals');
                    else if (assignedRole === 'user' || assignedRole === 'userinvitee' || assignedRole === 'directorinvitee') setActiveView('resumen'); 
                    else setRole('pending');
                });
            } else {
                setUserId(null);
                setRole(null);
                if (unsubscribeRole) unsubscribeRole(); 
            }
        });
        return () => {
            unsubscribeAuth();
            if (unsubscribeRole) unsubscribeRole();
        };
    }, []);

    // Effect to handle navigation when role changes
    useEffect(() => {
        
        const commsBaseViews = ['media_stakeholder_map', 'bulletin_board']; 
        const userBaseViews = ['resumen', 'logros', 'events', 'member_directory', 'governance', 'bulletin_board']; 
        const directorBaseViews = ['resumen', 'logros', 'objectivos', 'stakeholder_map', 'agenda_view', 'events', 'member_directory', 'board_directory', 'public_affairs_directory', 'media_directory', 'partners_directory', 'commissions_directory', 'governance', ...commsBaseViews];

        // Vistas completas
        const adminViews = ['user_admin', 'admin_profiles', 'new_member_request', 'finance_dashboard', 'finance_relations', 'policy_data', 'activity_log', 'communications_log', 'press_log', ...directorBaseViews];
        const directorViews = ['user_profile', 'member_approvals', ...directorBaseViews];
        const directorInviteeViews = [...directorBaseViews]; 
        const userViews = ['user_profile', ...userBaseViews];
        const userInviteeViews = [...userBaseViews]; 
        
        if (role === 'admin' && !adminViews.includes(activeView)) {
            setActiveView('user_admin'); 
        } 
        else if (role === 'director' && !directorViews.includes(activeView)) {
            setActiveView('member_approvals'); 
        }
        else if (role === 'directorinvitee' && !directorInviteeViews.includes(activeView)) {
            setActiveView('resumen'); 
        }
        else if (role === 'user' && !userViews.includes(activeView)) {
            setActiveView('resumen'); 
        }
        else if (role === 'userinvitee' && !userInviteeViews.includes(activeView)) {
            setActiveView('resumen'); 
        }
    }, [role, activeView]);
    
    // Function to handle logout
    const handleLogout = async () => {
        if (authInstance) {
            try { await signOut(authInstance); } 
            catch (e) { console.error("Error signing out:", e); }
        }
    };

    // 2. Conditional Rendering/Routing
    const renderDashboardView = () => {
        if (!isReady) {
             return (
                <div className="flex justify-center items-center h-screen bg-sky-950/90 text-white">
                    <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                    <p className="ml-3 text-sky-200">Initializing Firebase services...</p>
                 </div>
            );
        }

        if (!!userId && (!role || role === 'pending')) {
             return (
                <div className="p-8 text-center bg-yellow-900/50 border border-yellow-700 rounded-xl m-8 min-h-screen text-yellow-100">
                    <h2 className="text-2xl font-bold text-yellow-300 mb-4">Access Pending Approval</h2>
                    <p className="text-yellow-100">
                        Your account is currently awaiting review and role assignment by an administrator.
                    </p>
                    <p className="text-sm text-yellow-200 mt-2">
                        Email: {authInstance?.currentUser?.email || 'N/A'}
                    </p>
                    <button
                        onClick={handleLogout}
                        className="mt-6 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                        {t('button.logout')}
                    </button>
                </div>
            );
        }
        
        switch (activeView) {
            // Members
            case 'user_admin':
                return <UserAdminDashboard userId={userId} db={dbInstance} />;
            case 'user_profile':
                return <UserProfile userId={userId} db={dbInstance} />;
            case 'admin_profiles':
                return <AdminProfileDashboard db={dbInstance} />;
            case 'new_member_request':
                return <NewMemberDashboard userId={userId} db={dbInstance} />;
            case 'member_approvals':
                return <MemberApprovalDashboard userId={userId} db={dbInstance} />;
            
            // Public Affairs
            case 'policy_data':
                return <AdminDashboard userId={userId} db={dbInstance} />;
            case 'activity_log': 
                return <ActivityLogDashboard userId={userId} db={dbInstance} />;
            case 'resumen': 
                return <UserDashboardDisplay db={dbInstance} />;
            case 'logros': 
                return <DirectorDashboardDisplay db={dbInstance} />;
            case 'objectivos':
                return <ObjectivesDashboard db={dbInstance} />;
            case 'stakeholder_map': 
                return <StakeholderMapDashboard db={dbInstance} />;
            case 'agenda_view': 
                return <AgendaDashboard db={dbInstance} />;
            case 'events':
                return <EventDashboard userId={userId} db={dbInstance} role={role} />;

            // Communications
            case 'communications_log':
                return <CommunicationsDashboard db={dbInstance} />;
            case 'press_log':
                return <PressLogDashboard userId={userId} db={dbInstance} />;
            case 'media_stakeholder_map':
                return <MediaStakeholderMapDashboard db={dbInstance} role={role} userId={userId} />;
            case 'bulletin_board': 
                return <BulletinDashboard userId={userId} db={dbInstance} role={role} />;

            // Database
            case 'member_directory':
                return <MemberDirectoryDashboard db={dbInstance} role={role} />;
            case 'board_directory':
                return <BoardDirectoryDashboard db={dbInstance} role={role} />;
            case 'public_affairs_directory':
                return <PublicAffairsDirectoryDashboard db={dbInstance} userId={userId} role={role} />;
            case 'media_directory':
                return <MediaDirectoryDashboard db={dbInstance} />;
            case 'partners_directory':
                return <PartnersDirectoryDashboard db={dbInstance} />;
            case 'commissions_directory': 
                return <CommissionDashboard db={dbInstance} userId={userId} role={role} />;

            // Governance
            case 'governance':
                return <GovernanceDashboard db={dbInstance} userId={userId} role={role} />;

            // Finance
            case 'finance_dashboard':
                return <FinanceDashboard userId={userId} db={dbInstance} role={role} />;
            case 'finance_relations':
                return <FinanceRelationsDashboard userId={userId} db={dbInstance} role={role} />;

            // Placeholders
            case 'sector':
                return <SectorDashboard />;
            case 'pilar':
                return <PilarDashboard />;
            case 'condicion':
                return <CondicionDashboard />;
            default:
                return <p className="p-8 text-center text-gray-400">View not found.</p>;
        }
    };

    const renderContent = () => {
        const isUserAuthenticated = !!authInstance?.currentUser;

        if (!isUserAuthenticated && isReady) {
            return <LoginScreen isReady={isReady} db={dbInstance} auth={authInstance} />; 
        }
        
        if (!isReady) {
             return (
                <div className="flex justify-center items-center h-screen bg-sky-950/90 text-white">
                    <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                    <p className="ml-3 text-sky-200">Initializing system components...</p>
                 </div>
            );
        }
        
        const showSidebar = role === 'admin' || role === 'director' || role === 'user' || role ==='directorinvitee' || role === 'userinvitee';
        const contentPadding = showSidebar ? 'pl-64' : 'px-4'; 

        return (
            <div className="flex min-h-screen">
                {showSidebar && (
                    <Sidebar 
                        activeView={activeView} 
                        setActiveView={setActiveView}
                        isDashboard={true} 
                        role={role} 
                    />
                )}
                <main className={`w-full ${contentPadding} transition-all duration-300 pt-20`}>
                    {renderDashboardView()}
                </main>
            </div>
        );
    };

    return (
        <div className="font-sans min-h-screen bg-gradient-to-br from-sky-950 via-black to-black text-gray-200">
            <button
                onClick={toggleLanguage}
                className={`fixed top-4 ${authInstance?.currentUser ? 'right-40' : 'right-4'} z-50 p-2 bg-black/50 border border-sky-700/50 text-white rounded-full shadow-lg hover:bg-sky-800 transition duration-300 flex items-center text-sm backdrop-blur-md`}
                title={language === 'es' ? 'Change to English' : 'Cambiar a Español'}
            >
                <Globe className="w-4 h-4 mr-1" />
                {language === 'es' ? 'EN' : 'ES'}
            </button>
            
            {authInstance?.currentUser && (
                <button
                    onClick={handleLogout}
                    className="fixed top-4 right-4 z-50 p-2 bg-black/50 border border-sky-700/50 text-white rounded-full shadow-lg hover:bg-sky-800 transition duration-300 flex items-center text-sm backdrop-blur-md"
                    title={t('button.logout')}
                >
                    <LogOut className="w-4 h-4 mr-1" />
                    {t('button.logout')}
                </button>
            )}
            {renderContent()}
        </div>
    );
}


export default function App() {
    return (
        <TranslationProvider>
            <AppContent />
        </TranslationProvider>
    );
}