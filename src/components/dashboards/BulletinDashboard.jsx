// src/components/dashboards/BulletinDashboard.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { Megaphone, Loader2, PlusCircle, Trash2, Edit } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import { useTranslation } from '../../context/TranslationContext.jsx';
import AnnouncementForm from '../forms/AnnouncementForm.jsx';

const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({
        id: key,
        ...val[key],
    })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); // Ordenar por más reciente
};

// --- Componente para parsear y renderizar contenido con enlaces ---
const RenderContent = ({ content }) => {
    if (!content) return null;

    // Regex simple para encontrar URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);

    return (
        <p className="text-sm text-gray-300 whitespace-pre-wrap">
            {parts.map((part, index) => {
                if (part.match(urlRegex)) {
                    return (
                        <a 
                            key={index}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 underline"
                        >
                            {part}
                        </a>
                    );
                }
                return part; // Parte de texto normal
            })}
        </p>
    );
};


// --- Componente de Tarjeta de Anuncio ---
const AnnouncementCard = ({ item, t, isAdmin, onEdit, onDelete }) => {
    const { 
        title, 
        content,
        visibility,
        createdAt
    } = item;

    const formattedDate = createdAt ? new Date(createdAt).toLocaleString() : t('live_feed.invalid_date');
    const visibilityLabel = t(`event.visibility.${visibility}`) || visibility;

    return (
        <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden flex flex-col">
            <div className="p-4 bg-sky-900/70 border-b border-sky-700/50">
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-400">{formattedDate}</span>
                    <span className="text-xs font-medium bg-sky-600 text-white px-2 py-0.5 rounded-full">{visibilityLabel}</span>
                </div>
            </div>
            
            <div className="p-4 space-y-3 flex-grow">
                <RenderContent content={content} />
            </div>
            
            {isAdmin && (
                <div className="p-2 border-t border-sky-800/50 bg-black/30 flex justify-end space-x-2">
                    <button
                        onClick={onEdit}
                        className="text-sky-400 hover:text-sky-200 p-1 rounded-full hover:bg-sky-800/50 transition"
                        title={t('activity.form.edit_title')}
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="text-red-400 hover:text-red-200 p-1 rounded-full hover:bg-red-800/50 transition"
                        title={t('admin.reject')}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

// --- Componente Principal del Dashboard ---
const BulletinDashboard = ({ userId, db, role }) => { 
    const { t } = useTranslation();
    const [view, setView] = useState('cards'); // 'cards' or 'form'
    const [activeRecord, setActiveRecord] = useState(null); 
    const [announcements, setAnnouncements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const isAdmin = role === 'admin';
    
    // 1. Cargar Anuncios
    useEffect(() => {
        if (!db) return;
        
        const dataRef = ref(db, getDbPaths().announcements);
        
        const unsubscribe = onValue(dataRef, (snapshot) => {
            try {
                setAnnouncements(snapshotToArray(snapshot));
            } catch (e) {
                console.error("Error processing announcements snapshot:", e);
            } finally {
                setIsLoading(false);
            }
        }, (err) => {
            console.error("Announcements subscription error:", err);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [db]);

    // 2. Filtrar Anuncios por Visibilidad
    const visibleItems = useMemo(() => {
        if (isAdmin) return announcements;
        if (role === 'director' || role === 'directorinvitee') {
            return announcements.filter(e => e.visibility === 'all' || e.visibility === 'directors');
        }
        if (role === 'user' || role === 'userinvitee') {
            return announcements.filter(e => e.visibility === 'all' || e.visibility === 'users');
        }
        return [];
    }, [announcements, role, isAdmin]);

    // Handlers
    const handleOpenForm = (record = null) => {
        if (!isAdmin) return; 
        setActiveRecord(record);
        setView('form');
    };
    const handleCloseForm = () => {
        setActiveRecord(null);
        setView('cards');
    };
     const handleDelete = async (id) => {
        if (db && isAdmin && window.confirm(t('policy.confirm_delete'))) { 
            try {
                const itemRef = ref(db, `${getDbPaths().announcements}/${id}`);
                await remove(itemRef); 
            } catch (e) { console.error("Error deleting announcement:", e); }
        }
    };


    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="ml-3 text-sky-200">{t('bulletin.loading')}</p>
            </div>
        );
    }
    
    if (view === 'form') {
        return (
             <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <AnnouncementForm
                    userId={userId} 
                    db={db} 
                    initialData={activeRecord} 
                    onClose={handleCloseForm}
                    mode={activeRecord ? 'edit' : 'add'}
                    role={role}
                />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-white flex items-center">
                    <Megaphone className="w-8 h-8 mr-3 text-sky-400" />
                    {t('sidebar.bulletin_board')}
                </h1>
                {isAdmin && (
                    <button
                        onClick={() => handleOpenForm(null)}
                        className="flex items-center space-x-2 bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700 transition shadow-md"
                    >
                        <PlusCircle className="w-4 h-4" />
                        <span>{t('bulletin.form.add_title')}</span>
                    </button>
                )}
            </div>
            
            {visibleItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleItems.map(item => (
                        <AnnouncementCard 
                            key={item.id} 
                            item={item} 
                            t={t}
                            isAdmin={isAdmin}
                            onEdit={() => handleOpenForm(item)}
                            onDelete={() => handleDelete(item.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-500 p-8 bg-black/30 rounded-lg">
                    <p>{t('bulletin.no_items')}</p>
                </div>
            )}
        </div>
    );
};

export default BulletinDashboard;