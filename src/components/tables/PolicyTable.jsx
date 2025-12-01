import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue, remove, update } from 'firebase/database';
import { PlusCircle, Loader2, Search, ArrowUp, ArrowDown, Download } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import AgendaTableRow from './AgendaTableRow.jsx';
import MilestoneTableRow from './MilestoneTableRow.jsx'; 
import { AGENDA_COLUMN_OPTIONS_MAP, MILESTONE_COLUMN_OPTIONS_MAP, ALL_FILTER_OPTION } from '../../utils/constants.js';
import { useTranslation } from '../../context/TranslationContext.jsx'; 
import * as XLSX from 'xlsx'; 

const AGENDA_COLUMNS = [
    { labelKey: "policy.col.nombre", key: "nombre", sortable: true, filterable: true, type: 'string' }, 
    // Removed optionsKey to allow free text filtering
    { labelKey: "policy.col.pilar", key: "pilar", sortable: true, filterable: true, type: 'string' },
    { labelKey: "policy.col.tipo_acto", key: "tipoDeActo", sortable: true, filterable: true, optionsKey: 'tipoDeActo', type: 'string' },
    // Removed optionsKey to allow free text filtering
    { labelKey: "policy.col.sector", key: "sector", sortable: true, filterable: true, type: 'string' }, 
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
        className={`px-4 py-2 text-sm font-semibold transition-all duration-300 rounded-t-lg border-t border-l border-r
            ${isActive 
                ? 'bg-white border-slate-200 text-blue-600 border-b-transparent translate-y-[1px]' 
                : 'bg-slate-50 border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`
        }
    >
        {children}
    </button>
);

const formatCurrency = (value) => {
    const numericValue = parseFloat(value) || 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(numericValue);
};

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
        return Object.keys(val).map(key => ({ id: key, ...val[key] }));
    };

    useEffect(() => {
        if (!db) { setIsLoading(true); return; }
        setIsLoading(true); 
        const agendaRef = ref(db, getDbPaths().agenda);
        const milestonesRef = ref(db, getDbPaths().milestones);
        let unsubs = [];
        const unsubAgenda = onValue(agendaRef, (snapshot) => {
            try { setAgendaItems(snapshotToArray(snapshot)); } 
            catch (e) { console.error("Error processing Agenda snapshot:", e); }
            setIsLoading(false);
        });
        unsubs.push(unsubAgenda);
        const unsubMilestones = onValue(milestonesRef, (snapshot) => {
            try { setMilestones(snapshotToArray(snapshot)); } 
            catch (e) { console.error("Error processing Milestones snapshot:", e); }
            setIsLoading(false);
        });
        unsubs.push(unsubMilestones);
        return () => unsubs.forEach(unsub => unsub());
    }, [db]);

    const processTableData = (data, filters, sort, columns) => {
        let filteredData = data.filter(item => {
            for (const column of columns) {
                const key = column.key;
                const filterValue = filters[key];
                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;
                const itemValue = String(item[key] || '');
                if (!column.optionsKey) {
                    if (!itemValue.toLowerCase().includes(filterValue.toLowerCase())) return false;
                } else if (itemValue !== filterValue) return false;
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

    const handleDelete = async (collectionName, id) => {
        if (db && window.confirm(t('policy.confirm_delete'))) { 
            try {
                const itemRef = ref(db, `${getDbPaths()[collectionName]}/${id}`);
                await remove(itemRef); 
            } catch (e) { console.error("Error deleting document:", e); }
        }
    };

    const handleUpdate = async (collectionName, id, updatedData) => {
        if (!db) return;
        try {
            const itemRef = ref(db, `${getDbPaths()[collectionName]}/${id}`);
            await update(itemRef, updatedData); 
        } catch (e) { console.error("Error updating document:", e); }
    };
    
    const TableHeaderWithControls = ({ column, currentSort, onSortChange, onFilterChange, filterOptions, currentFilters, dataItems }) => {
        const label = t(column.labelKey); 
        if (column.key === 'actions') {
            return <th key={column.key} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</th>;
        }
        const isSorted = currentSort.key === column.key;
        const sortIcon = isSorted ? (currentSort.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />) : null;
        
        let options = [];
        if (column.filterable) {
            if (column.optionsKey) options = filterOptions[column.optionsKey] || [];
            else {
                // Note: We removed optionsKey for pilar/sector so they will hit this block if filterable is true, 
                // but in this logic we can default to text search if it's not a strict dropdown requirement
            }
        }
        
        const isTextInputFilter = !column.optionsKey; // This makes pilar/sector text inputs now
        
        return (
            <th key={column.key} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap bg-slate-50">
                <div className="flex flex-col space-y-2">
                    <div className="flex items-center cursor-pointer hover:text-slate-700" onClick={() => column.sortable && onSortChange(column.key)}>
                        <span className="font-bold">{label}</span>
                        {sortIcon}
                    </div>
                    {column.filterable && (
                        isTextInputFilter ? (
                            <input
                                type="text"
                                placeholder={`${t('policy.search')} ${label}`} 
                                value={currentFilters[column.key] || ''}
                                onChange={(e) => onFilterChange(column.key, e.target.value)}
                                className="text-xs p-1 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 min-w-[100px]"
                            />
                        ) : (
                            <select
                                value={currentFilters[column.key] || ALL_FILTER_OPTION}
                                onChange={(e) => onFilterChange(column.key, e.target.value)}
                                className="text-xs p-1 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 min-w-[100px] bg-white"
                            >
                                <option value={ALL_FILTER_OPTION}>{ALL_FILTER_OPTION}</option>
                                {options.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        )
                    )}
                </div>
            </th>
        );
    };

    const handleDownloadXLSX = (tab) => {
        const isAgenda = tab === 'agenda';
        const data = isAgenda ? finalAgendaItems : finalMilestones;
        const columns = isAgenda ? AGENDA_COLUMNS : MILESTONE_COLUMNS;
        const filename = isAgenda ? 'Agenda_Items.xlsx' : 'Milestones_Logros.xlsx';
        if (data.length === 0) { alert(t('policy.no_records')); return; }
        const exportColumns = columns.filter(col => col.key !== 'actions');
        const exportData = data.map(item => {
            let row = {};
            exportColumns.forEach(col => {
                const header = t(col.labelKey); 
                let value = item[col.key] || '';
                if (col.key === 'ahorro' && typeof value === 'number') value = formatCurrency(value);
                else if (col.key === 'archivo' || col.key === 'ayudaMemoria') value = value ? 'View Link' : 'N/A';
                row[header] = value;
            });
            return row;
        });
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data'); 
        XLSX.writeFile(wb, filename);
    };

    const renderTable = () => {
        if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /><p className="ml-3 text-slate-500">{t('policy.loading_records')}</p></div>;

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
            setCurrentSort(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
        };
        const handleFilterChange = (key, value) => {
            setCurrentFilters(prev => ({ ...prev, [key]: value }));
        };

        return (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
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
                    <tbody className="bg-white divide-y divide-slate-200">
                        {finalItems.length > 0 ? (
                            isAgenda ? finalItems.map(item => <AgendaTableRow key={item.id} item={item} onEdit={() => onOpenForm('agenda', item)} onDelete={() => handleDelete('agenda', item.id)} />)
                            : finalItems.map(item => <MilestoneTableRow key={item.id} item={item} onEdit={() => onOpenForm('milestone', item)} onDelete={() => handleDelete('milestones', item.id)} />)
                        ) : (
                            <tr><td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500 italic">{t('policy.no_records')}</td></tr> 
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-4 flex flex-col md:flex-row md:justify-between md:items-end bg-white border-b border-slate-200 space-y-4 md:space-y-0">
                <div className="flex space-x-0">
                    <TabButton isActive={activeTab === 'agenda'} onClick={() => setActiveTab('agenda')}>{t('policy.tab_agenda')}</TabButton>
                    <TabButton isActive={activeTab === 'milestones'} onClick={() => setActiveTab('milestones')}>{t('policy.tab_milestones')}</TabButton>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => handleDownloadXLSX(activeTab)}
                        className="flex items-center space-x-2 text-slate-600 bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                        <span>{t('policy.download_xlsx')}</span> 
                    </button>
                    <button
                        onClick={() => onOpenForm(activeTab)}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-md"
                    >
                        <PlusCircle className="w-4 h-4" />
                        <span>{activeTab === 'agenda' ? t('policy.add_agenda') : t('policy.add_milestone')}</span> 
                    </button>
                </div>
            </div>
            {renderTable()}
        </div>
    );
};

export default PolicyTable;