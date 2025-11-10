// src/components/finance/FinanceBeneficiariesTab.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { Loader2, Users, ArrowUp, ArrowDown } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import CardTitle from '../ui/CardTitle.jsx';
import { 
    ALL_FILTER_OPTION,
    BENEFICIARIES_READONLY_TABLE_COLUMNS,
    PROFILE_COLUMN_OPTIONS_MAP // Reutilizamos el mapa de perfiles para el filtro de 'actividad'
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

// --- Cabecera de la Tabla ---
const TableHeaderWithControls = ({ column, currentSort, onSortChange, onFilterChange, filterOptions, currentFilters, t }) => {
    const label = t(column.labelKey); 
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

// --- Componente Principal de la Tabla ---
const FinanceBeneficiariesTab = ({ db }) => {
    const { t } = useTranslation(); 
    const [dataItems, setDataItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ key: 'company', direction: 'asc' }); 

    useEffect(() => {
        if (!db) return;
        setIsLoading(true); 
        const dataRef = ref(db, getDbPaths().userProfiles); 
        
        const unsubscribe = onValue(dataRef, (snapshot) => {
            try {
                setDataItems(snapshotToArray(snapshot));
            } catch (e) { console.error("Error processing User Profiles snapshot:", e); }
            finally { setIsLoading(false); }
        }, (error) => { console.error("User Profiles Subscription Error:", error); setIsLoading(false); });
        
        return () => unsubscribe();
    }, [db]);

    const filteredAndSortedItems = useMemo(() => {
        let finalData = dataItems.filter(item => {
            for (const column of BENEFICIARIES_READONLY_TABLE_COLUMNS) {
                const key = column.key;
                const filterValue = filters[key];
                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;
                
                let itemValue = item[key];
                if (key === 'farms') {
                    itemValue = (itemValue || []).map(f => `${f.city}, ${f.province}`).join('; ');
                }
                itemValue = String(itemValue || '');

                if (column.optionsKey) {
                    if (itemValue !== filterValue) return false;
                } else {
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
                title={`${t('finance.relations.beneficiaries_title')} (${filteredAndSortedItems.length})`}
                icon={Users} 
            />
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-sky-800/50">
                    <thead className="bg-sky-900/70">
                        <tr>
                            {BENEFICIARIES_READONLY_TABLE_COLUMNS.map(column => (
                                <TableHeaderWithControls
                                    key={column.key}
                                    column={column}
                                    currentSort={sort}
                                    onSortChange={handleSortChange}
                                    onFilterChange={handleFilterChange}
                                    filterOptions={PROFILE_COLUMN_OPTIONS_MAP} // Reutiliza el mapa de perfiles
                                    currentFilters={filters}
                                    t={t} 
                                />
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-sky-950/50 divide-y divide-sky-800/50">
                        {filteredAndSortedItems.length > 0 ? (
                            filteredAndSortedItems.map(item => {
                                const farms = (item.farms || []).map(l => `${l.city}, ${l.province}`).join('; ');
                                return (
                                    <tr key={item.id} className="hover:bg-sky-900/60 transition-colors">
                                        <td className="px-6 py-3 text-sm font-medium text-white truncate max-w-[150px]" title={item.company}>{item.company}</td>
                                        <td className="px-6 py-3 text-sm text-gray-400 truncate max-w-[150px]" title={item.representative}>{item.representative}</td>
                                        <td className="px-6 py-3 text-sm text-gray-400 truncate max-w-[150px]" title={item.activity}>{item.activity}</td>
                                        <td className="px-6 py-3 text-sm text-gray-400 truncate max-w-[200px]" title={farms}>{farms}</td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr><td colSpan={BENEFICIARIES_READONLY_TABLE_COLUMNS.length} className="px-6 py-4 text-center text-gray-500">{t('profile.no_profiles')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FinanceBeneficiariesTab;