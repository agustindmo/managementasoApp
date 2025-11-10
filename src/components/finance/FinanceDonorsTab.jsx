// src/components/finance/FinanceDonorsTab.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { Loader2, Gift, ArrowUp, ArrowDown } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import CardTitle from '../ui/CardTitle.jsx';
import { 
    ALL_FILTER_OPTION,
    DONORS_READONLY_TABLE_COLUMNS
} from '../../utils/constants.js';
import { useTranslation } from '../../context/TranslationContext.jsx'; 

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

// --- Cabecera de la Tabla ---
const TableHeaderWithControls = ({ column, currentSort, onSortChange, onFilterChange, currentFilters, t }) => {
    const label = t(column.labelKey); 
    const isSorted = currentSort.key === column.key;
    const sortIcon = isSorted ? (currentSort.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />) : null;
    
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
                        type={column.type === 'number' ? 'number' : 'text'}
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

// --- Componente Principal de la Tabla ---
const FinanceDonorsTab = ({ db }) => {
    const { t } = useTranslation(); 
    const [dataItems, setDataItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ key: 'date', direction: 'desc' }); 

    useEffect(() => {
        if (!db) return;
        setIsLoading(true); 
        const dataRef = ref(db, getDbPaths().financeDonations); 
        
        const unsubscribe = onValue(dataRef, (snapshot) => {
            try {
                setDataItems(snapshotToArray(snapshot));
            } catch (e) { console.error("Error processing Donation Log snapshot:", e); }
            finally { setIsLoading(false); }
        }, (error) => { console.error("Donation Log Subscription Error:", error); setIsLoading(false); });
        
        return () => unsubscribe();
    }, [db]);

    const { filteredAndSortedItems, totalSum } = useMemo(() => {
        let finalData = dataItems.filter(item => {
            for (const column of DONORS_READONLY_TABLE_COLUMNS) {
                const key = column.key;
                const filterValue = filters[key];
                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;
                let itemValue = String(item[key] || '');
                if (!itemValue.toLowerCase().includes(String(filterValue).toLowerCase())) return false;
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

    const handleSortChange = (key) => {
        setSort(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

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
            <CardTitle 
                title={`${t('finance.relations.donors_title')} (${filteredAndSortedItems.length}) | ${t('finance.fees.total')}: ${formatCurrency(totalSum)}`} 
                icon={Gift} 
            />
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-sky-800/50">
                    <thead className="bg-sky-900/70">
                        <tr>
                            {DONORS_READONLY_TABLE_COLUMNS.map(column => (
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
                    <tbody className="bg-sky-950/50 divide-y divide-sky-800/50">
                        {filteredAndSortedItems.length > 0 ? (
                            filteredAndSortedItems.map(item => (
                                <tr key={item.id} className="hover:bg-sky-900/60 transition-colors">
                                    <td className="px-6 py-3 text-sm font-medium text-white truncate max-w-[150px]" title={item.donor}>{item.donor}</td>
                                    <td className="px-6 py-3 text-sm text-gray-400 truncate max-w-[200px]" title={item.purpose}>{item.purpose}</td>
                                    <td className="px-6 py-3 text-sm text-green-400 font-semibold">{formatCurrency(item.amount)}</td>
                                    <td className="px-6 py-3 text-sm text-gray-400 whitespace-nowrap">{item.date}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={DONORS_READONLY_TABLE_COLUMNS.length} className="px-6 py-4 text-center text-gray-500">{t('press_log.no_records')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FinanceDonorsTab;