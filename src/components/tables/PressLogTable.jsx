// src/components/tables/PressLogTable.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { Loader2, Megaphone, ArrowUp, ArrowDown, Download, PlusCircle, Edit, Trash2, Link } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import CardTitle from '../ui/CardTitle.jsx';
import { 
    ALL_FILTER_OPTION,
    PRESS_LOG_TABLE_COLUMNS,
    PRESS_LOG_COLUMN_OPTIONS_MAP
} from '../../utils/constants.js';
import { useTranslation } from '../../context/TranslationContext.jsx'; 
import * as XLSX from 'xlsx'; 

const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({
        id: key,
        ...val[key],
    }));
};

// --- Fila de la Tabla (ACTUALIZADO CON CORRECCIÓN) ---
const PressLogTableRow = ({ item, onEdit, onDelete, t, agendaMap, stakeholderMap }) => {
    
    // Convertir IDs de agenda a nombres
    const agendaNames = (item.agendaItems || [])
        .map(id => {
            if (id === 'other') return item.otherAgendaItem || t('press_log.form.other_item');
            return agendaMap[id] || id; // Mostrar nombre o ID si no se encuentra
        })
        .join(', ');

    // Formatear entradas de medios
    const mediaEntries = (item.mediaEntries || [])
        .map(e => `${e.name} (${t(`press_log.format_opts.${(e.format || 'online').toLowerCase()}`)})`) // Añadido fallback para e.format
        .join('; ');
        
    // Convertir IDs de stakeholder a nombres
    const stakeholderNames = (item.mediaStakeholderKeys || [])
        .map(key => stakeholderMap[key] || key)
        .join(', ');

    // *** INICIO DE LA CORRECCIÓN ***
    // Proporcionar valores predeterminados para 'impact' y 'reach' antes de llamar a .toLowerCase()
    const impact = item.impact || 'Neutral';
    const reach = item.reach || 'National';
    // *** FIN DE LA CORRECCIÓN ***

    return (
        <tr className="hover:bg-sky-900/60 transition-colors">
            <td className="px-6 py-3 text-sm font-medium text-white whitespace-nowrap" title={item.date}>
                {item.date}
            </td>
            <td className="px-6 py-3 text-sm text-gray-400 truncate max-w-[200px]" title={agendaNames}>
                {agendaNames}
            </td>
            <td className="px-6 py-3 text-sm text-gray-400 truncate max-w-[200px]" title={mediaEntries}>
                {mediaEntries}
            </td>
            <td className="px-6 py-3 text-sm text-gray-400" title={impact}>
                {/* Corregido aquí */}
                {t(`press_log.impact_opts.${impact.toLowerCase()}`)}
            </td>
            <td className="px-6 py-3 text-sm text-gray-400" title={reach}>
                {/* Corregido aquí */}
                {t(`press_log.reach_opts.${reach.toLowerCase()}`)}
            </td>
            <td className="px-6 py-3 text-sm text-gray-400 truncate max-w-[200px]" title={stakeholderNames}>
                {stakeholderNames}
            </td>
            <td className="px-6 py-3 text-sm text-gray-400 whitespace-nowrap">
                {item.link ? (
                    <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition flex items-center"
                        title="View Link"
                    >
                        <Link className="w-4 h-4 mr-1" /> Link
                    </a>
                ) : 'N/A'}
            </td>
            <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex space-x-2 justify-end">
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
            </td>
        </tr>
    );
};

// --- Cabecera de la Tabla (ACTUALIZADO) ---
const TableHeaderWithControls = ({ column, currentSort, onSortChange, onFilterChange, filterOptions, currentFilters, t }) => {
    const label = t(column.labelKey); 

    if (column.key === 'actions' || column.key === 'link') {
        return <th key={column.key} className="px-6 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider">{label}</th>;
    }
    
    const isSorted = currentSort.key === column.key;
    const sortIcon = isSorted ? (currentSort.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />) : null;
    
    let options = [];
    if (column.filterable && column.optionsKey) {
         options = filterOptions[column.optionsKey] || [];
    }
    
    const isTextInputFilter = column.type === 'array' || !column.optionsKey; // Filtrar arrays con texto

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
                            className="text-xs p-1 border border-sky-700 bg-sky-950/50 text-white rounded-lg focus:ring-sky-500 focus:border-sky-500 min-w-[100px]"
                        />
                    ) : (
                        <select
                            value={currentFilters[column.key] || ALL_FILTER_OPTION}
                            onChange={(e) => onFilterChange(column.key, e.target.value)}
                            className="text-xs p-1 border border-sky-700 bg-sky-950/50 text-white rounded-lg focus:ring-sky-500 focus:border-sky-500 min-w-[100px]"
                        >
                            <option value={ALL_FILTER_OPTION} className="bg-sky-900">{ALL_FILTER_OPTION}</option>
                            {options.map(option => (
                                <option key={option} value={option} className="bg-sky-900">
                                    {t(`press_log.${column.optionsKey}_opts.${option.toLowerCase().replace(/ /g, '_')}`)}
                                </option>
                            ))}
                        </select>
                    )
                )}
            </div>
        </th>
    );
};


