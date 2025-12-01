import React, { useState, useMemo } from 'react';
import { MessageCircle, ArrowUp, ArrowDown, Download, Search } from 'lucide-react';
import CommunicationsTableRow from './CommunicationsTableRow.jsx';
import { ALL_FILTER_OPTION } from '../../utils/constants.js';
import { useTranslation } from '../../context/TranslationContext.jsx'; 
import * as XLSX from 'xlsx';

const COMMS_COLUMNS = [
    { labelKey: "comms.col.date", key: "date", sortable: true, filterable: true, type: 'string' },
    { labelKey: "comms.col.agenda_item", key: "agendaItemName", sortable: true, filterable: true, type: 'string' },
    { labelKey: "comms.col.solicitud", key: "solicitud", sortable: false, filterable: true, type: 'string' },
    { labelKey: "comms.col.message", key: "message", sortable: false, filterable: true, type: 'string' },
    { labelKey: "comms.col.stakeholders", key: "stakeholders", sortable: true, filterable: true, type: 'array' }, 
];

const TableHeaderWithControls = ({ column, currentSort, onSortChange, onFilterChange, currentFilters, t }) => {
    const label = t(column.labelKey); 
    
    const isSorted = currentSort.key === column.key;
    const sortIcon = isSorted ? (currentSort.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />) : null;
    
    return (
        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap bg-slate-50">
            <div className="flex flex-col space-y-2">
                <div className="flex items-center cursor-pointer hover:text-slate-700" onClick={() => column.sortable && onSortChange(column.key)}>
                    <span className="font-bold">{label}</span>
                    {sortIcon}
                </div>
                {column.filterable && (
                    <div className="relative">
                        <input
                            type="text"
                            placeholder={`${t('policy.search')}...`} 
                            value={currentFilters[column.key] || ''}
                            onChange={(e) => onFilterChange(column.key, e.target.value)}
                            className="text-xs p-1.5 pl-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full bg-white text-slate-800 shadow-sm"
                        />
                    </div>
                )}
            </div>
        </th>
    );
};

const CommunicationsTable = ({ data = [] }) => {
    const { t } = useTranslation(); 
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ key: 'date', direction: 'desc' }); 

    // Filter and Sort Data
    const filteredAndSortedItems = useMemo(() => {
        let finalData = data.filter(item => {
            for (const column of COMMS_COLUMNS) {
                const key = column.key;
                const filterValue = filters[key];
                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;
                
                let itemValue = item[key] || '';
                if (key === 'stakeholders' && Array.isArray(itemValue)) {
                    itemValue = itemValue.join(', ');
                } 
                
                if (!String(itemValue).toLowerCase().includes(filterValue.toLowerCase())) return false;
            }
            return true;
        });

        if (sort.key) {
            finalData.sort((a, b) => {
                const aValue = a[sort.key] || '';
                const bValue = b[sort.key] || '';
                
                // Special handling for date sorting
                if (sort.key === 'date') {
                    const dateA = new Date(aValue).getTime();
                    const dateB = new Date(bValue).getTime();
                    return (sort.direction === 'asc' ? 1 : -1) * (dateA - dateB);
                }

                return (sort.direction === 'asc' ? 1 : -1) * String(aValue).localeCompare(String(bValue));
            });
        }
        return finalData;
    }, [data, filters, sort]);

    const handleSortChange = (key) => {
        setSort(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleDownloadXLSX = () => {
        if (filteredAndSortedItems.length === 0) { alert(t('policy.no_records')); return; }
        
        const exportData = filteredAndSortedItems.map(item => {
            let row = {};
            COMMS_COLUMNS.forEach(col => {
                const header = t(col.labelKey);
                let value = item[col.key] || '';
                if (col.key === 'stakeholders') value = (value || []).join(', ');
                row[header] = value;
            });
            return row;
        });
        
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Messages');
        XLSX.writeFile(wb, 'Messages_Log.xlsx');
    };
    
    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200">
                <div className="flex items-center space-x-3">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                        {`${t('comms.log_title') || 'Message Log'} (${filteredAndSortedItems.length})`}
                    </h2>
                </div>
                <button 
                    onClick={handleDownloadXLSX} 
                    className="flex items-center space-x-2 bg-white text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-50 transition shadow-sm" 
                    title={t('policy.download_xlsx')}
                >
                    <Download className="w-4 h-4" />
                    <span>{t('policy.download_xlsx')}</span> 
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            {COMMS_COLUMNS.map(column => (
                                <TableHeaderWithControls
                                    key={column.key}
                                    column={column}
                                    currentSort={sort}
                                    onSortChange={handleSortChange}
                                    onFilterChange={handleFilterChange}
                                    currentFilters={filters}
                                    t={t} 
                                />
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {filteredAndSortedItems.length > 0 ? (
                            filteredAndSortedItems.map(item => (
                                <CommunicationsTableRow key={item.id} item={item} />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={COMMS_COLUMNS.length} className="px-6 py-8 text-center text-slate-500 italic">
                                    {t('comms.no_records') || 'No messages found.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CommunicationsTable;