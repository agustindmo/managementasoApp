// src/components/tables/ActivityLogTable.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { PlusCircle, Loader2, Edit, Trash2, Link, Clock, ArrowUp, ArrowDown, Download } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import CardTitle from '../ui/CardTitle.jsx';
import { 
    ACTIVITY_COLUMN_OPTIONS_MAP, 
    ALL_FILTER_OPTION
} from '../../utils/constants.js';
import { useTranslation } from '../../context/TranslationContext.jsx'; 
import * as XLSX from 'xlsx'; 

// Define Table Structure and MetaData
const ACTIVITY_COLUMNS = [
    { labelKey: "activity.col.date", key: "date", sortable: true, filterable: true, type: 'string' },
    { labelKey: "activity.col.type", key: "activityType", sortable: true, filterable: true, optionsKey: 'activityType', type: 'string' },
    // --- MODIFICADO: Tipo ahora es 'array' ---
    { labelKey: "activity.col.institution", key: "institution", sortable: true, filterable: true, type: 'array' },
    { labelKey: "activity.col.tema", key: "tema", sortable: true, filterable: true, type: 'array' },
    { labelKey: "activity.col.mode", key: "meetingMode", sortable: true, filterable: true, optionsKey: 'meetingMode', type: 'string' },
    { labelKey: "activity.col.time", key: "timeSpent", sortable: true, filterable: true, type: 'number' },
    { labelKey: "activity.col.participants", key: "participants", sortable: false, filterable: false, type: 'string' },
    { labelKey: "activity.col.link", key: "documentLink", sortable: false, filterable: false, type: 'string' },
    { labelKey: "activity.col.actions", key: "actions", sortable: false, filterable: false, type: 'none' },
];

const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({
        id: key,
        ...val[key],
    }));
};

