// src/components/utils/MailToDirectorsButton.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { Mail, Loader2 } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import { useTranslation } from '../../context/TranslationContext.jsx';

const MailToDirectorsButton = ({ db, subject, body, buttonLabelKey }) => {
    const { t } = useTranslation();
    const [directorEmails, setDirectorEmails] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // 1. Fetch all Director emails
    useEffect(() => {
        if (!db) return;

        const rolesRef = ref(db, getDbPaths().userRoles);

        const unsubscribe = onValue(rolesRef, (snapshot) => {
            try {
                const rolesData = snapshot.val() || {};
                const emails = Object.values(rolesData)
                    .filter(user => user.role === 'director')
                    .map(user => user.email)
                    .filter(email => email); // Remove null/undefined emails
                
                setDirectorEmails(emails);
            } catch (e) {
                console.error("Error fetching director emails:", e);
            } finally {
                setIsLoading(false);
            }
        }, (error) => {
            console.error("Director roles subscription error:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [db]);

    // 2. Build the mailto link
    const mailtoLink = useMemo(() => {
        if (directorEmails.length === 0) return '#';
        
        // Join emails with a comma
        const to = directorEmails.join(',');
        
        // Encode subject and body
        const encodedSubject = encodeURIComponent(subject);
        const encodedBody = encodeURIComponent(body);

        return `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`;
    }, [directorEmails, subject, body]);

    return (
        <a 
            href={mailtoLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center space-x-2 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition duration-300 shadow-md 
                ${isLoading || directorEmails.length === 0 
                    ? 'bg-gray-500 cursor-not-allowed opacity-70' 
                    : 'bg-green-600 hover:bg-green-700'
                }`
            }
            title={isLoading ? t('activity.form.connecting') : directorEmails.length === 0 ? t('email.no_recipients') : t('email.send_update_all')}
            disabled={isLoading || directorEmails.length === 0}
        >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            <span>{t(buttonLabelKey)}</span>
        </a>
    );
};

export default MailToDirectorsButton;