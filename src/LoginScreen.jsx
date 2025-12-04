import React, { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'; 
import { ref, set, serverTimestamp } from 'firebase/database'; 
import { getDbPaths } from './services/firebase.js'; 
import InputField from './components/ui/InputField.jsx';
import { useTranslation } from './context/TranslationContext.jsx'; 

const LoginScreen = ({ isReady, db, auth }) => {
    const { t } = useTranslation(); 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState('login'); 
    const [successMessage, setSuccessMessage] = useState('');

    const isDbReady = !!db;
    
    const submitRoleRequest = async (uid, email) => {
        if (!isDbReady) {
            console.error("DB not ready for role request.");
            return;
        }
        try {
            // 1. Create the request record
            const requestRef = ref(db, `${getDbPaths().userRequests}/${uid}`);
            await set(requestRef, {
                uid: uid,
                email: email,
                requestedRole: 'user', 
                status: 'pending',
                timestamp: serverTimestamp(),
            });

            // 2. Create the initial role entry so they appear in User Admin
            const roleRef = ref(db, `${getDbPaths().userRoles}/${uid}`);
            await set(roleRef, {
                role: 'pending',
                email: email
            });

            setSuccessMessage(t('login.success.register'));
        } catch (e) {
            console.error("Failed to submit role request:", e);
            setSuccessMessage(t('login.success.register_fail'));
        }
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        
        if (!isReady || isLoading) return; 
        
        setIsLoading(true);

        try {
            if (mode === 'login') {
                await signInWithEmailAndPassword(auth, email, password);
            } else { 
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await submitRoleRequest(userCredential.user.uid, userCredential.user.email);
                setMode('login');
            }
        } catch (err) {
            console.error("Auth error:", err);
            let errorMessage = t('login.error.unknown');
            if (err.code === 'auth/invalid-email') errorMessage = t('login.error.invalid_email');
            else if (err.code === 'auth/user-disabled') errorMessage = t('login.error.user_disabled');
            else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') errorMessage = t('login.error.credentials');
            else if (err.code === 'auth/email-already-in-use') { errorMessage = t('login.error.email_in_use'); setMode('login'); }
            else if (err.code === 'auth/weak-password') errorMessage = t('login.error.weak_password');
            else errorMessage = err.message || t('login.error.unknown');
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const isLoginMode = mode === 'login';

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-gray-900">
            
            <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
                
                <h1 className="text-4xl font-extrabold tracking-tight text-blue-900 md:text-5xl mb-2">
                    UManage
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                    {t('login.main_title')}
                </p>

                <div className="w-full rounded-2xl bg-white p-8 shadow-xl border border-gray-200">
                    <h2 className="mb-6 text-center text-xl font-semibold text-gray-800">
                        {isLoginMode ? t('login.card_title.login') : t('login.card_title.register')}
                    </h2>

                    <form onSubmit={handleAuth} className="space-y-6">
                        <InputField 
                            label="Email"
                            name="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="name@company.com"
                        />
                        <InputField 
                            label="Password"
                            name="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />

                        <button
                            type="submit"
                            disabled={isLoading || !isReady}
                            className={`w-full flex justify-center items-center py-3 px-4 border border-transparent text-lg font-semibold rounded-xl text-white shadow-sm transition duration-300 ease-in-out ${
                                isLoading || !isReady
                                    ? 'bg-blue-300 cursor-not-allowed'
                                     : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
                            }`}
                        >
                            {isReady ? (isLoginMode ? t('login.button.login') : t('login.button.register')) : t('login.button.initializing')}
                        </button>
                        
                        {error && (
                             <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm text-center">
                                {error}
                             </div>
                        )}
                        {successMessage && (
                             <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm text-center">
                                {successMessage}
                             </div>
                        )}
                    </form>

                    <div className="mt-6 text-center border-t border-gray-100 pt-4">
                        <button
                            onClick={() => {
                                setMode(isLoginMode ? 'register' : 'login');
                                setError('');
                                setSuccessMessage('');
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium transition"
                        >
                            {isLoginMode ? t('login.toggle.to_register') : t('login.toggle.to_login')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;