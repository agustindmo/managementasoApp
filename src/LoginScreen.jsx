import React, { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'; 
import { ref, set, serverTimestamp } from 'firebase/database'; 
import { getDbPaths } from './services/firebase.js'; 
import InputField from './components/ui/InputField.jsx';
// *** CORRECCIÓN: La ruta correcta es ./ y no ../ ***
import { useTranslation } from './context/TranslationContext.jsx'; 

const LoginScreen = ({ isReady, db, auth }) => {
    const { t } = useTranslation(); 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState('login'); // 'login' or 'register'
    const [successMessage, setSuccessMessage] = useState('');

    const isDbReady = !!db;
    
    const submitRoleRequest = async (uid, email) => {
        if (!isDbReady) {
            console.error("DB not ready for role request.");
            return;
        }
        
        try {
            const requestRef = ref(db, `${getDbPaths().userRequests}/${uid}`);
            await set(requestRef, {
                uid: uid,
                email: email,
                requestedRole: 'user', 
                status: 'pending',
                timestamp: serverTimestamp(),
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
            if (err.code === 'auth/invalid-email') {
                errorMessage = t('login.error.invalid_email');
            } else if (err.code === 'auth/user-disabled') {
                errorMessage = t('login.error.user_disabled');
            } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                errorMessage = t('login.error.credentials');
            } else if (err.code === 'auth/email-already-in-use') {
                 errorMessage = t('login.error.email_in_use');
                 setMode('login'); 
            } else if (err.code === 'auth/weak-password') {
                errorMessage = t('login.error.weak_password');
            } else {
                 errorMessage = err.message || t('login.error.unknown');
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const isLoginMode = mode === 'login';

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-start pt-24 sm:pt-32 overflow-hidden p-4 text-white">
            {/* --- Fondo --- */}
            <div 
                className="absolute inset-0 z-0 h-full w-full bg-cover bg-center"
                style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1556761175-59736f82303a?q=80&w=2070&auto=format&fit=crop)' }}
            >
                {/* Overlay oscuro para legibilidad */}
                <div className="absolute inset-0 z-10 bg-linear-to-br from-sky-950/90 via-sky-900/80 to-black/90"></div>
            </div>

            {/* --- Header (Logo) --- */}
            <header className="absolute top-0 left-0 z-20 w-full p-6">
                <div className="text-2xl font-bold tracking-wider text-white">
                    UManage
                </div>
            </header>

            {/* --- Contenedor Principal (Centrado) --- */}
            <div className="relative z-10 flex w-full max-w-lg flex-col items-center text-center">
                
                {/* --- Copywriting --- */}
                <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
                    {t('login.main_title')} 
                </h1>
                <p className="mt-4 text-lg text-sky-100">
                    {t('login.main_subtitle')} 
                </p>

                {/* --- Formulario (Tarjeta semitransparente) --- */}
                <div className="mt-8 w-full max-w-md rounded-2xl border border-sky-700/50 bg-black/40 p-8 shadow-2xl backdrop-blur-lg">
                    <p className="mb-6 text-center text-lg font-medium text-sky-100">
                        {isLoginMode ? t('login.card_title.login') : t('login.card_title.register')}
                    </p>

                    <form onSubmit={handleAuth} className="space-y-6">
                        <InputField 
                            label="Email"
                            name="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <InputField 
                            label="Password"
                            name="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <button
                            type="submit"
                            disabled={isLoading || !isReady}
                            className={`w-full flex justify-center items-center py-3 px-4 border border-transparent text-lg font-semibold rounded-xl text-white shadow-md transition duration-300 ease-in-out ${
                                isLoading || !isReady
                                    ? 'bg-sky-400 cursor-not-allowed opacity-70'
                                     : 'bg-sky-600 hover:bg-sky-700 hover:shadow-lg'
                            }`}
                        >
                            {isReady ? (isLoginMode ? t('login.button.login') : t('login.button.register')) : t('login.button.initializing')}
                        </button>
                        
                        {error && (
                             <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg text-sm text-center">
                                {error}
                             </div>
                        )}
                        {successMessage && (
                             <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-lg text-sm text-center">
                                {successMessage}
                             </div>
                        )}
                    </form>

                    {/* --- Link para cambiar de modo --- */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => {
                                setMode(isLoginMode ? 'register' : 'login');
                                setError('');
                                setSuccessMessage('');
                            }}
                            className="text-sm text-sky-300 hover:text-sky-100 font-medium transition"
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