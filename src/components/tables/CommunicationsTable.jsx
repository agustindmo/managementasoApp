import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { Loader2, MessageCircle, ArrowUp, ArrowDown, Download } from 'lucide-react'; // TAREA 6: Añadido Download
import { getDbPaths } from '../../services/firebase.js';
import CardTitle from '../ui/CardTitle.jsx';
import CommunicationsTableRow from './CommunicationsTableRow.jsx';
import { ALL_FILTER_OPTION } from '../../utils/constants.js';
import { useTranslation } from '../../context/TranslationContext.jsx'; // Añadido
import * as XLSX from 'xlsx'; // TAREA 6: Añadido XLSX

// TAREA 6: Usar labelKey para traducción
const COMMS_COLUMNS = [
    { labelKey: "comms.col.agenda_item", key: "agendaItemName", sortable: true, filterable: true, type: 'string' },
    { labelKey: "comms.col.solicitud", key: "solicitud", sortable: false, filterable: true, type: 'string' },
    { labelKey: "comms.col.message", key: "message", sortable: false, filterable: true, type: 'string' },
    { labelKey: "comms.col.stakeholders", key: "stakeholders", sortable: true, filterable: true, type: 'array' }, 
    { labelKey: "comms.col.date", key: "date", sortable: true, filterable: true, type: 'string' },
];

const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({
        id: key,
        ...val[key],
    }));
};

// Componente de cabecera de tabla
const TableHeaderWithControls = ({ column, currentSort, onSortChange, onFilterChange, currentFilters, dataItems, t }) => {
    const label = t(column.labelKey); // Usar traducción
    const isSorted = currentSort.key === column.key;
    const sortIcon = isSorted ? (currentSort.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />) : null;
    
    // TAREA 6.1: Corregido. Todas las columnas en esta tabla usarán un input de texto para filtrar.
    const isTextInputFilter = true; 
    let options = []; // No se usa para 'select'

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
                    <input
                        type="text"
                        placeholder={`${t('policy.search')} ${label}`} 
                        value={currentFilters[column.key] || ''}
                        onChange={(e) => onFilterChange(column.key, e.target.value)}
                        className="text-xs p-1 border border-sky-700 bg-sky-950/50 text-white rounded-lg focus:ring-sky-500 focus:border-sky-500 min-w-[100px]"
                    />
                )}
            </div>
        </th>
    );
};


const CommunicationsTable = ({ db }) => {
    const { t } = useTranslation(); // Añadido
    const [allAgendaItems, setAllAgendaItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ key: 'date', direction: 'desc' }); 

    // 1. Data Fetching (Lee de 'agenda' para obtener 'commsMessages')
    useEffect(() => {
        if (!db) {
            setIsLoading(true);
            return;
        }
        setIsLoading(true); 

        const agendaRef = ref(db, getDbPaths().agenda);
        
        const unsubscribe = onValue(agendaRef, (snapshot) => {
            try {
                const items = snapshotToArray(snapshot);
                setAllAgendaItems(items);
                setIsLoading(false);
            } catch (e) {
                console.error("Error processing Agenda snapshot:", e);
                setIsLoading(false);
            }
        }, (error) => {
             console.error("Agenda Subscription Error:", error);
             setIsLoading(false);
        });
        
        return () => unsubscribe();
    }, [db]);


    // 2. Lógica de Aplanamiento, Filtro y Orden
    const filteredAndSortedItems = useMemo(() => {
        // Aplanar los mensajes anidados
        const flattenedData = allAgendaItems.flatMap(agendaItem => {
            const messages = Array.isArray(agendaItem.commsMessages) ? agendaItem.commsMessages : [];
            
            return messages.map((message, index) => ({
                id: `${agendaItem.id}-${index}`, 
                agendaItemName: agendaItem.nombre || 'N/A',
                solicitud: agendaItem.solicitud || 'N/A',
                ...message,
                stakeholders: message.stakeholderKeys || [], 
            }));
        });

        // Aplicar Filtros
        let finalData = flattenedData.filter(item => {
            for (const column of COMMS_COLUMNS) {
                const key = column.key;
                const filterValue = filters[key];
                
                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;

                let itemValue = item[key] || '';
                
                if (key === 'stakeholders') {
                    // TAREA 6.1: Lógica de filtro de búsqueda
                    itemValue = (itemValue || []).join(', ');
                    if (!itemValue.toLowerCase().includes(filterValue.toLowerCase())) {
                        return false;
                    }
                } 
                else if (typeof itemValue === 'string') {
                    if (!itemValue.toLowerCase().includes(filterValue.toLowerCase())) {
                        return false;
                    }
                }
            }
            return true;
        });

        // Aplicar Orden
        if (sort.key) {
            finalData.sort((a, b) => {
                const aValue = a[sort.key] || '';
                const bValue = b[sort.key] || '';
                return (sort.direction === 'asc' ? 1 : -1) * String(aValue).localeCompare(String(bValue));
            });
        }
        
        return finalData;
    }, [allAgendaItems, filters, sort]);


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

    // TAREA 6.2: Función de descarga XLSX
    const handleDownloadXLSX = () => {
        const data = filteredAndSortedItems;
        const columns = COMMS_COLUMNS;
        const filename = 'Communications_Messages.xlsx';

        if (data.length === 0) {
            alert(t('policy.no_records'));
            return;
        }

        const exportData = data.map(item => {
            let row = {};
            columns.forEach(col => {
                const header = t(col.labelKey);
                let value = item[col.key] || '';
                
                if (col.key === 'stakeholders') {
                    value = (value || []).join(', ');
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
                {/* Estilo oscuro */}
                <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
                <p className="ml-3 text-sky-200">{t('comms.loading_records')}</p>
            </div>
        );
    }
    
    return (
        // TAREA 1: Contenedor oscuro
        <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
            {/* TAREA 6.2: Botón de descarga añadido al CardTitle */}
            <div className="flex items-center justify-between p-4 bg-sky-900/70 rounded-t-xl border-b border-sky-700/50">
                <div className="flex items-center space-x-3">
                    <MessageCircle className="w-5 h-5 text-sky-300" />
                    <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                        {`${t('comms.log_title')} (${filteredAndSortedItems.length} items)`}
                    </h2>
                </div>
                <button
                    onClick={handleDownloadXLSX}
                    className="flex items-center space-x-2 bg-gray-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-600 transition shadow-md"
                    title={t('policy.download_xlsx')} 
                >
                    <Download className="w-4 h-4" />
                    <span>{t('policy.download_xlsx')}</span> 
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-sky-800/50">
                    {/* TAREA 1: Cabecera oscura */}
                    <thead className="bg-sky-900/70">
                        <tr>
                            {COMMS_COLUMNS.map(column => (
                                <TableHeaderWithControls
                                    key={column.key}
                                    column={column}
                                    currentSort={sort}
                                    onSortChange={handleSortChange}
                                    onFilterChange={handleFilterChange}
                                    currentFilters={filters}
                                    dataItems={filteredAndSortedItems} 
                                    t={t} 
                                />
                            ))}
                        </tr>
                    </thead>
                    {/* TAREA 1: Cuerpo oscuro */}
                    <tbody className="bg-sky-950/50 divide-y divide-sky-800/50">
                        {filteredAndSortedItems.length > 0 ? (
                            filteredAndSortedItems.map(item => (
                                <CommunicationsTableRow
                                    key={item.id}
                                    item={item}
                                />
                            ))
                        ) : (
                            <tr><td colSpan={COMMS_COLUMNS.length} className="px-6 py-4 text-center text-gray-500">{t('comms.no_records')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CommunicationsTable;