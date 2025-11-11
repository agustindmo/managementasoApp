// src/components/dashboards/BoardDirectoryDashboard.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { Loader2, Users, ArrowUp, ArrowDown } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import CardTitle from '../ui/CardTitle.jsx';
import { 
    ALL_FILTER_OPTION, 
    BOARD_DIRECTORY_COLUMNS,
    PROFILE_COLUMN_OPTIONS_MAP 
} from '../../utils/constants.js';
import { useTranslation } from '../../context/TranslationContext.jsx';

const snapshotToArray = (snapshot, idKey = 'id') => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({
        [idKey]: key,
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

// --- Componente Principal del Dashboard ---
const BoardDirectoryDashboard = ({ db, role }) => {
    const { t } = useTranslation();
    const [allProfiles, setAllProfiles] = useState({}); // Almacenado como objeto para búsqueda rápida
    const [allRoles, setAllRoles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ key: 'representative', direction: 'asc' });

    // 1. Cargar Perfiles y Roles
    useEffect(() => {
        if (!db) return;
        
        const profilesRef = ref(db, getDbPaths().userProfiles);
        const rolesRef = ref(db, getDbPaths().userRoles);
        
        let profilesLoaded = false;
        let rolesLoaded = false;
        const checkDone = () => {
            if (profilesLoaded && rolesLoaded) setIsLoading(false);
        };

        const unsubProfiles = onValue(profilesRef, (snapshot) => {
            setAllProfiles(snapshot.val() || {}); // Guardar como objeto
            profilesLoaded = true;
            checkDone();
        });

        const unsubRoles = onValue(rolesRef, (snapshot) => {
            setAllRoles(snapshotToArray(snapshot, 'uid')); // Guardar como array
            rolesLoaded = true;
            checkDone();
        });
        
        return () => {
            unsubProfiles();
            unsubRoles();
        };
    }, [db]);

    // 2. Lógica de "Join", Filtro y Orden
    const filteredAndSortedBoard = useMemo(() => {
        // Primero, encontrar todos los directores
        const directorRoles = allRoles.filter(r => r.role === 'director');

        // Luego, "unir" con los perfiles
        let boardMembers = directorRoles.map(dirRole => {
            const profile = allProfiles[dirRole.uid] || {};
            return {
                id: dirRole.uid,
                email: dirRole.email,
                company: profile.company || 'N/A',
                representative: profile.representative || 'N/A',
                activity: profile.activity || 'N/A',
            };
        });

        // Aplicar filtros
        let finalData = boardMembers.filter(item => {
            for (const column of BOARD_DIRECTORY_COLUMNS) {
                const key = column.key;
                const filterValue = filters[key];
                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;

                let itemValue = String(item[key] || '');

                if (column.optionsKey) {
                    if (itemValue !== filterValue) return false;
                } else {
                    if (!itemValue.toLowerCase().includes(filterValue.toLowerCase())) return false;
                }
            }
            return true;
        });

        // Aplicar orden
        if (sort.key) {
            finalData.sort((a, b) => {
                const aValue = a[sort.key] || '';
                const bValue = b[sort.key] || '';
                return (sort.direction === 'asc' ? 1 : -1) * String(aValue).localeCompare(String(bValue));
            });
        }
        return finalData;
    }, [allProfiles, allRoles, filters, sort]);

    const handleSortChange = (key) => {
        setSort(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // 3. Render Logic
    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="ml-3 text-sky-200">{t('profile.loading_admin')}</p>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
                <Users className="w-8 h-8 mr-3 text-sky-400" />
                {t('sidebar.board_directory')}
            </h1>
            
            <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
                <CardTitle title={`${t('sidebar.board_directory')} (${filteredAndSortedBoard.length})`} icon={Users} />
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-sky-800/50">
                        <thead className="bg-sky-900/70">
                            <tr>
                                {BOARD_DIRECTORY_COLUMNS.map(column => (
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
                            {filteredAndSortedBoard.length > 0 ? (
                                filteredAndSortedBoard.map(item => (
                                    <tr key={item.id} className="hover:bg-sky-900/60 transition-colors">
                                        <td className="px-6 py-2 text-sm text-gray-300 whitespace-nowrap max-w-[200px] truncate" title={item.company}>{item.company}</td>
                                        <td className="px-6 py-2 text-sm font-medium text-white whitespace-nowrap max-w-[200px] truncate" title={item.representative}>{item.representative}</td>
                                        <td className="px-6 py-2 text-sm text-gray-300 whitespace-nowrap max-w-[200px] truncate" title={item.email}>
                                            <a href={`mailto:${item.email}`} className="text-blue-400 hover:text-blue-300">{item.email}</a>
                                        </td>
                                        <td className="px-6 py-2 text-sm text-gray-300 whitespace-nowrap max-w-[200px] truncate" title={item.activity}>{item.activity}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={BOARD_DIRECTORY_COLUMNS.length} className="px-6 py-4 text-center text-gray-500">{t('profile.no_profiles')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BoardDirectoryDashboard;