// --- MODIFICADO: Renderizado de Fila de Tabla ---
const ActivityTableRow = ({ item, onEdit, onDelete }) => {
    const isMeeting = item.activityType === 'meeting';
    
    // Fallback for non-meeting fields
    const meetingMode = isMeeting ? (item.meetingMode || 'N/A') : 'N/A';
    const timeSpent = isMeeting ? (item.timeSpent > 0 ? `${item.timeSpent} min` : '0 min') : 'N/A';
    const participants = isMeeting ? (item.participants || 'N/A') : 'N/A';

    // --- MODIFICADO: Unir arrays para mostrar ---
    const institutions = (Array.isArray(item.institution) ? item.institution : [item.institution || 'N/A']).join(', ');
    const temas = (Array.isArray(item.tema) ? item.tema : [item.tema || 'N/A']).join(', ');
    
    return (
        <tr className="hover:bg-sky-900/60 transition-colors">
            <td className="px-6 py-2 text-sm font-medium text-white whitespace-nowrap">{item.date}</td>
            <td className="px-6 py-2 text-sm text-gray-400 capitalize">{item.activityType}</td>
            <td className="px-6 py-2 text-sm text-gray-400 truncate max-w-[150px]" title={institutions}>{institutions}</td>
            <td className="px-6 py-2 text-sm text-gray-400 truncate max-w-[150px]" title={temas}>{temas}</td>
            <td className={`px-6 py-2 text-sm ${isMeeting ? 'text-sky-400' : 'text-gray-600'}`}>{meetingMode}</td>
            <td className="px-6 py-2 text-sm text-gray-400">{timeSpent}</td>
            <td className="px-6 py-2 text-sm text-gray-400 truncate max-w-[120px]" title={participants}>{participants}</td>
            
            <td className="px-6 py-2 text-sm text-gray-400 whitespace-nowrap">
                {item.documentLink ? (
                    <a 
                        href={item.documentLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition flex items-center"
                        title="View Document Link"
                    >
                        <Link className="w-4 h-4 mr-1" /> Link
                    </a>
                ) : 'N/A'}
            </td>
            
            <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex space-x-2 justify-end">
                    <button
                        onClick={() => onEdit(item)}
                        className="text-sky-400 hover:text-sky-200 p-1 rounded-full hover:bg-sky-800/50 transition"
                        title="Edit Record"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(item.id)}
                        className="text-red-400 hover:text-red-200 p-1 rounded-full hover:bg-red-800/50 transition"
                        title="Delete Record"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
};

// Helper component for table headers with filtering and sorting
const TableHeaderWithControls = ({ column, currentSort, onSortChange, onFilterChange, filterOptions, currentFilters, dataItems, t }) => {
    const label = t(column.labelKey); 

    if (column.key === 'actions') {
        return (
            <th key={column.key} className="px-6 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider">
                {label}
            </th>
        );
    }
    
    const isSorted = currentSort.key === column.key;
    const sortIcon = isSorted ? (currentSort.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />) : null;
    
    let options = [];
    if (column.filterable) {
        if (column.optionsKey) {
            options = filterOptions[column.optionsKey] || [];
        } 
        // --- MODIFICADO: No crear opciones únicas para campos de array ---
        else if (column.type !== 'array') { 
            const uniqueValues = [...new Set(dataItems.map(item => String(item[column.key] || 'N/A')))];
            options = uniqueValues.filter(v => v !== 'N/A' && v !== '').sort();
        }
    }
    
    // --- MODIFICADO: 'institution' y 'tema' son tipo 'array', usar text input ---
    const isTextInputFilter = !column.optionsKey || column.type === 'array';
    
    return (
        <th 
            key={column.key} 
            className="px-4 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider whitespace-nowrap"
        >
            <div className="flex flex-col space-y-1">
                <div className="flex items-center">
                    <span 
                        className={`cursor-pointer font-medium ${column.sortable ? 'hover:text-white transition-colors' : ''}`}
                        onClick={() => column.sortable && onSortChange(column.key)}
                    >
                        {label}
                    </span>
                    {sortIcon}
                </div>
                
                {column.filterable && (
                    isTextInputFilter ? (
                        <input
                            type="text"
                            placeholder={`${t('policy.search')} ${label}`}
                            value={currentFilters[column.key] || ''}
                            onChange={(e) => onFilterChange(column.key, e.target.value)}
                            className="text-xs p-1 border border-sky-700 bg-sky-950/50 text-white rounded-lg focus:ring-sky-500 focus:border-sky-500 min-w-[80px]"
                        />
                    ) : (
                        <select
                            value={currentFilters[column.key] || ALL_FILTER_OPTION}
                            onChange={(e) => onFilterChange(column.key, e.target.value)}
                            className="text-xs p-1 border border-sky-700 bg-sky-950/50 text-white rounded-lg focus:ring-sky-500 focus:border-sky-500 min-w-[80px]"
                        >
                            <option value={ALL_FILTER_OPTION} className="bg-sky-900">{ALL_FILTER_OPTION}</option>
                            {options.map(option => (
                                <option key={option} value={option} className="bg-sky-900">{option}</option>
                            ))}
                        </select>
                    )
                )}
            </div>
        </th>
    );
};


const ActivityLogTable = ({ db, onOpenForm }) => {
    const { t } = useTranslation(); 
    const [activityItems, setActivityItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ key: 'date', direction: 'desc' }); 

    // 1. Data Fetching and Subscription
    useEffect(() => {
        if (!db) {
            setIsLoading(true);
            return;
        }
        
        setIsLoading(true); 

        const activitiesRef = ref(db, getDbPaths().activities);
        
        const unsubscribe = onValue(activitiesRef, (snapshot) => {
            try {
                const items = snapshotToArray(snapshot);
                setActivityItems(items);
                setIsLoading(false);
            } catch (e) {
                console.error("Error processing Activity snapshot:", e);
                setIsLoading(false);
            }
        }, (error) => {
             console.error("Activity Subscription Error:", error);
             setIsLoading(false);
        });
        
        return () => {
            console.log("Cleaning up ActivityLogTable subscriptions.");
            unsubscribe();
        };
    }, [db]);


    // 2. Data Handlers (Delete)
    const handleDelete = async (id) => {
        if (db && window.confirm(t('policy.confirm_delete'))) { 
            try {
                const itemRef = ref(db, `${getDbPaths().activities}/${id}`);
                await remove(itemRef); 
            } catch (e) {
                console.error("Error deleting activity document:", e);
            }
        }
    };
    

    // 3. Data Filter/Sort Logic (--- MODIFICADO ---)
    const filteredAndSortedItems = useMemo(() => {
        let finalData = activityItems.filter(item => {
            for (const column of ACTIVITY_COLUMNS) {
                const key = column.key;
                const filterValue = filters[key];
                
                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;

                let itemValue = item[key];
                const targetValue = filterValue.toLowerCase();

                // --- MODIFICADO: Lógica de filtro para 'array' ---
                if (column.type === 'array') {
                    itemValue = (Array.isArray(itemValue) ? itemValue : [itemValue || '']).join(', ').toLowerCase();
                    if (!itemValue.includes(targetValue)) return false;
                }
                // --- Lógica existente ---
                else if (column.optionsKey) { 
                    if (String(itemValue) !== filterValue) return false;
                } else {
                    if (!String(itemValue || '').toLowerCase().includes(targetValue)) return false;
                }
            }
            return true;
        });

        if (sort.key) {
            finalData.sort((a, b) => {
                const column = ACTIVITY_COLUMNS.find(c => c.key === sort.key);
                let aValue = a[sort.key];
                let bValue = b[sort.key];

                // --- MODIFICADO: Unir arrays para ordenar ---
                if (column.type === 'array') {
                    aValue = (Array.isArray(aValue) ? aValue : [aValue || '']).join(', ');
                    bValue = (Array.isArray(bValue) ? bValue : [bValue || '']).join(', ');
                } else {
                    aValue = aValue || (column?.type === 'number' ? -Infinity : '');
                    bValue = bValue || (column?.type === 'number' ? -Infinity : '');
                }
                
                if (column?.type === 'number') {
                    return (sort.direction === 'asc' ? 1 : -1) * (aValue - bValue);
                } else {
                    return (sort.direction === 'asc' ? 1 : -1) * String(aValue).localeCompare(String(bValue));
                }
            });
        }
        return finalData;
    }, [activityItems, filters, sort]);


    const handleSortChange = (key) => {
        setSort(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // TAREA 3: Nueva función de descarga XLSX (--- MODIFICADO ---)
    const handleDownloadXLSX = () => {
        const data = filteredAndSortedItems;
        const columns = ACTIVITY_COLUMNS;
        const filename = 'Activity_Log.xlsx';

        if (data.length === 0) {
            alert(t('policy.no_records'));
            return;
        }

        const exportData = data.map(item => {
            let row = {};
            exportColumns.forEach(col => {
                const header = t(col.labelKey); // Usar la etiqueta traducida como clave
                let value = item[col.key] || '';
                
                // --- MODIFICADO: Unir arrays ---
                if (col.key === 'institution' || col.key === 'tema') {
                    value = (Array.isArray(value) ? value : [value]).join('; ');
                }
                // Limpiar datos N/A para campos de 'meeting'
                else if (col.key === 'timeSpent' && item.activityType !== 'meeting') {
                    value = 'N/A';
                } else if (col.key === 'meetingMode' && item.activityType !== 'meeting') {
                    value = 'N/A';
                } else if (col.key === 'participants' && item.activityType !== 'meeting') {
                    value = 'N/A';
                }

                row[header] = value;
            });
            return row;
        });
        
        const exportColumns = columns.filter(col => col.key !== 'actions');
        
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data'); 

        XLSX.writeFile(wb, filename);
    };


    // 4. Render Logic
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
                <p className="ml-3 text-sky-200">{t('activity.loading_records')}</p>
            </div>
        );
    }
    
    return (
        <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
            <div className="p-4 flex justify-between items-center bg-sky-900/70 border-b border-sky-700/50">
                <h3 className="text-lg font-semibold text-white">{t('activity.records_title')} ({filteredAndSortedItems.length} items)</h3>
                <div className="flex space-x-2">
                    <button
                        onClick={handleDownloadXLSX}
                        className="flex items-center space-x-2 bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition shadow-md"
                        title={t('activity.download_xlsx')} 
                    >
                        <Download className="w-4 h-4" />
                        <span>{t('activity.download_xlsx')}</span> 
                    </button>
                    <button
                        onClick={() => onOpenForm(null)} // --- MODIFICADO: onOpenForm ahora solo necesita 1 argumento ---
                        className="flex items-center space-x-2 bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700 transition shadow-md"
                    >
                        <PlusCircle className="w-4 h-4" />
                        <span>{t('activity.add_new')}</span>
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-sky-800/50">
                    <thead className="bg-sky-900/70">
                        <tr>
                            {ACTIVITY_COLUMNS.map(column => (
                                <TableHeaderWithControls
                                    key={column.key}
                                    column={column}
                                    currentSort={sort}
                                    onSortChange={handleSortChange}
                                    onFilterChange={handleFilterChange}
                                    filterOptions={ACTIVITY_COLUMN_OPTIONS_MAP}
                                    currentFilters={filters}
                                    dataItems={activityItems} 
                                    t={t} 
                                />
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-sky-950/50 divide-y divide-sky-800/50">
                        {filteredAndSortedItems.length > 0 ? (
                            filteredAndSortedItems.map(item => (
                                <ActivityTableRow
                                    key={item.id}
                                    item={item}
                                    onEdit={() => onOpenForm(item)} // --- MODIFICADO: onOpenForm ahora solo necesita 1 argumento ---
                                    onDelete={handleDelete}
                                />
                            ))
                        ) : (
                            <tr><td colSpan={ACTIVITY_COLUMNS.length} className="px-6 py-4 text-center text-gray-500">{t('activity.no_records')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ActivityLogTable;