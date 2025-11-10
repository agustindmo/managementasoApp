import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue, remove, update } from 'firebase/database';
import { PlusCircle, Loader2, Search, ArrowUp, ArrowDown, Download } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import AgendaTableRow from './AgendaTableRow.jsx';
import MilestoneTableRow from './MilestoneTableRow.jsx'; 
import { AGENDA_COLUMN_OPTIONS_MAP, MILESTONE_COLUMN_OPTIONS_MAP, ALL_FILTER_OPTION } from '../../utils/constants.js';
import { useTranslation } from '../../context/TranslationContext.jsx'; 
import * as XLSX from 'xlsx'; // TAREA 2: Importar la nueva librería XLSX

// Define Table Structure and MetaData
const AGENDA_COLUMNS = [
    { labelKey: "policy.col.nombre", key: "nombre", sortable: true, filterable: true, type: 'string' }, 
    { labelKey: "policy.col.pilar", key: "pilar", sortable: true, filterable: true, optionsKey: 'pilar', type: 'string' },
    { labelKey: "policy.col.tipo_acto", key: "tipoDeActo", sortable: true, filterable: true, optionsKey: 'tipoDeActo', type: 'string' },
    { labelKey: "policy.col.sector", key: "sector", sortable: true, filterable: true, optionsKey: 'sector', type: 'string' }, 
    { labelKey: "policy.col.situacion", key: "situacion", sortable: false, filterable: true, type: 'string' }, 
    { labelKey: "policy.col.impacto", key: "impacto", sortable: true, filterable: true, type: 'string' }, 
    { labelKey: "policy.col.institucion", key: "institucion", sortable: true, filterable: true, type: 'string' }, 
    { labelKey: "policy.col.condicion", key: "condicion", sortable: true, filterable: true, optionsKey: 'condicion', type: 'string' },
    { labelKey: "policy.col.agenda", key: "agenda", sortable: true, filterable: true, optionsKey: 'agenda', type: 'string' },
    { labelKey: "policy.col.ano", key: "ano", sortable: true, filterable: true, optionsKey: 'ano', type: 'string' }, 
    { labelKey: "policy.col.actions", key: "actions", sortable: false, filterable: false, type: 'none' },
];

const MILESTONE_COLUMNS = [
    { labelKey: "policy.col.nombre", key: "nombre", sortable: true, filterable: true, type: 'string' },
    { labelKey: "policy.col.okrs", key: "OKRs", sortable: true, filterable: true, type: 'string' },
    { labelKey: "policy.col.institucion", key: "institucion", sortable: true, filterable: true, type: 'string' },
    { labelKey: "policy.col.ambito", key: "ambito", sortable: true, filterable: true, optionsKey: 'ambito', type: 'string' },
    { labelKey: "policy.col.tipo_acto", key: "tipoDeActo", sortable: true, filterable: true, optionsKey: 'tipoDeActo', type: 'string' },
    { labelKey: "policy.col.ano", key: "ano", sortable: true, filterable: true, optionsKey: 'ano', type: 'string' },
    { labelKey: "policy.col.ahorro", key: "ahorro", sortable: true, filterable: true, type: 'number' },
    { labelKey: "policy.col.archivo", key: "archivo", sortable: false, filterable: false, type: 'string' }, 
    { labelKey: "policy.col.actions", key: "actions", sortable: false, filterable: false, type: 'none' },
];


