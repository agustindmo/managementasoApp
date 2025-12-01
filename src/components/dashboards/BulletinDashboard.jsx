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
    })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); 
};

const RenderContent = ({ content }) => {
    if (!content) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);

    return (
        <p className="text-sm text-slate-600 whitespace-pre-wrap">
            {parts.map((part, index) => {
                if (part.match(urlRegex)) {
                    return (
                        <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                            {part}
                        </a>
                    );
                }
                return part; 
            })}
        </p>
    );
};


const AnnouncementCard = ({ item, t, isAdmin, onEdit, onDelete }) => {
    const { title, content, visibility, createdAt } = item;
    const formattedDate = createdAt ? new Date(createdAt).toLocaleString() : t('live_feed.invalid_date');
    const visibilityLabel = t(`event.visibility.${visibility}`) || visibility;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all">
            <div className="p-4 bg-slate-50 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-slate-500">{formattedDate}</span>
                    <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{visibilityLabel}</span>
                </div>
            </div>
            
            <div className="p-5 space-y-3 flex-grow">
                <RenderContent content={content} />
            </div>
            
            {isAdmin && (
                <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex justify-end space-x-2">
                    <button onClick={onEdit} className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition" title="Edit">
                        <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={onDelete} className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition" title="Delete">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

const BulletinDashboard = ({ userId, db, role }) => { 
    const { t } = useTranslation();
    const [view, setView] = useState('cards'); 
    const [activeRecord, setActiveRecord] = useState(null); 
    const [announcements, setAnnouncements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const isAdmin = role === 'admin';
    
    useEffect(() => {
        if (!db) return;
        const dataRef = ref(db, getDbPaths().announcements);
        const unsubscribe = onValue(dataRef, (snapshot) => {
            try { setAnnouncements(snapshotToArray(snapshot)); } 
            catch (e) { console.error("Error processing announcements snapshot:", e); } 
            finally { setIsLoading(false); }
        }, (err) => { console.error("Announcements subscription error:", err); setIsLoading(false); });
        return () => unsubscribe();
    }, [db]);

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
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="ml-3 text-slate-500">{t('bulletin.loading')}</p>
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
                <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                    <Megaphone className="w-8 h-8 mr-3 text-blue-600" />
                    {t('sidebar.bulletin_board')}
                </h1>
                {isAdmin && (
                    <button
                        onClick={() => handleOpenForm(null)}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-md"
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
                <div className="text-center text-slate-400 p-12 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                    <p>{t('bulletin.no_items')}</p>
                </div>
            )}
        </div>
    );
};

export default BulletinDashboard;