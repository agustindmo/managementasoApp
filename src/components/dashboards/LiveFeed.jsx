import React, { useState, useEffect } from 'react';
import { onSnapshot, collection, query } from 'firebase/firestore';
import { getDbPaths } from '../../services/firebase.js';

// LiveFeed now receives 'db' as a prop
const LiveFeed = ({ db }) => {
    const [recentItems, setRecentItems] = useState([]);
    const [error, setError] = useState(null);

    // Function to safely format Firestore timestamp objects
    const formatTime = (timestamp) => {
        if (!timestamp) return 'N/A';
        try {
            // Handle Firestore Timestamp object or plain object
            const date = timestamp.toDate ? timestamp.toDate() : (timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date());
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            console.error("Error formatting time:", e);
            return 'Invalid Date';
        }
    };

    useEffect(() => {
        // Essential check: Only subscribe if 'db' is available
        if (!db) {
            setRecentItems([]);
            return;
        }
        
        setError(null); // Reset error state on connection attempt

        const agendaRef = collection(db, getDbPaths().agenda);
        const milestonesRef = collection(db, getDbPaths().milestones);

        // Utility function to sort and update state
        const updateState = (newItems, type) => {
            setRecentItems(prev => {
                // Remove old items of the current type and add new ones
                const combined = [
                    ...prev.filter(i => i.type !== type), 
                    ...newItems
                ];
                
                // Sort the entire combined list by creation/achievement timestamp
                return combined.sort((a, b) => {
                    const aTime = (a.createdAt || a.achievedAt)?.seconds || 0;
                    const bTime = (b.createdAt || b.achievedAt)?.seconds || 0;
                    return bTime - aTime;
                }).slice(0, 10);
            });
        };

        // Fetch Agenda Items
        const qAgenda = query(agendaRef);
        const unsubAgenda = onSnapshot(qAgenda, (snapshot) => {
            try {
                const items = snapshot.docs.map(doc => ({ 
                    id: doc.id, 
                    type: 'Agenda', 
                    title: doc.data().nombre || doc.data().title || 'Untitled Agenda Item', 
                    createdAt: doc.data().createdAt 
                }));
                updateState(items, 'Agenda');
            } catch (e) {
                setError("Failed to process Agenda snapshot data.");
                console.error("Agenda Snapshot Processing Error:", e);
            }
        }, (e) => {
            setError("Failed to subscribe to Agenda collection.");
            console.error("Agenda Subscription Error:", e);
        });

        // Fetch Milestones
        const qMilestones = query(milestonesRef);
        const unsubMilestones = onSnapshot(qMilestones, (snapshot) => {
            try {
                const items = snapshot.docs.map(doc => ({ 
                    id: doc.id, 
                    type: 'Milestone', 
                    title: doc.data().nombre || doc.data().title || 'Untitled Milestone Item', 
                    achievedAt: doc.data().achievedAt 
                }));
                updateState(items, 'Milestone');
            } catch (e) {
                setError("Failed to process Milestone snapshot data.");
                console.error("Milestone Snapshot Processing Error:", e);
            }
        }, (e) => {
            setError("Failed to subscribe to Milestones collection.");
            console.error("Milestones Subscription Error:", e);
        });

        return () => {
            unsubAgenda();
            unsubMilestones();
        };
    }, [db]); // Reruns subscription only when db instance changes

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                <strong className="font-bold">Data Error: </strong>
                <span className="block sm:inline">{error} Check console for details.</span>
            </div>
        );
    }
    
    return (
        <div className="bg-white rounded-xl shadow p-4">
            {recentItems.length === 0 ? (
                <p className="text-gray-500 text-center">No recent items added yet.</p>
            ) : (
                <ul className="space-y-2">
                    {recentItems.slice(0, 5).map(item => (
                        <li key={item.id} className="p-3 border-b border-gray-100 last:border-b-0 flex justify-between items-center">
                            <span className={`font-semibold text-sm ${item.type === 'Agenda' ? 'text-amber-600' : 'text-green-600'}`}>
                                [{item.type}]
                            </span>
                            <span className="text-gray-700 flex-1 ml-3 truncate" title={item.title}>
                                {item.title}
                            </span>
                            <span className="text-xs text-gray-400">
                                {item.type === 'Agenda' ? formatTime(item.createdAt) : formatTime(item.achievedAt)}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default LiveFeed;