// --- Componente Principal de la Tabla (ACTUALIZADO) ---
const PressLogTable = ({ db, onOpenForm }) => {
    const { t } = useTranslation(); 
    const [commsItems, setCommsItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ key: 'date', direction: 'desc' }); 
    
    // Mapas para convertir IDs a Nombres
    const [agendaMap, setAgendaMap] = useState({});
    const [stakeholderMap, setStakeholderMap] = useState({});

    // 1. Data Fetching (PressLog, Agenda, y MediaStakeholders)
    useEffect(() => {
        if (!db) return;
        setIsLoading(true);
        let itemsLoaded = 0;
        const totalToLoad = 3;
        
        const checkDone = () => {
            itemsLoaded++;
            if (itemsLoaded === totalToLoad) setIsLoading(false);
        };

        const commsRef = ref(db, getDbPaths().pressLog); 
        const unsubComms = onValue(commsRef, (snapshot) => {
            setCommsItems(snapshotToArray(snapshot));
            checkDone();
        }, (error) => { console.error("Press Log Subscription Error:", error); checkDone(); });
        
        const agendaRef = ref(db, getDbPaths().agenda);
        const unsubAgenda = onValue(agendaRef, (snapshot) => {
            const data = snapshot.val() || {};
            const map = Object.keys(data).reduce((acc, key) => {
                acc[key] = data[key].nombre;
                return acc;
            }, {});
            setAgendaMap(map);
            checkDone();
        }, (error) => { console.error("Agenda Map Subscription Error:", error); checkDone(); });
        
        const stakeholderRef = ref(db, getDbPaths().mediaStakeholders);
        const unsubStakeholders = onValue(stakeholderRef, (snapshot) => {
            const data = snapshot.val() || {};
            const map = Object.keys(data).reduce((acc, key) => {
                acc[key] = data[key].name;
                return acc;
            }, {});
            setStakeholderMap(map);
            checkDone();
        }, (error) => { console.error("Stakeholder Map Subscription Error:", error); checkDone(); });

        return () => {
            unsubComms();
            unsubAgenda();
            unsubStakeholders();
        };
    }, [db]);


    // 2. Data Filtering and Sorting Logic
    const filteredAndSortedItems = useMemo(() => {
        let finalData = commsItems.filter(item => {
            for (const column of PRESS_LOG_TABLE_COLUMNS) {
                const key = column.key;
                const filterValue = filters[key];
                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;
                
                const fValue = filterValue.toLowerCase();
                let itemValue = item[key] || '';
                
                if (key === 'agendaItems') {
                    itemValue = (itemValue || [])
                        .map(id => id === 'other' ? item.otherAgendaItem : agendaMap[id])
                        .join(', ');
                } else if (key === 'mediaEntries') {
                    itemValue = (itemValue || []).map(e => `${e.name} ${e.format}`).join('; ');
                } else if (key === 'mediaStakeholderKeys') {
                    itemValue = (itemValue || []).map(id => stakeholderMap[id]).join(', ');
                }

                if (column.type === 'array') {
                    if (!String(itemValue).toLowerCase().includes(fValue)) return false;
                }
                else if (column.optionsKey) {
                    if (itemValue !== filterValue) return false;
                }
                else if (typeof itemValue === 'string') {
                    if (!String(itemValue).toLowerCase().includes(fValue)) return false;
                }
            }
            return true;
        });

        if (sort.key) {
            finalData.sort((a, b) => {
                const aValue = a[sort.key] || '';
                const bValue = b[sort.key] || '';
                return (sort.direction === 'asc' ? 1 : -1) * String(aValue).localeCompare(String(bValue));
            });
        }
        
        return finalData;
    }, [commsItems, filters, sort, agendaMap, stakeholderMap]);

    // Handler para eliminar
    const handleDelete = async (id) => {
        if (db && window.confirm(t('policy.confirm_delete'))) { 
            try {
                const itemRef = ref(db, `${getDbPaths().pressLog}/${id}`);
                await remove(itemRef); 
            } catch (e) { console.error("Error deleting comms document:", e); }
        }
    };

    const handleSortChange = (key) => {
        setSort(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Función de descarga XLSX
    const handleDownloadXLSX = () => {
        const data = filteredAndSortedItems;
        const columns = PRESS_LOG_TABLE_COLUMNS;
        const filename = 'Press_Log.xlsx';

        if (data.length === 0) {
            alert(t('policy.no_records'));
            return;
        }

        const exportData = data.map(item => {
            let row = {};
            columns.filter(col => col.key !== 'actions').forEach(col => {
                const header = t(col.labelKey);
                let value = item[col.key] || '';
                
                if (col.key === 'agendaItems') {
                    value = (item.agendaItems || [])
                        .map(id => id === 'other' ? item.otherAgendaItem : agendaMap[id])
                        .join('; ');
                } else if (col.key === 'mediaEntries') {
                    value = (item.mediaEntries || []).map(e => `${e.name} (${e.format})`).join('; ');
                } else if (col.key === 'mediaStakeholderKeys') {
                    value = (item.mediaStakeholderKeys || []).map(id => stakeholderMap[id]).join('; ');
                } else if (col.key === 'impact') {
                    value = t(`press_log.impact_opts.${(item.impact || 'Neutral').toLowerCase()}`);
                } else if (col.key === 'reach') {
                    value = t(`press_log.reach_opts.${(item.reach || 'National').toLowerCase()}`);
                }
                
                row[header] = value;
            });
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data');
        XLSX.writeFile(wb, filename);
    };


    // 3. Render Logic
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
                <p className="ml-3 text-sky-200">{t('press_log.loading_records')}</p>
            </div>
        );
    }
    
    return (
        <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-sky-900/70 rounded-t-xl border-b border-sky-700/50">
                <div className="flex items-center space-x-3">
                    <Megaphone className="w-5 h-5 text-sky-300" />
                    <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                        {`${t('press_log.title')} (${filteredAndSortedItems.length} items)`}
                    </h2>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={handleDownloadXLSX}
                        className="flex items-center space-x-2 bg-gray-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-600 transition shadow-md"
                        title={t('policy.download_xlsx')} 
                    >
                        <Download className="w-4 h-4" />
                        <span>{t('policy.download_xlsx')}</span> 
                    </button>
                    <button
                        onClick={() => onOpenForm(null)}
                        className="flex items-center space-x-2 bg-sky-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-sky-700 transition shadow-md"
                        title={t('press_log.form.add_title')}
                    >
                        <PlusCircle className="w-4 h-4" />
                        <span>{t('press_log.form.add_title')}</span>
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-sky-800/50">
                    <thead className="bg-sky-900/70">
                        <tr>
                            {PRESS_LOG_TABLE_COLUMNS.map(column => (
                                <TableHeaderWithControls
                                    key={column.key}
                                    column={column}
                                    currentSort={sort}
                                    onSortChange={handleSortChange}
                                    onFilterChange={handleFilterChange}
                                    filterOptions={PRESS_LOG_COLUMN_OPTIONS_MAP}
                                    currentFilters={filters}
                                    t={t} 
                                />
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-sky-950/50 divide-y divide-sky-800/50">
                        {filteredAndSortedItems.length > 0 ? (
                            filteredAndSortedItems.map(item => (
                                <PressLogTableRow
                                    key={item.id}
                                    item={item}
                                    onEdit={() => onOpenForm(item)} 
                                    onDelete={() => handleDelete(item.id)} 
                                    t={t}
                                    agendaMap={agendaMap}
                                    stakeholderMap={stakeholderMap}
                                />
                            ))
                        ) : (
                            <tr><td colSpan={PRESS_LOG_TABLE_COLUMNS.length} className="px-6 py-4 text-center text-gray-500">{t('press_log.no_records')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PressLogTable;