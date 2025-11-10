// src/components/tables/FinanceProjectTable.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { Loader2, Star, ArrowUp, ArrowDown, Download, PlusCircle, Edit, Trash2, Link } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import CardTitle from '../ui/CardTitle.jsx';
import { 
    ALL_FILTER_OPTION,
    PROJECT_TABLE_COLUMNS,
    PROJECT_COLUMN_OPTIONS_MAP
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
const ProjectTableRow = ({ item, onEdit, onDelete, t }) => {
    
    const objectives = (item.objectives || []).join(', ');
    const beneficiaries = (item.beneficiaries || []).join(', ');
    const locations = (item.locations || []).map(l => `${l.city}, ${l.province}`).join('; ');
    const fundingSources = (item.fundingSources || []).join(', ');

    return (
        <tr className="hover:bg-sky-900/60 transition-colors">
            <td className="px-6 py-3 text-sm font-medium text-white truncate max-w-[150px]" title={item.name}>{item.name}</td>
            <td className="px-6 py-3 text-sm text-green-400 font-semibold">{formatCurrency(item.amount)}</td>
            <td className="px-6 py-3 text-sm text-gray-400 whitespace-nowrap">{item.startDate} / {item.endDate}</td>
            <td className="px-6 py-3 text-sm text-gray-400 truncate max-w-[150px]" title={fundingSources}>{fundingSources}</td>
            <td className="px-6 py-3 text-sm text-gray-400 truncate max-w-[200px]" title={objectives}>{objectives}</td>
            <td className="px-6 py-3 text-sm text-gray-400 truncate max-w-[200px]" title={beneficiaries}>{beneficiaries}</td>
            <td className="px-6 py-3 text-sm text-gray-400 truncate max-w-[200px]" title={locations}>{locations}</td>
            <td className="px-6 py-3 text-sm text-gray-400 whitespace-nowrap">
                {item.impactLink ? (
                    <a 
                        href={item.impactLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition flex items-center"
                        title="View Evaluation Link"
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

// --- Cabecera de la Tabla ---
const TableHeaderWithControls = ({ column, currentSort, onSortChange, onFilterChange, filterOptions, currentFilters, t }) => {
    const label = t(column.labelKey); 

    if (column.key === 'actions' || column.key === 'impactLink') {
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
const FinanceProjectTable = ({ db, onOpenForm }) => {
    const { t } = useTranslation(); 
    
    const dbPathKey = 'financeProjects';
    const filterOptionsMap = PROJECT_COLUMN_OPTIONS_MAP;
    const titleKey = 'finance.tab.projects';
    const addKey = 'finance.projects.form_add';

    const [dataItems, setDataItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ key: 'startDate', direction: 'desc' }); 

    // 1. Data Fetching
    useEffect(() => {
        if (!db) return;
        setIsLoading(true); 

        const dataRef = ref(db, getDbPaths()[dbPathKey]); 
        
        const unsubscribe = onValue(dataRef, (snapshot) => {
            try {
                setDataItems(snapshotToArray(snapshot));
            } catch (e) { console.error("Error processing Project Log snapshot:", e); }
            finally { setIsLoading(false); }
        }, (error) => { console.error("Project Log Subscription Error:", error); setIsLoading(false); });
        
        return () => unsubscribe();
    }, [db, dbPathKey]);


    // 2. Data Filtering and Sorting Logic
    const { filteredAndSortedItems, totalSum } = useMemo(() => {
        let finalData = dataItems.filter(item => {
            for (const column of PROJECT_TABLE_COLUMNS) {
                const key = column.key;
                const filterValue = filters[key];
                
                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;

                let itemValue = item[key];
                
                // Handle array filtering
                if (column.type === 'array') {
                    if (key === 'locations') {
                        itemValue = (itemValue || []).map(l => `${l.city}, ${l.province}`).join('; ');
                    } else {
                        itemValue = (itemValue || []).join(', ');
                    }
                }
                
                itemValue = String(itemValue || '');

                if (column.optionsKey) {
                    // Filter for arrays that have at least one matching value
                    if (column.type === 'array') {
                        if (!item[key] || !item[key].includes(filterValue)) return false;
                    } else {
                        if (itemValue !== filterValue) return false;
                    }
                }
                else {
                    if (!itemValue.toLowerCase().includes(String(filterValue).toLowerCase())) return false;
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
        
        const sum = finalData.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
        
        return { filteredAndSortedItems: finalData, totalSum: sum };
    }, [dataItems, filters, sort]);

    // Handler para eliminar
    const handleDelete = async (id) => {
        if (db && window.confirm(t('policy.confirm_delete'))) { 
            try {
                const itemRef = ref(db, `${getDbPaths()[dbPathKey]}/${id}`);
                await remove(itemRef); 
            } catch (e) { console.error("Error deleting project document:", e); }
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
        const columns = PROJECT_TABLE_COLUMNS;
        const filename = 'Projects.xlsx';

        if (data.length === 0) {
            alert(t('policy.no_records'));
            return;
        }

        const exportData = data.map(item => {
            let row = {};
            columns.filter(col => col.key !== 'actions').forEach(col => {
                const header = t(col.labelKey);
                let value;
                
                switch(col.key) {
                    case 'amount':
                        value = formatCurrency(item.amount);
                        break;
                    case 'startDate':
                        value = `${item.startDate || 'N/A'} - ${item.endDate || 'N/A'}`;
                        break;
                    case 'fundingSources':
                    case 'objectives':
                    case 'beneficiaries':
                        value = (item[col.key] || []).join('; ');
                        break;
                    case 'locations':
                        value = (item.locations || []).map(l => `${l.city}, ${l.province}`).join('; ');
                        break;
                    case 'impactLink':
                        value = item.impactLink ? 'View Link' : 'N/A';
                        break;
                    default:
                        value = item[col.key] || '';
                }
                
                // Asignar al row, pero evitar duplicar la columna de fechas
                if (col.key !== 'endDate') {
                     row[header] = value;
                }
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
                    <Star className="w-5 h-5 text-sky-300" />
                    <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                        {`${t(titleKey)} (${filteredAndSortedItems.length}) | ${t('finance.fees.total')}: ${formatCurrency(totalSum)}`}
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
                            {PROJECT_TABLE_COLUMNS.map(column => (
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
                                <ProjectTableRow
                                    key={item.id}
                                    item={item}
                                    onEdit={() => onOpenForm(item)} 
                                    onDelete={() => handleDelete(item.id)} 
                                    t={t}
                                />
                            ))
                        ) : (
                            <tr><td colSpan={PROJECT_TABLE_COLUMNS.length} className="px-6 py-4 text-center text-gray-500">{t('press_log.no_records')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FinanceProjectTable;