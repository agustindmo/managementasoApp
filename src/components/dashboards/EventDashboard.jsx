// src/components/dashboards/EventDashboard.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { Calendar, Loader2, PlusCircle, Users, Clock, Tag, Link } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import { useTranslation } from '../../context/TranslationContext.jsx';
import CardTitle from '../ui/CardTitle.jsx';
import EventForm from '../forms/EventForm.jsx'; // Importar el formulario

const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({
        id: key,
        ...val[key],
    }));
};

// --- Componente de Tarjeta de Evento (ACTUALIZADO) ---
const EventCard = ({ event, t }) => {
    const { 
        name, 
        startDate, 
        endDate, 
        startTime, 
        endTime, 
        eventType, 
        topics = [], 
        participants = [],
        call_link, // Nuevo
        minute_link // Nuevo
    } = event;

    const formatDate = (date) => {
        try {
            return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
        } catch (e) {
            return date;
        }
    };
    
    const isSameDay = startDate === endDate;
    const dateString = isSameDay 
        ? formatDate(startDate) 
        : `${formatDate(startDate)} - ${formatDate(endDate)}`;

    return (
        <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden flex flex-col">
            <div className="p-4 bg-sky-900/70 border-b border-sky-700/50">
                <h3 className="text-lg font-bold text-white">{name}</h3>
                <span className="text-xs font-medium bg-sky-600 text-white px-2 py-0.5 rounded-full">
                    {/* Traducir el tipo de reunión si es de gobernanza */}
                    {t(`governance.meeting.type.${eventType.toLowerCase()}`) || eventType}
                </span>
            </div>
            
            <div className="p-4 space-y-3 flex-grow">
                <div className="flex items-center text-gray-300">
                    <Calendar className="w-4 h-4 mr-2 text-sky-400" />
                    <span className="text-sm">{dateString}</span>
                </div>
                
                {/* Ocultar horas si no están definidas (para reuniones de gobernanza) */}
                {startTime && endTime && (
                    <div className="flex items-center text-gray-300">
                        <Clock className="w-4 h-4 mr-2 text-sky-400" />
                        <span className="text-sm">{startTime} - {endTime}</span>
                    </div>
                )}
                
                {topics.length > 0 && (
                    <div className="flex items-start">
                        <Tag className="w-4 h-4 mr-2 text-sky-400 mt-0.5" />
                        <div className="flex flex-wrap gap-1">
                            {topics.map(topic => (
                                <span key={topic} className="text-xs bg-gray-700 text-gray-200 px-2 py-0.5 rounded-full">{topic}</span>
                            ))}
                        </div>
                    </div>
                )}
                
                {participants.length > 0 && (
                    <div className="flex items-start">
                        <Users className="w-4 h-4 mr-2 text-sky-400 mt-0.5" />
                        <div className="flex flex-wrap gap-1">
                            {participants.map(p => (
                                <span key={p.id || p.name} className="text-xs bg-sky-800 text-sky-200 px-2 py-0.5 rounded-full" title={p.role}>{p.name}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            {/* --- NUEVO: Mostrar Enlaces de Reunión --- */}
            {(call_link || minute_link) && (
                <div className="p-4 border-t border-sky-800/50 space-y-2">
                    {call_link && (
                         <a href={call_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition flex items-center text-sm">
                            <Link className="w-4 h-4 mr-1" /> {t('governance.meeting.col.call_link')}
                        </a>
                    )}
                    {minute_link && (
                         <a href={minute_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition flex items-center text-sm">
                            <Link className="w-4 h-4 mr-1" /> {t('governance.meeting.col.minute_link')}
                        </a>
                    )}
                </div>
            )}
        </div>
    );
};

// --- Componente Principal del Dashboard (ACTUALIZADO) ---
const EventDashboard = ({ userId, db, role }) => { 
    const { t } = useTranslation();
    const [view, setView] = useState('cards'); // 'cards' or 'form'
    const [activeRecord, setActiveRecord] = useState(null); 
    const [events, setEvents] = useState([]);
    const [govMeetings, setGovMeetings] = useState([]); // --- NUEVO ---
    const [isLoading, setIsLoading] = useState(true);
    
    const isAdmin = role === 'admin';
    
    // 1. Cargar Eventos Y Reuniones de Gobernanza
    useEffect(() => {
        if (!db) return;
        
        let eventsLoaded = false;
        let meetingsLoaded = false;
        const checkDone = () => {
            if (eventsLoaded && meetingsLoaded) setIsLoading(false);
        };

        const eventsRef = ref(db, getDbPaths().events);
        const unsubEvents = onValue(eventsRef, (snapshot) => {
            try { setEvents(snapshotToArray(snapshot)); } 
            catch (e) { console.error("Error processing events snapshot:", e); }
            finally { eventsLoaded = true; checkDone(); }
        }, (err) => { console.error("Events subscription error:", err); eventsLoaded = true; checkDone(); });
        
        const meetingsRef = ref(db, getDbPaths().governanceMeetings);
        const unsubMeetings = onValue(meetingsRef, (snapshot) => {
            try { setGovMeetings(snapshotToArray(snapshot)); } 
            catch (e) { console.error("Error processing governance meetings snapshot:", e); }
            finally { meetingsLoaded = true; checkDone(); }
        }, (err) => { console.error("Governance meetings subscription error:", err); meetingsLoaded = true; checkDone(); });

        return () => {
            unsubEvents();
            unsubMeetings();
        };
    }, [db]);

    // 2. Unir y Filtrar Eventos por Visibilidad
    const visibleEvents = useMemo(() => {
        // Normalizar eventos
        const normalizedEvents = events.map(e => ({
            ...e, 
            sortDate: e.startDate,
        }));
        
        // Normalizar reuniones de gobernanza
        const normalizedMeetings = govMeetings.map(m => ({
            id: m.id,
            name: m.name,
            startDate: m.date,
            endDate: m.date,
            startTime: null, // No tienen hora
            endTime: null,
            eventType: m.type, // "Board", "Committee", "Assembly"
            topics: [],
            participants: [],
            visibility: m.type, // Usar el tipo para la visibilidad
            call_link: m.call_link,
            minute_link: m.minute_link,
            sortDate: m.date,
        }));
        
        const allItems = [...normalizedEvents, ...normalizedMeetings];

        // Filtrar por rol
        const filtered = allItems.filter(item => {
            if (isAdmin) return true;
            
            const visibility = item.visibility; // 'all', 'directors', 'users', 'Assembly', 'Board', 'Committee'
            
            if (role === 'director' || role === 'directorinvitee') {
                return ['all', 'directors', 'Assembly', 'Board', 'Committee'].includes(visibility);
            }
            if (role === 'user' || role === 'userinvitee') {
                // Usuarios solo ven 'all', 'users', y 'Assembly'
                return ['all', 'users', 'Assembly'].includes(visibility);
            }
            return false;
        });
        
        // Ordenar por fecha más reciente
        return filtered.sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate));

    }, [events, govMeetings, role, isAdmin]);


    const handleOpenForm = (record = null) => {
        if (!isAdmin) return; // Solo admins pueden abrir el formulario
        setActiveRecord(record);
        setView('form');
    };

    const handleCloseForm = () => {
        setActiveRecord(null);
        setView('cards'); // Volver a la vista de tarjetas
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="ml-3 text-sky-200">{t('event.loading')}</p>
            </div>
        );
    }
    
    if (view === 'form') {
        return (
             <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <EventForm
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
                    <Calendar className="w-8 h-8 mr-3 text-sky-400" />
                    {t('sidebar.events')}
                </h1>
                {isAdmin && (
                    <button
                        onClick={() => handleOpenForm(null)}
                        className="flex items-center space-x-2 bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700 transition shadow-md"
                    >
                        <PlusCircle className="w-4 h-4" />
                        <span>{t('event.form.add_title')}</span>
                    </button>
                )}
            </div>
            
            {visibleEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleEvents.map(event => (
                        <EventCard key={event.id} event={event} t={t} />
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-500 p-8 bg-black/30 rounded-lg">
                    <p>{t('event.no_events')}</p>
                </div>
            )}
        </div>
    );
};

export default EventDashboard;