// src/components/tables/FinanceCostTable.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { Loader2, DollarSign, ArrowUp, ArrowDown, Download, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import CardTitle from '../ui/CardTitle.jsx';
import { 
    ALL_FILTER_OPTION,
    COST_TABLE_COLUMNS,
    COST_COLUMN_OPTIONS_MAP_ADMIN,
    COST_COLUMN_OPTIONS_MAP_NON_OP
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

const formatCurrency = (value) => {
    const numericValue = parseFloat(value) || 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numericValue);
};

// --- Fila de la Tabla ---
const CostTableRow = ({ item, onEdit, onDelete, t }) => {
    return (
        <tr className="hover:bg-sky-900/60 transition-colors">
            <td className="px-6 py-3 text-sm font-medium text-white whitespace-nowrap">{item.date}</td>
            <td className="px-6 py-3 text-sm text-gray-400">{item.category}</td>
            <td className="px-6 py-3 text-sm text-gray-400 truncate max-w-[300px]" title={item.description}>{item.description}</td>
            <td className="px-6 py-3 text-sm text-green-400 font-semibold">{formatCurrency(item.amount)}</td>
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

// --- Cabecera de la Tabla ---
const TableHeaderWithControls = ({ column, currentSort, onSortChange, onFilterChange, filterOptions, currentFilters, t }) => {
    const label = t(column.labelKey); 

    if (column.key === 'actions') {
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
                            type={column.type === 'number' ? 'number' : 'text'}
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


// --- Componente Principal de la Tabla ---
const FinanceCostTable = ({ db, onOpenForm, costType }) => {
    const { t } = useTranslation(); 
    
    // Determinar qué constantes usar
    const isAdmintype = costType === 'admin';
    const dbPathKey = isAdmintype ? 'financeAdminCosts' : 'financeNonOpCosts';
    const filterOptionsMap = isAdmintype ? COST_COLUMN_OPTIONS_MAP_ADMIN : COST_COLUMN_OPTIONS_MAP_NON_OP;
    const titleKey = isAdmintype ? 'finance.admin_costs.title' : 'finance.nonop_costs.title';
    const addKey = isAdmintype ? 'finance.admin_costs.form_add' : 'finance.nonop_costs.form_add';

    const [costItems, setCostItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ key: 'date', direction: 'desc' }); 

    // 1. Data Fetching
    useEffect(() => {
        if (!db) return;
        setIsLoading(true); 

        const costsRef = ref(db, getDbPaths()[dbPathKey]); 
        
        const unsubscribe = onValue(costsRef, (snapshot) => {
            try {
                setCostItems(snapshotToArray(snapshot));
            } catch (e) { console.error("Error processing Cost Log snapshot:", e); }
            finally { setIsLoading(false); }
        }, (error) => { console.error("Cost Log Subscription Error:", error); setIsLoading(false); });
        
        return () => unsubscribe();
    }, [db, dbPathKey]);


    // 2. Data Filtering and Sorting Logic
    const filteredAndSortedItems = useMemo(() => {
        let finalData = costItems.filter(item => {
            for (const column of COST_TABLE_COLUMNS) {
                const key = column.key;
                const filterValue = filters[key];
                
                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;

                let itemValue = item[key] || '';
                
                if (column.optionsKey) {
                    if (itemValue !== filterValue) return false;
                }
                else if (typeof itemValue === 'string' || typeof itemValue === 'number') {
                    if (!String(itemValue).toLowerCase().includes(String(filterValue).toLowerCase())) return false;
                }
            }
            return true;
        });

        if (sort.key) {
            finalData.sort((a, b) => {
                const aValue = a[sort.key] || (sort.key === 'amount' ? 0 : '');
                const bValue = b[sort.key] || (sort.key === 'amount' ? 0 : '');
                
                if (sort.key === 'amount') {
                    return (sort.direction === 'asc' ? 1 : -1) * (aValue - bValue);
                }
                return (sort.direction === 'asc' ? 1 : -1) * String(aValue).localeCompare(String(bValue));
            });
        }
        
        return finalData;
    }, [costItems, filters, sort]);

    // Handler para eliminar
    const handleDelete = async (id) => {
        if (db && window.confirm(t('policy.confirm_delete'))) { 
            try {
                const itemRef = ref(db, `${getDbPaths()[dbPathKey]}/${id}`);
                await remove(itemRef); 
            } catch (e) { console.error("Error deleting cost document:", e); }
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
        const columns = COST_TABLE_COLUMNS;
        const filename = isAdmintype ? 'Admin_Costs.xlsx' : 'NonOperative_Costs.xlsx';

        if (data.length === 0) {
            alert(t('policy.no_records'));
            return;
        }

        const exportData = data.map(item => {
            let row = {};
            columns.filter(col => col.key !== 'actions').forEach(col => {
                const header = t(col.labelKey);
                let value = item[col.key] || '';
                if (col.key === 'amount') value = formatCurrency(value);
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
                    <DollarSign className="w-5 h-5 text-sky-300" />
                    <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                        {`${t(titleKey)} (${filteredAndSortedItems.length} items)`}
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
                        title={t(addKey)}
                    >
                        <PlusCircle className="w-4 h-4" />
                        <span>{t(addKey)}</span>
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-sky-800/50">
                    <thead className="bg-sky-900/70">
                        <tr>
                            {COST_TABLE_COLUMNS.map(column => (
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
                                <CostTableRow
                                    key={item.id}
                                    item={item}
                                    onEdit={() => onOpenForm(item)} 
                                    onDelete={() => handleDelete(item.id)} 
                                    t={t}
                                />
                            ))
                        ) : (
                            <tr><td colSpan={COST_TABLE_COLUMNS.length} className="px-6 py-4 text-center text-gray-500">{t('press_log.no_records')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FinanceCostTable;