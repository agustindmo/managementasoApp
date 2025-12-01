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

const CostTableRow = ({ item, onEdit, onDelete, t, isAdmin }) => { 
    return (
        <tr className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
            <td className="px-6 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">{item.date}</td>
            <td className="px-6 py-3 text-sm text-slate-600">{item.category}</td>
            <td className="px-6 py-3 text-sm text-slate-600 truncate max-w-[300px]" title={item.description}>{item.description}</td>
            <td className="px-6 py-3 text-sm text-red-600 font-semibold">{formatCurrency(item.amount)}</td>
            <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                {isAdmin && (
                    <div className="flex space-x-2 justify-end">
                        <button
                            onClick={onEdit}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition"
                            title={t('activity.form.edit_title')}
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onDelete}
                            className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition"
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

const TableHeaderWithControls = ({ column, currentSort, onSortChange, onFilterChange, filterOptions, currentFilters, t }) => {
    const label = t(column.labelKey); 

    if (column.key === 'actions') {
        return <th key={column.key} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">{label}</th>;
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
            className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap bg-slate-50"
        >
            <div className="flex flex-col space-y-2">
                <div className="flex items-center cursor-pointer hover:text-slate-700" onClick={() => column.sortable && onSortChange(column.key)}>
                    <span className="font-bold">{label}</span>
                    {sortIcon}
                </div>
                
                {column.filterable && (
                    isTextInputFilter ? (
                         <input
                            type={column.type === 'number' ? 'number' : 'text'}
                            placeholder={`${t('policy.search')} ${label}`}
                            value={currentFilters[column.key] || ''}
                            onChange={(e) => onFilterChange(column.key, e.target.value)}
                            className="text-xs p-1 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 min-w-[100px] bg-white text-slate-800"
                        />
                    ) : (
                        <select
                            value={currentFilters[column.key] || ALL_FILTER_OPTION}
                            onChange={(e) => onFilterChange(column.key, e.target.value)}
                            className="text-xs p-1 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 min-w-[100px] bg-white text-slate-800"
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


const FinanceCostTable = ({ db, onOpenForm, costType, role }) => { 
    const { t } = useTranslation(); 
    const isAdmin = role === 'admin'; 
    
    const isAdmintype = costType === 'admin';
    const dbPathKey = isAdmintype ? 'financeAdminCosts' : 'financeNonOpCosts';
    const filterOptionsMap = isAdmintype ? COST_COLUMN_OPTIONS_MAP_ADMIN : COST_COLUMN_OPTIONS_MAP_NON_OP;
    const titleKey = isAdmintype ? 'finance.admin_costs.title' : 'finance.nonop_costs.title';
    const addKey = isAdmintype ? 'finance.admin_costs.form_add' : 'finance.nonop_costs.form_add';

    const [costItems, setCostItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ key: 'date', direction: 'desc' }); 

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
                if (sort.key === 'amount') return (sort.direction === 'asc' ? 1 : -1) * (aValue - bValue);
                return (sort.direction === 'asc' ? 1 : -1) * String(aValue).localeCompare(String(bValue));
            });
        }
        return finalData;
    }, [costItems, filters, sort]);

    const handleDelete = async (id) => {
        if (db && isAdmin && window.confirm(t('policy.confirm_delete'))) { 
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

    const handleDownloadXLSX = () => {
        const data = filteredAndSortedItems;
        const columns = COST_TABLE_COLUMNS;
        const filename = isAdmintype ? 'Admin_Costs.xlsx' : 'NonOperative_Costs.xlsx';
        if (data.length === 0) { alert(t('policy.no_records')); return; }
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

    if (isLoading) return <div className="flex justify-center items-center h-48"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /><p className="ml-3 text-slate-500">{t('press_log.loading_records')}</p></div>;
    
    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200">
                <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                        {`${t(titleKey)} (${filteredAndSortedItems.length} items)`}
                    </h2>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={handleDownloadXLSX}
                        className="flex items-center space-x-2 bg-white text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-50 transition shadow-sm"
                        title={t('policy.download_xlsx')} 
                    >
                        <Download className="w-4 h-4" />
                        <span>{t('policy.download_xlsx')}</span> 
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => onOpenForm(null)}
                            className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition shadow-md"
                            title={t(addKey)}
                        >
                            <PlusCircle className="w-4 h-4" />
                            <span>{t(addKey)}</span>
                        </button>
                    )}
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
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
                    <tbody className="bg-white divide-y divide-slate-200">
                        {filteredAndSortedItems.length > 0 ? (
                            filteredAndSortedItems.map(item => (
                                <CostTableRow
                                    key={item.id}
                                    item={item}
                                    onEdit={() => onOpenForm(item)} 
                                    onDelete={() => handleDelete(item.id)} 
                                    t={t}
                                    isAdmin={isAdmin} 
                                />
                            ))
                        ) : (
                            <tr><td colSpan={COST_TABLE_COLUMNS.length} className="px-6 py-4 text-center text-slate-500">{t('press_log.no_records')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FinanceCostTable;