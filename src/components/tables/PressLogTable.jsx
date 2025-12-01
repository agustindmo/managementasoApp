import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { PlusCircle, Loader2, Edit, Trash2, Link, ArrowUp, ArrowDown, Download, Megaphone } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import { ALL_FILTER_OPTION } from '../../utils/constants.js';
import { useTranslation } from '../../context/TranslationContext.jsx'; 
import * as XLSX from 'xlsx';

const PRESS_LOG_COLUMNS = [
    { labelKey: "press_log.col.date", key: "date", sortable: true, filterable: true, type: 'string' },
    { labelKey: "press_log.col.media_name", key: "mediaName", sortable: true, filterable: true, type: 'string' },
    { labelKey: "press_log.col.topic", key: "topic", sortable: true, filterable: true, type: 'string' },
    { labelKey: "press_log.col.spokesperson", key: "spokesperson", sortable: true, filterable: true, type: 'string' },
    { labelKey: "press_log.col.format", key: "format", sortable: true, filterable: true, optionsKey: 'format', type: 'string' },
    { labelKey: "press_log.col.link", key: "link", sortable: false, filterable: false, type: 'string' },
    { labelKey: "press_log.col.actions", key: "actions", sortable: false, filterable: false, type: 'none' },
];

const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({
        id: key,
        ...val[key],
    }));
};

const PressLogTableRow = ({ item, onEdit, onDelete, t }) => {
    // FIX: Handle case where item.format might be undefined or null
    const formatValue = item.format || ''; 
    const formatLabelKey = `press_log.format_opts.${formatValue.toLowerCase()}`;
    const formatLabel = formatValue ? (t(formatLabelKey) !== formatLabelKey ? t(formatLabelKey) : formatValue) : 'N/A';

    return (
        <tr className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
            <td className="px-6 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">{item.date}</td>
            <td className="px-6 py-3 text-sm text-slate-600">{item.mediaName}</td>
            <td className="px-6 py-3 text-sm text-slate-600 truncate max-w-[200px]" title={item.topic}>{item.topic}</td>
            <td className="px-6 py-3 text-sm text-slate-600">{item.spokesperson}</td>
            <td className="px-6 py-3 text-sm text-slate-600">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {formatLabel}
                </span>
            </td>
            <td className="px-6 py-3 text-sm text-slate-600 whitespace-nowrap">
                {item.link ? (
                    <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 transition flex items-center"
                        title="View Link"
                    >
                        <Link className="w-4 h-4 mr-1" /> {t('press_log.col.link')}
                    </a>
                ) : 'N/A'}
            </td>
            <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
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
            </td>
        </tr>
    );
};

const TableHeaderWithControls = ({ column, currentSort, onSortChange, onFilterChange, currentFilters, dataItems, t }) => {
    const label = t(column.labelKey); 

    if (column.key === 'actions') {
        return <th key={column.key} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">{label}</th>;
    }
    
    const isSorted = currentSort.key === column.key;
    const sortIcon = isSorted ? (currentSort.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />) : null;
    
    let options = [];
    if (column.filterable && column.optionsKey) {
        const uniqueValues = [...new Set(dataItems.map(item => String(item[column.key] || 'N/A')))];
        options = uniqueValues.filter(v => v !== 'N/A' && v !== '').sort();
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
                            type="text"
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
                                <option key={option} value={option}>{t(`press_log.format_opts.${option.toLowerCase()}`) || option}</option>
                            ))}
                        </select>
                    )
                )}
            </div>
        </th>
    );
};

const PressLogTable = ({ db, onOpenForm }) => {
    const { t } = useTranslation(); 
    const [pressItems, setPressItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ key: 'date', direction: 'desc' }); 

    useEffect(() => {
        if (!db) return;
        setIsLoading(true); 
        const pressRef = ref(db, getDbPaths().pressLog);
        const unsubscribe = onValue(pressRef, (snapshot) => {
            try { setPressItems(snapshotToArray(snapshot)); } 
            catch (e) { console.error("Error processing Press Log snapshot:", e); }
            finally { setIsLoading(false); }
        }, (error) => { console.error("Press Log Subscription Error:", error); setIsLoading(false); });
        return () => unsubscribe();
    }, [db]);

    const filteredAndSortedItems = useMemo(() => {
        let finalData = pressItems.filter(item => {
            for (const column of PRESS_LOG_COLUMNS) {
                const key = column.key;
                const filterValue = filters[key];
                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;
                let itemValue = item[key] || '';
                if (column.optionsKey) {
                    if (itemValue !== filterValue) return false;
                } else {
                    if (!String(itemValue).toLowerCase().includes(String(filterValue).toLowerCase())) return false;
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
    }, [pressItems, filters, sort]);

    const handleDelete = async (id) => {
        if (db && window.confirm(t('policy.confirm_delete'))) { 
            try {
                const itemRef = ref(db, `${getDbPaths().pressLog}/${id}`);
                await remove(itemRef); 
            } catch (e) { console.error("Error deleting press document:", e); }
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
        const columns = PRESS_LOG_COLUMNS;
        const filename = 'Press_Log.xlsx';
        if (data.length === 0) { alert(t('policy.no_records')); return; }
        const exportData = data.map(item => {
            let row = {};
            columns.filter(col => col.key !== 'actions').forEach(col => {
                const header = t(col.labelKey);
                let value = item[col.key] || '';
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
                    <Megaphone className="w-5 h-5 text-blue-600" />
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                        {`${t('press_log.records_title')} (${filteredAndSortedItems.length} items)`}
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
                    <button
                        onClick={() => onOpenForm(null)}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition shadow-md"
                    >
                        <PlusCircle className="w-4 h-4" />
                        <span>{t('press_log.add_new')}</span>
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            {PRESS_LOG_COLUMNS.map(column => (
                                <TableHeaderWithControls
                                    key={column.key}
                                    column={column}
                                    currentSort={sort}
                                    onSortChange={handleSortChange}
                                    onFilterChange={handleFilterChange}
                                    filterOptions={{}}
                                    currentFilters={filters}
                                    dataItems={pressItems}
                                    t={t} 
                                />
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {filteredAndSortedItems.length > 0 ? (
                            filteredAndSortedItems.map(item => (
                                <PressLogTableRow 
                                    key={item.id} 
                                    item={item} 
                                    onEdit={() => onOpenForm(item)} 
                                    onDelete={() => handleDelete(item.id)} 
                                    t={t} 
                                />
                            ))
                        ) : (
                            <tr><td colSpan={PRESS_LOG_COLUMNS.length} className="px-6 py-4 text-center text-slate-500">{t('press_log.no_records')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PressLogTable;