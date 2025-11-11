// src/components/dashboards/MediaDirectoryDashboard.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { Loader2, Radio, ArrowUp, ArrowDown } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import CardTitle from '../ui/CardTitle.jsx';
import { 
    ALL_FILTER_OPTION, 
    MEDIA_STAKEHOLDER_TABLE_COLUMNS,
    MEDIA_STAKEHOLDER_COLUMN_OPTIONS_MAP
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
    
    if (column.key === 'actions') return null; // Ocultar acciones
    
    const isSorted = currentSort.key === column.key;
    const sortIcon = isSorted ? (currentSort.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />) : null;
    
    const isDropdown = !!column.optionsKey;
    let options = isDropdown ? (filterOptions[column.optionsKey] || []) : [];
    
    const isTextInputFilter = !isDropdown;

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
                            placeholder={`${t('stakeholder.search_placeholder')} ${label}`} 
                            value={currentFilters[column.key] || ''}
                            onChange={(e) => onFilterChange(column.key, e.target.value)}
                            className="text-xs p-1 border border-sky-700 bg-sky-950/50 text-white rounded-lg focus:ring-sky-500 focus:border-sky-500 min-w-[80px]"
                        />
                    ) : (
                        <select
                            value={currentFilters[column.key] || ALL_FILTER_OPTION}
                            onChange={(e) => onFilterChange(column.key, e.target.value)}
                            className="text-xs p-1 border border-sky-700 bg-sky-950/50 text-white rounded-lg focus:ring-sky-500 focus:border-sky-500 min-w-[80px]"
                        >
                            <option value={ALL_FILTER_OPTION} className="bg-sky-900">{t('stakeholder.category.all')}</option>
                            {options.map(option => (
                                <option key={option.value || option} value={option.value || option} className="bg-sky-900">
                                    {t(option.label || `press_log.format_opts.${option.toLowerCase()}` || option)}
                                </option>
                            ))}
                        </select>
                    )
                )}
            </div>
        </th>
    );
};

// --- Componente Principal del Dashboard ---
const MediaDirectoryDashboard = ({ db }) => {
    const { t } = useTranslation();
    const [mediaStakeholders, setMediaStakeholders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ key: 'name', direction: 'asc' });

    useEffect(() => {
        if (!db) return;
        
        const stakeholdersRef = ref(db, getDbPaths().mediaStakeholders);
        const unsubStakeholders = onValue(stakeholdersRef, (snapshot) => {
            try { setMediaStakeholders(snapshotToArray(snapshot)); }
            catch (e) { console.error("Media Stakeholders fetch error:", e); }
            finally { setIsLoading(false); }
        }, (error) => { console.error("Media Stakeholders Subscription Error:", error); setIsLoading(false); });

        return () => unsubStakeholders();
    }, [db]);

    const filteredStakeholders = useMemo(() => {
        let currentData = mediaStakeholders; 
        
        currentData = currentData.filter(item => {
            for (const key in filters) {
                const filterValue = filters[key];
                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;
                const itemValue = String(item[key] || '');
                if (!itemValue.toLowerCase().includes(filterValue.toLowerCase())) return false;
            }
            return true;
        });

        if (sort.key) {
            currentData.sort((a, b) => {
                const aValue = a[sort.key] || '';
                const bValue = b[sort.key] || '';
                return (sort.direction === 'asc' ? 1 : -1) * String(aValue).localeCompare(String(bValue));
            });
        }
        
        return currentData; 
    }, [mediaStakeholders, filters, sort]);

    const handleSortChange = (key) => {
        setSort(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    };
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="ml-3 text-sky-200">{t('stakeholder.loading')}</p>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
                <Radio className="w-8 h-8 mr-3 text-sky-400" />
                {t('sidebar.media_directory')}
            </h1>
            
            <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
                <CardTitle title={`${t('sidebar.media_directory')} (${filteredStakeholders.length})`} icon={Radio} />
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-sky-800/50">
                        <thead className="bg-sky-900/70">
                            <tr>
                                {MEDIA_STAKEHOLDER_TABLE_COLUMNS.map(column => (
                                    column.key !== 'actions' && // Ocultar columna de acciones
                                    <TableHeaderWithControls
                                        key={column.key}
                                        column={column}
                                        currentSort={sort}
                                        onSortChange={handleSortChange}
                                        onFilterChange={handleFilterChange}
                                        filterOptions={MEDIA_STAKEHOLDER_COLUMN_OPTIONS_MAP}
                                        currentFilters={filters}
                                        t={t}
                                    />
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-sky-950/50 divide-y divide-sky-800/50">
                            {filteredStakeholders.length > 0 ? (
                                filteredStakeholders.map((item) => (
                                    <tr key={item.id} className="hover:bg-sky-900/60 transition-colors">
                                        <td className="px-6 py-2 text-sm font-medium text-white truncate max-w-[150px]" title={item.name}>{item.name}</td>
                                        <td className="px-6 py-2 text-sm text-gray-400 capitalize">{t(`press_log.format_opts.${item.type.toLowerCase()}`)}</td>
                                        <td className="px-6 py-2 text-sm text-gray-400 capitalize">{t(item.position)}</td>
                                        <td className="px-6 py-2 text-sm text-gray-400 capitalize">{item.scope}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={MEDIA_STAKEHOLDER_TABLE_COLUMNS.length - 1} className="px-6 py-4 text-center text-gray-500">{t('stakeholder.no_stakeholders_found')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MediaDirectoryDashboard;