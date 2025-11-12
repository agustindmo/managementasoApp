// src/components/dashboards/EventDashboard.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { Calendar, Loader2, PlusCircle, Users, Clock, Tag, Link } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import { useTranslation } from '../../context/TranslationContext.jsx';
import CardTitle from '../ui/CardTitle.jsx';
import EventForm from '../forms/EventForm.jsx';
import SelectField from '../ui/SelectField.jsx'; 
// Assuming constants from user's project
const ALL_YEAR_FILTER = 'ALL';
const ANO_OPTIONS = ['2023', '2024', '2025']; // Placeholder/Example, use actual options

// --- Date Utility Functions (REPLACING Moment.js) ---

// Helper to normalize a date string to a Date object at start of day
const normalizeDate = (dateString) => {
    const d = new Date(dateString);
    d.setHours(0, 0, 0, 0); // Set to start of day
    return d;
};

// Checks if dateA is the same as or after dateB
const isSameOrAfter = (dateA, dateB) => {
    return normalizeDate(dateA).getTime() >= normalizeDate(dateB).getTime();
};

// Calculates the end of the current week (Sunday)
const getEndOfWeek = (date) => {
    const d = normalizeDate(date);
    const day = d.getDay(); // 0 = Sunday, 6 = Saturday
    const diff = d.getDate() + (6 - day); // Add days until Saturday (6) or subtract until Sunday (0)
    d.setDate(diff);
    return d;
};

// Calculates the end of the current month
const getEndOfMonth = (date) => {
    const d = normalizeDate(date);
    d.setMonth(d.getMonth() + 1, 0); // Set to the last day of the current month
    return d;
};

// Calculates the end of the current year
const getEndOfYear = (date) => {
    const d = normalizeDate(date);
    d.setMonth(11, 31); // Set to December 31st
    return d;
};

// --- Component Helpers ---
const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({
        id: key,
        ...val[key],
    }));
};

// --- Componente de Tarjeta de Evento (MODIFIED: Removed minute_link display) ---
const EventCard = ({ event, t, isPast = false }) => {
    const { 
        name, 
        startDate, 
        endDate, 
        startTime, 
        endTime, 
        eventType, 
        topics = [], 
        participants = [],
        call_link, 
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

    const statusColor = isPast ? 'text-gray-400' : 'text-green-400';

    return (
        <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden flex flex-col">
            <div className="p-4 bg-sky-900/70 border-b border-sky-700/50">
                <h3 className={`text-lg font-bold ${statusColor}`}>{name}</h3>
                <span className="text-xs font-medium bg-sky-600 text-white px-2 py-0.5 rounded-full">
                    {t(`governance.meeting.type.${eventType.toLowerCase()}`) || eventType}
                </span>
            </div>
            
            <div className="p-4 space-y-3 flex-grow">
                <div className="flex items-center text-gray-300">
                    <Calendar className="w-4 h-4 mr-2 text-sky-400" />
                    <span className="text-sm">{dateString} at {startTime || t('event.no_time')}</span>
                </div>
                
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
            
            {/* --- MODIFIED: ONLY SHOW CALL LINK (minute_link display removed) --- */}
            {(call_link) && (
                <div className="p-4 border-t border-sky-800/50 space-y-2">
                    {call_link && (
                         <a href={call_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition flex items-center text-sm">
                            <Link className="w-4 h-4 mr-1" /> {t('governance.meeting.col.call_link') || 'Call Link'}
                        </a>
                    )}
                </div>
            )}
        </div>
    );
};

// --- Componente Principal del Dashboard (FILTERS ADDED) ---
const EventDashboard = ({ userId, db, role }) => { 
    const { t } = useTranslation();
    const [view, setView] = useState('cards'); // 'cards' or 'form'
    const [activeRecord, setActiveRecord] = useState(null); 
    const [events, setEvents] = useState([]);
    const [govMeetings, setGovMeetings] = useState([]); 
    const [isLoading, setIsLoading] = useState(true);
    
    // NEW FILTER STATES
    const [yearFilter, setYearFilter] = useState(ALL_YEAR_FILTER);
    const [timeScope, setTimeScope] = useState('upcoming'); // week, month, year, upcoming
    
    const isAdmin = role === 'admin';
    
    // 1. Cargar Eventos Y Reuniones de Gobernanza (unchanged)
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

    // 2. Unir, Filtrar por Visibilidad, SEPARAR por Tiempo, y Aplicar Filtros de Scope
    const { upcomingEvents, pastEvents } = useMemo(() => {
        const today = normalizeDate(new Date());

        // 2a. Unir y Filtrar por Visibilidad (Existing Logic)
        const normalizedEvents = events.map(e => ({
            ...e, 
            sortDate: e.startDate,
        }));
        const normalizedMeetings = govMeetings.map(m => ({
            id: m.id, name: m.name, startDate: m.date, endDate: m.date,
            startTime: null, endTime: null, eventType: m.type, 
            topics: [], participants: [], visibility: m.type, 
            call_link: m.call_link, minute_link: m.minute_link, sortDate: m.date,
        }));
        
        let allItems = [...normalizedEvents, ...normalizedMeetings];

        // Filter by role (Existing Logic)
        allItems = allItems.filter(item => {
            if (isAdmin) return true;
            const visibility = item.visibility;
            if (role === 'director' || role === 'directorinvitee') {
                return ['all', 'directors', 'Assembly', 'Board', 'Committee'].includes(visibility);
            }
            if (role === 'user' || role === 'userinvitee') {
                return ['all', 'users', 'Assembly'].includes(visibility);
            }
            return false;
        });

        // 2b. Apply Year Filter
        if (yearFilter !== ALL_YEAR_FILTER) {
            allItems = allItems.filter(item => item.sortDate && new Date(item.sortDate).getFullYear().toString() === yearFilter);
        }

        // 2c. Separate Upcoming and Past Events
        const upcoming = allItems.filter(item => isSameOrAfter(item.sortDate, today));
        const past = allItems.filter(item => !isSameOrAfter(item.sortDate, today));

        // 2d. Apply Time Scope Filter to UPCOMING events only
        let scopedUpcoming = upcoming;
        const todayString = new Date().toISOString().slice(0, 10);
        
        if (timeScope === 'week') {
            const endOfWeek = getEndOfWeek(todayString);
            scopedUpcoming = upcoming.filter(e => isSameOrAfter(endOfWeek, e.sortDate));
        } else if (timeScope === 'month') {
            const endOfMonth = getEndOfMonth(todayString);
            scopedUpcoming = upcoming.filter(e => isSameOrAfter(endOfMonth, e.sortDate));
        } else if (timeScope === 'year') {
            const endOfYear = getEndOfYear(todayString);
            scopedUpcoming = upcoming.filter(e => isSameOrAfter(endOfYear, e.sortDate));
        }
        // Note: 'upcoming' scope means all future events (default)

        // Sort upcoming ascending, past descending
        const dateSort = (a, b) => normalizeDate(a.sortDate).getTime() - normalizeDate(b.sortDate).getTime();
        const sortedUpcoming = scopedUpcoming.sort(dateSort);
        const sortedPast = past.sort((a, b) => dateSort(b, a)); // Newest past events first

        return { upcomingEvents: sortedUpcoming, pastEvents: sortedPast };

    }, [events, govMeetings, role, isAdmin, yearFilter, timeScope]);


    const handleOpenForm = (record = null) => {
        if (!isAdmin) return; 
        setActiveRecord(record);
        setView('form');
    };

    const handleCloseForm = () => {
        setActiveRecord(null);
        setView('cards'); 
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
                    {t('sidebar.events') || 'Events'}
                </h1>
                {isAdmin && (
                    <button
                        onClick={() => handleOpenForm(null)}
                        className="flex items-center space-x-2 bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700 transition shadow-md"
                    >
                        <PlusCircle className="w-4 h-4" />
                        <span>{t('event.form.add_title') || 'Add Event'}</span>
                    </button>
                )}
            </div>
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
                {/* Time Scope Filter (Week/Month/Year/Upcoming) */}
                <SelectField
                    label={t('event.filter_scope') || 'Filter Scope'}
                    name="timeScope"
                    options={[
                        { value: 'upcoming', label: t('event.scope.all_upcoming') || 'All Upcoming' },
                        { value: 'week', label: t('event.scope.this_week') || 'This Week' },
                        { value: 'month', label: t('event.scope.this_month') || 'This Month' },
                        { value: 'year', label: t('event.scope.this_year') || 'This Year' },
                    ]}
                    value={timeScope}
                    onChange={(e) => setTimeScope(e.target.value)}
                />
                
                {/* Year Filter */}
                <SelectField 
                    label={t('director.filter_year') || 'Filter by Year'}
                    name="yearFilter" 
                    options={[{ value: ALL_YEAR_FILTER, label: t('common.all_years') || 'All Years' }, ...ANO_OPTIONS]}
                    value={yearFilter} 
                    onChange={(e) => setYearFilter(e.target.value)} 
                />
            </div>


            {/* UPCOMING EVENTS LIST */}
            <div className="mb-8">
                <CardTitle title={t('event.upcoming_title') || 'Upcoming Events'} icon={Clock} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                    {upcomingEvents.length > 0 ? (
                        upcomingEvents.map(event => (
                            <EventCard key={event.id} event={event} t={t} isPast={false} />
                        ))
                    ) : (
                        <p className="text-gray-400 md:col-span-3 py-4">{t('event.no_upcoming') || 'No upcoming events match the current filter.'}</p>
                    )}
                </div>
            </div>

            {/* PAST EVENTS LIST */}
            <div>
                <CardTitle title={t('event.past_title') || 'Past Events'} icon={Calendar} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                    {pastEvents.length > 0 ? (
                        pastEvents.map(event => (
                            <EventCard key={event.id} event={event} t={t} isPast={true} />
                        ))
                    ) : (
                        <p className="text-gray-400 md:col-span-3 py-4">{t('event.no_past') || 'No past events found.'}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventDashboard;