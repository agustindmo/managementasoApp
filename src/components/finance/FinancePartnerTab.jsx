// src/components/finance/FinancePartnerTab.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { Loader2, Handshake, ArrowUp, ArrowDown, PlusCircle, Edit, Trash2, Link, PieChart } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import CardTitle from '../ui/CardTitle.jsx';
import { 
    ALL_FILTER_OPTION,
    PARTNER_TABLE_COLUMNS,
    PARTNER_COLUMN_OPTIONS_MAP
} from '../../utils/constants.js';
import { useTranslation } from '../../context/TranslationContext.jsx'; 
import FinancePartnerForm from '../forms/FinancePartnerForm.jsx';
// --- NUEVO: Importar gráfico ---
// import SimpleBarChart from '../charts/SimpleBarChart.jsx'; // Removed chart import

const snapshotToArray = (snapshot) => {
    // ... (código existente) ...
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({
        id: key,
        ...val[key],
    }));
};

// --- Fila de la Tabla ---
const PartnerTableRow = ({ item, onEdit, onDelete, t, isAdmin }) => {
    // ... (código existente) ...
    return (
        <tr className="hover:bg-sky-900/60 transition-colors">
            <td className="px-6 py-3 text-sm font-medium text-white truncate max-w-[150px]" title={item.name}>{item.name}</td>
            <td className="px-6 py-3 text-sm text-gray-400">{item.area}</td>
            <td className="px-6 py-3 text-sm text-gray-400 truncate max-w-[150px]" title={item.contact_person}>{item.contact_person || 'N/A'}</td>
            <td className="px-6 py-3 text-sm text-gray-400 truncate max-w-[150px]" title={item.contact_email}>{item.contact_email || 'N/A'}</td>
            <td className="px-6 py-3 text-sm text-gray-400 whitespace-nowrap">
                {item.agreement_link ? (
                    <a 
                        href={item.agreement_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition flex items-center"
                        title="View Document Link"
                    >
                        <Link className="w-4 h-4 mr-1" /> Link
                    </a>
                ) : 'N/A'}
            </td>
            <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                {isAdmin && (
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
                )}
            </td>
        </tr>
    );
};

// --- Cabecera de la Tabla ---
const TableHeaderWithControls = ({ column, currentSort, onSortChange, onFilterChange, filterOptions, currentFilters, t }) => {
    // ... (código existente) ...
    const label = t(column.labelKey); 
    if (column.key === 'actions' || column.key === 'agreement_link') {
        return <th key={column.key} className="px-6 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider">{label}</th>;
    }
    const isSorted = currentSort.key === column.key;
    const sortIcon = isSorted ? (currentSort.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />) : null;
    let options = [];
    if (column.filterable && column.optionsKey) {
         options = filterOptions[column.optionsKey] || [];
    }
    const isTextInputFilter = !column.optionsKey;
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


// --- Componente Principal de la Pestaña/Dashboard ---
const FinancePartnersTab = ({ db, userId, role }) => {
    // ... (código existente de estados) ...
    const { t } = useTranslation(); 
    const isAdmin = role === 'admin';
    const [partners, setPartners] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ key: 'name', direction: 'asc' }); 
    const [view, setView] = useState('table');
    const [activeRecord, setActiveRecord] = useState(null);
    const dbPathKey = 'financePartners';
    const filterOptionsMap = PARTNER_COLUMN_OPTIONS_MAP;

    // 1. Data Fetching
    useEffect(() => {
        // ... (código existente) ...
        if (!db) return;
        setIsLoading(true); 
        const dataRef = ref(db, getDbPaths()[dbPathKey]); 
        const unsubscribe = onValue(dataRef, (snapshot) => {
            try {
                setPartners(snapshotToArray(snapshot));
            } catch (e) { console.error("Error processing Partner snapshot:", e); }
            finally { setIsLoading(false); }
        }, (error) => { console.error("Partner subscription Error:", error); setIsLoading(false); });
        return () => unsubscribe();
    }, [db]);


    // 2. Data Filtering and Sorting Logic
    const filteredAndSortedItems = useMemo(() => {
        // ... (código existente) ...
        let finalData = partners.filter(item => {
            for (const column of PARTNER_TABLE_COLUMNS) {
                const key = column.key;
                if (key === 'actions') continue;
                const filterValue = filters[key];
                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;
                let itemValue = String(item[key] || '');
                if (column.optionsKey) {
                    if (itemValue !== filterValue) return false;
                }
                else {
                    if (!itemValue.toLowerCase().includes(String(filterValue).toLowerCase())) return false;
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
    }, [partners, filters, sort]);
    
    // --- NUEVO: Formatear datos para el gráfico ---
    // Removed chartData useMemo hook

    // Handlers
    // ... (código existente de handlers) ...
    const handleDelete = async (id) => {
        if (db && isAdmin && window.confirm(t('policy.confirm_delete'))) { 
            try {
                const itemRef = ref(db, `${getDbPaths()[dbPathKey]}/${id}`);
                await remove(itemRef); 
            } catch (e) { console.error("Error deleting partner document:", e); }
        }
    };
    const handleSortChange = (key) => {
        setSort(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
    };
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };
    const handleOpenForm = (record = null) => {
        if (!isAdmin) return;
        setActiveRecord(record);
        setView('form');
    };
    const handleCloseForm = () => {
        setActiveRecord(null);
        setView('table');
    };

    // 3. Render Logic
    if (isLoading) {
        // ... (código existente) ...
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
                <p className="ml-3 text-sky-200">{t('press_log.loading_records')}</p>
            </div>
        );
    }
    
    if (view === 'form') {
        // ... (código existente) ...
        return (
            <FinancePartnerForm
                userId={userId}
                db={db}
                initialData={activeRecord}
                onClose={handleCloseForm}
                mode={activeRecord ? 'edit' : 'add'}
                role={role}
            />
        );
    }
    
    return (
        <div className="space-y-8">
            {/* --- MODIFICADO: Chart div removed --- */}
            {/* The chart component previously rendered here has been eliminated. */}
        
            <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-sky-900/70 rounded-t-xl border-b border-sky-700/50">
                    <div className="flex items-center space-x-3">
                        <Handshake className="w-5 h-5 text-sky-300" />
                        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                            {`${t('finance.relations.partners_title')} (${filteredAndSortedItems.length})`}
                        </h2>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => handleOpenForm(null)} // Corrected from onOpenForm to handleOpenForm
                            className="flex items-center space-x-2 bg-sky-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-sky-700 transition shadow-md"
                            title={t('finance.relations.partner.form_add')}
                        >
                            <PlusCircle className="w-4 h-4" />
                            <span>{t('finance.relations.partner.form_add')}</span>
                        </button>
                    )}
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-sky-800/50">
                        <thead className="bg-sky-900/70">
                            <tr>
                                {PARTNER_TABLE_COLUMNS.map(column => (
                                    <TableHeaderWithControls
                                        key={column.key}
                                        column={column}
                                        currentSort={sort}
                                        onSortChange={handleSortChange}
                                        onFilterChange={handleFilterChange}
                                        filterOptions={filterOptionsMap}
                                        currentFilters={filters}
                                        t={t} 
                                    />
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-sky-950/50 divide-y divide-sky-800/50">
                            {filteredAndSortedItems.length > 0 ? (
                                filteredAndSortedItems.map(item => (
                                    <PartnerTableRow
                                        key={item.id}
                                        item={item}
                                        onEdit={() => handleOpenForm(item)} // Corrected from onOpenForm to handleOpenForm
                                        onDelete={() => handleDelete(item.id)} 
                                        t={t}
                                        isAdmin={isAdmin}
                                    />
                                ))
                            ) : (
                                <tr><td colSpan={PARTNER_TABLE_COLUMNS.length} className="px-6 py-4 text-center text-gray-500">{t('press_log.no_records')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FinancePartnersTab;