const TabButton = ({ isActive, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold transition-all duration-300 rounded-t-lg 
            ${isActive 
                ? 'bg-sky-900/70 text-white shadow-md' 
                : 'bg-black/30 text-gray-400 hover:bg-black/50 hover:text-white'}`
        }
    >
        {children}
    </button>
);

// Helper para formatear moneda (ya existía)
const formatCurrency = (value) => {
    const numericValue = parseFloat(value) || 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(numericValue);
};

// --- Main PolicyTable Component ---
const PolicyTable = ({ db, onOpenForm, userId }) => {
    const { t } = useTranslation(); 
    const [activeTab, setActiveTab] = useState('agenda');
    const [agendaItems, setAgendaItems] = useState([]);
    const [milestones, setMilestones] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [agendaFilters, setAgendaFilters] = useState({});
    const [agendaSort, setAgendaSort] = useState({ key: 'nombre', direction: 'asc' });

    const [milestoneFilters, setMilestoneFilters] = useState({});
    const [milestoneSort, setMilestoneSort] = useState({ key: 'nombre', direction: 'asc' });

    const snapshotToArray = (snapshot) => {
        if (!snapshot.exists()) return [];
        const val = snapshot.val();
        return Object.keys(val).map(key => ({
            id: key,
            ...val[key],
        }));
    };

    // 1. Data Fetching and Subscription
    useEffect(() => {
        if (!db) {
            setIsLoading(true);
            return;
        }
        setIsLoading(true); 

        const agendaRef = ref(db, getDbPaths().agenda);
        const milestonesRef = ref(db, getDbPaths().milestones);
        let unsubs = [];

        const unsubAgenda = onValue(agendaRef, (snapshot) => {
            try { setAgendaItems(snapshotToArray(snapshot)); } 
            catch (e) { console.error("Error processing Agenda snapshot:", e); }
            setIsLoading(false);
        }, (error) => {
             console.error("Agenda Subscription Error:", error);
             setIsLoading(false);
        });
        unsubs.push(unsubAgenda);

        const unsubMilestones = onValue(milestonesRef, (snapshot) => {
            try { setMilestones(snapshotToArray(snapshot)); } 
            catch (e) { console.error("Error processing Milestones snapshot:", e); }
            setIsLoading(false);
        }, (error) => {
            console.error("Milestones Subscription Error:", error);
            setIsLoading(false);
        });
        unsubs.push(unsubMilestones);
        
        return () => unsubs.forEach(unsub => unsub());
    }, [db]);


    // Generic Data Filter/Sort Logic
    const processTableData = (data, filters, sort, columns) => {
        let filteredData = data.filter(item => {
            for (const column of columns) {
                const key = column.key;
                const filterValue = filters[key];
                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;
                const itemValue = String(item[key] || '');
                if (!column.optionsKey) {
                    if (!itemValue.toLowerCase().includes(filterValue.toLowerCase())) return false;
                } 
                else if (itemValue !== filterValue) return false;
            }
            return true;
        });

        if (sort.key) {
            filteredData.sort((a, b) => {
                const column = columns.find(c => c.key === sort.key);
                const aValue = a[sort.key] || (column?.type === 'number' ? -Infinity : '');
                const bValue = b[column.key] || (column?.type === 'number' ? -Infinity : '');
                if (column?.type === 'number') return (sort.direction === 'asc' ? 1 : -1) * (aValue - bValue);
                else return (sort.direction === 'asc' ? 1 : -1) * String(aValue).localeCompare(String(bValue));
            });
        }
        return filteredData;
    };

    const finalAgendaItems = useMemo(() => processTableData(agendaItems, agendaFilters, agendaSort, AGENDA_COLUMNS), [agendaItems, agendaFilters, agendaSort]);
    const finalMilestones = useMemo(() => processTableData(milestones, milestoneFilters, milestoneSort, MILESTONE_COLUMNS), [milestones, milestoneFilters, milestoneSort]);


    // 2. Data Handlers (Delete and Update)
    const handleDelete = async (collectionName, id) => {
        if (db && window.confirm(t('policy.confirm_delete'))) { 
            try {
                const itemRef = ref(db, `${getDbPaths()[collectionName]}/${id}`);
                await remove(itemRef); 
            } catch (e) {
                console.error("Error deleting document:", e);
            }
        }
    };

    const handleUpdate = async (collectionName, id, updatedData) => {
        if (!db) return;
        try {
            const itemRef = ref(db, `${getDbPaths()[collectionName]}/${id}`);
            await update(itemRef, updatedData); 
        } catch (e) {
            console.error("Error updating document:", e);
        }
    };
    
    // Custom Table Header Component with controls
    const TableHeaderWithControls = ({ column, currentSort, onSortChange, onFilterChange, filterOptions, currentFilters, dataItems }) => {
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
            if (column.optionsKey) options = filterOptions[column.optionsKey] || [];
            else {
                const uniqueValues = [...new Set(dataItems.map(item => String(item[column.key] || 'N/A')))];
                options = uniqueValues.filter(v => v !== 'N/A' && v !== '').sort();
            }
        }
        
        const isTextInputFilter = !column.optionsKey || (column.key === 'institucion' || column.key === 'impacto' || column.key === 'nombre' || column.key === 'OKRs' || column.key === 'ahorro' || column.key === 'situacion'); 
        
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
                                    <option key={option} value={option} className="bg-sky-900">{option}</option>
                                ))}
                            </select>
                        )
                    )}
                </div>
            </th>
        );
    };


    // TAREA 2: Nueva función de exportación a XLSX
    const handleDownloadXLSX = (tab) => {
        const isAgenda = tab === 'agenda';
        const data = isAgenda ? finalAgendaItems : finalMilestones;
        const columns = isAgenda ? AGENDA_COLUMNS : MILESTONE_COLUMNS;
        const filename = isAgenda ? 'Agenda_Items.xlsx' : 'Milestones_Logros.xlsx';

        if (data.length === 0) {
            alert(t('policy.no_records'));
            return;
        }

        // 1. Filtrar columnas (quitar 'actions')
        const exportColumns = columns.filter(col => col.key !== 'actions');
        
        // 2. Crear los datos para la hoja
        const exportData = data.map(item => {
            let row = {};
            exportColumns.forEach(col => {
                const header = t(col.labelKey); // Usar la etiqueta traducida como clave
                let value = item[col.key] || '';
                
                // Aplicar mismo formato que el PDF
                if (col.key === 'ahorro' && typeof value === 'number') {
                    value = formatCurrency(value);
                } else if (col.key === 'archivo' || col.key === 'ayudaMemoria') {
                    value = value ? 'View Link' : 'N/A';
                }
                
                row[header] = value;
            });
            return row;
        });

        // 3. Crear la hoja de cálculo y el libro
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data'); // Nombrar la pestaña "Data"

        // 4. Escribir y descargar el archivo
        XLSX.writeFile(wb, filename);
    };


    // 4. Render Logic
    const renderTable = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
                    <p className="ml-3 text-sky-200">{t('policy.loading_records')}</p> 
                </div>
            );
        }

        const isAgenda = activeTab === 'agenda';
        const columns = isAgenda ? AGENDA_COLUMNS : MILESTONE_COLUMNS;
        const finalItems = isAgenda ? finalAgendaItems : finalMilestones;
        const rawItems = isAgenda ? agendaItems : milestones;
        const currentSort = isAgenda ? agendaSort : milestoneSort;
        const setCurrentSort = isAgenda ? setAgendaSort : setMilestoneSort;
        const currentFilters = isAgenda ? agendaFilters : milestoneFilters;
        const setCurrentFilters = isAgenda ? setAgendaFilters : setMilestoneFilters;
        const filterMap = isAgenda ? AGENDA_COLUMN_OPTIONS_MAP : MILESTONE_COLUMN_OPTIONS_MAP;

        const handleSortChange = (key) => {
            setCurrentSort(prev => ({
                key,
                direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
            }));
        };

        const handleFilterChange = (key, value) => {
            setCurrentFilters(prev => ({
                ...prev,
                [key]: value
            }));
        };

        return (
            <>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-sky-800/50">
                        <thead className="bg-sky-900/70">
                            <tr>
                                {columns.map(column => (
                                    <TableHeaderWithControls
                                        key={column.key}
                                        column={column}
                                        currentSort={currentSort}
                                        onSortChange={handleSortChange}
                                        onFilterChange={handleFilterChange}
                                        filterOptions={filterMap}
                                        currentFilters={currentFilters}
                                        dataItems={rawItems} 
                                        t={t} 
                                    />
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-sky-950/50 divide-y divide-sky-800/50">
                            {finalItems.length > 0 ? (
                                isAgenda ? (
                                    <>{finalItems.map(item => (
                                        <AgendaTableRow
                                            key={item.id}
                                            item={item}
                                            onEdit={() => onOpenForm('agenda', item)}
                                            onDelete={() => handleDelete('agenda', item.id)}
                                            onSave={handleUpdate}
                                        />
                                    ))}</>
                                ) : (
                                    <>{finalItems.map(item => (
                                        <MilestoneTableRow
                                            key={item.id}
                                            item={item}
                                            onEdit={() => onOpenForm('milestone', item)}
                                            onDelete={() => handleDelete('milestones', item.id)}
                                            onSave={handleUpdate}
                                        />
                                    ))}</>
                                )
                            ) : (
                                <tr><td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">{t('policy.no_records')}</td></tr> 
                            )}
                        </tbody>
                    </table>
                </div>
            </>
        );
    };


    return (
        <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
            <div className="p-4 flex flex-col md:flex-row md:justify-between md:items-center bg-black/30 border-b border-sky-700/50 space-y-4 md:space-y-0">
                <div className="space-x-2">
                    <TabButton isActive={activeTab === 'agenda'} onClick={() => setActiveTab('agenda')}>
                        {t('policy.tab_agenda')} 
                    </TabButton>
                    <TabButton isActive={activeTab === 'milestones'} onClick={() => setActiveTab('milestones')}>
                        {t('policy.tab_milestones')} 
                    </TabButton>
                </div>
                <div className="flex space-x-2">
                    {/* TAREA 2: Botones actualizados a XLSX */}
                    {activeTab === 'agenda' && (
                        <>
                            <button
                                onClick={() => handleDownloadXLSX('agenda')}
                                className="flex items-center space-x-2 bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition shadow-md"
                                title={t('policy.download_xlsx')} 
                            >
                                <Download className="w-4 h-4" />
                                <span>{t('policy.download_xlsx')}</span> 
                            </button>
                            <button
                                onClick={() => onOpenForm('agenda')}
                                className="flex items-center space-x-2 bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700 transition shadow-md"
                            >
                                <PlusCircle className="w-4 h-4" />
                                <span>{t('policy.add_agenda')}</span> 
                            </button>
                        </>
                    )}
                    {activeTab === 'milestones' && (
                         <>
                            <button
                                onClick={() => handleDownloadXLSX('milestones')}
                                className="flex items-center space-x-2 bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition shadow-md"
                                title={t('policy.download_xlsx')} 
                            >
                                <Download className="w-4 h-4" />
                                <span>{t('policy.download_xlsx')}</span> 
                            </button>
                            <button
                                onClick={() => onOpenForm('milestone')}
                                className="flex items-center space-x-2 bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700 transition shadow-md"
                            >
                                <PlusCircle className="w-4 h-4" />
                                <span>{t('policy.add_milestone')}</span> 
                            </button>
                        </>
                    )}
                </div>
            </div>
            {renderTable()}
        </div>
    );
};

export default PolicyTable;