import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { Loader2, Users, ArrowUp, ArrowDown } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import CardTitle from '../ui/CardTitle.jsx';
import { useTranslation } from '../../context/TranslationContext.jsx';
import { 
    ALL_FILTER_OPTION, 
    PROFILE_TABLE_COLUMNS,
    PROFILE_COLUMN_OPTIONS_MAP
} from '../../utils/constants.js';

// Convertir snapshot de perfiles
const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    // El 'id' (UID del usuario) es la clave del objeto
    return Object.keys(val).map(key => ({
        id: key,
        ...val[key],
    }));
};

// Componente de cabecera de tabla
const TableHeaderWithControls = ({ column, currentSort, onSortChange, onFilterChange, filterOptions, currentFilters, t }) => {
    const label = t(column.labelKey); 
    
    const isSorted = currentSort.key === column.key;
    const sortIcon = isSorted ? (currentSort.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />) : null;
    
    let options = [];
    if (column.filterable && column.optionsKey) {
         options = filterOptions[column.optionsKey] || [];
    }
    
    // TAREA 2: Actualizado - 'contacts_array', 'farms_array' y 'cert_array' no son inputs de texto
    const isTextInputFilter = !column.optionsKey && 
                              column.type !== 'contacts_array' && 
                              column.type !== 'farms_array' && 
                              column.type !== 'cert_array';

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
                        // Renderizar select para filtros con optionsKey (excluyendo tipos de array complejos)
                        column.optionsKey &&
                        <select
                            value={currentFilters[column.key] || ALL_FILTER_OPTION}
                            onChange={(e) => onFilterChange(column.key, e.target.value)}
                            className="text-xs p-1 border border-sky-700 bg-sky-950/50 text-white rounded-lg focus:ring-sky-500 focus:border-sky-500 min-w-[100px]"
                        >
                            <option value={ALL_FILTER_OPTION} className="bg-sky-900">{ALL_FILTER_OPTION}</option>
                            {options.map(option => (
                                <option key={option} value={option} className="bg-sky-900">
                                    {/* Manejar traducción simple para 'Yes'/'No' */}
                                    {column.optionsKey === 'boolean' ? t(option === 'Yes' ? 'profile.yes' : 'profile.no') : option}
                                </option>
                            ))}
                        </select>
                    )
                )}
            </div>
        </th>
    );
};


const AdminProfileDashboard = ({ db }) => {
    const { t } = useTranslation();
    const [userProfiles, setUserProfiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ key: 'company', direction: 'asc' });

    // 1. Cargar todos los perfiles de usuario
    useEffect(() => {
        if (!db) {
            setIsLoading(true);
            return;
        }
        
        const profilesRef = ref(db, getDbPaths().userProfiles);
        
        const unsubscribe = onValue(profilesRef, (snapshot) => {
            try {
                // TAREA 2: Mapear 'email' desde la clave (UID) al objeto
                // Asumimos que los 'userRoles' tienen el email, y los 'userProfiles' están bajo el UID
                const profilesSnap = snapshot.val() || {};
                
                const rolesRef = ref(db, getDbPaths().userRoles);
                onValue(rolesRef, (rolesSnapshot) => {
                    const rolesVal = rolesSnapshot.val() || {};
                    const profiles = Object.keys(profilesSnap).map(uid => ({
                        id: uid,
                        email: rolesVal[uid]?.email || 'N/A', // Añadir email desde userRoles
                        ...profilesSnap[uid],
                    }));
                    setUserProfiles(profiles);
                    setIsLoading(false);
                });

            } catch (e) {
                console.error("Error processing user profiles snapshot:", e);
                setIsLoading(false);
            }
        }, (error) => {
             console.error("User profiles subscription error:", error);
             setIsLoading(false);
        });
        
        return () => unsubscribe();
    }, [db]);

    // 2. Lógica de filtro y orden
    const filteredAndSortedProfiles = useMemo(() => {
        let finalData = userProfiles.filter(item => {
            for (const column of PROFILE_TABLE_COLUMNS) {
                const key = column.key;
                const filterValue = filters[key];
                
                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;

                let itemValue = item[key];
                
                if (column.type === 'boolean') {
                    itemValue = itemValue ? "Yes" : "No";
                }
                // TAREA 2: Lógica de filtro actualizada para arrays de objetos
                else if (column.type === 'cert_array') {
                    itemValue = (itemValue || []).map(c => c.name).join(', ');
                }
                else if (column.type === 'contacts_array') {
                    itemValue = (itemValue || []).map(c => `${c.contact_name} ${c.contact_email} ${c.contact_area}`).join(', ');
                }
                else if (column.type === 'farms_array') {
                    itemValue = (itemValue || []).map(f => `${f.province} ${f.city}`).join(', ');
                }

                itemValue = String(itemValue || '');

                if (column.optionsKey) {
                    if (itemValue !== filterValue) return false;
                } else {
                    if (!itemValue.toLowerCase().includes(filterValue.toLowerCase())) return false;
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
    }, [userProfiles, filters, sort]);

    const handleSortChange = (key) => {
        setSort(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // TAREA 2: Helper para renderizar celdas actualizado
    const renderCellContent = (item, col) => {
        const value = item[col.key];
        
        if (col.type === 'boolean') {
            return value ? 
                <span className="text-green-400">{t('profile.yes')}</span> : 
                <span className="text-gray-500">{t('profile.no')}</span>;
        }
        if (col.type === 'cert_array') {
            return (value || []).map(c => `${c.name} (${c.hectares || 0} ha)`).join('; ');
        }
        if (col.type === 'contacts_array') {
            return (value || []).map(c => `${c.contact_name} (${c.contact_area})`).join('; ');
        }
        if (col.type === 'farms_array') {
            return (value || []).map(f => `${f.city}, ${f.province} (${f.hectares || 0} ha, ${f.workers || 0} pp)`)
                                .join('; ');
        }
        return String(value || '');
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
                {t('profile.admin_title')}
            </h1>
            
            <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
                <CardTitle title={`${t('profile.admin_records_title')} (${filteredAndSortedProfiles.length})`} icon={Users} />
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-sky-800/50">
                        <thead className="bg-sky-900/70">
                            <tr>
                                {PROFILE_TABLE_COLUMNS.map(column => (
                                    <TableHeaderWithControls
                                        key={column.key}
                                        column={column}
                                        currentSort={sort}
                                        onSortChange={handleSortChange}
                                        onFilterChange={handleFilterChange}
                                        filterOptions={PROFILE_COLUMN_OPTIONS_MAP}
                                        currentFilters={filters}
                                        t={t}
                                    />
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-sky-950/50 divide-y divide-sky-800/50">
                            {filteredAndSortedProfiles.length > 0 ? (
                                filteredAndSortedProfiles.map(item => (
                                    <tr key={item.id} className="hover:bg-sky-900/60 transition-colors">
                                        {PROFILE_TABLE_COLUMNS.map(col => (
                                            <td 
                                                key={col.key} 
                                                className="px-6 py-2 text-sm text-gray-300 whitespace-nowrap max-w-[200px] truncate"
                                                title={renderCellContent(item, col)}
                                            >
                                                {renderCellContent(item, col)}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={PROFILE_TABLE_COLUMNS.length} className="px-6 py-4 text-center text-gray-500">{t('profile.no_profiles')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminProfileDashboard;