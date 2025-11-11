import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { Loader2, Users, ArrowUp, ArrowDown, Building, Contact, Home } from 'lucide-react'; // Import new icons
import { getDbPaths } from '../../services/firebase.js';
import CardTitle from '../ui/CardTitle.jsx';
import { useTranslation } from '../../context/TranslationContext.jsx';
import { 
    ALL_FILTER_OPTION, 
    // Importar las nuevas constantes de columna
    MEMBERS_PROFILE_TABLE_COLUMNS,
    FARMS_PROFILE_TABLE_COLUMNS,
    CONTACTS_PROFILE_TABLE_COLUMNS,
    PROFILE_COLUMN_OPTIONS_MAP
} from '../../utils/constants.js';

// --- Componente de Botón de Pestaña (Copiado de otros dashboards) ---
const TabButton = ({ isActive, onClick, children, icon: Icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold transition-all duration-300 rounded-lg 
            ${isActive 
                ? 'bg-sky-700 text-white shadow-md' 
                : 'text-gray-400 hover:bg-black/50 hover:text-white'
            }`
        }
    >
        <Icon className="w-4 h-4" />
        <span>{children}</span>
    </button>
);


// --- Cabecera de la Tabla Genérica ---
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
                                <option key={option} value={option} className="bg-sky-900">
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
    const [userProfiles, setUserProfiles] = useState([]); // Datos base
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('members');

    // --- Estados de Filtro y Orden para cada Pestaña ---
    const [memberFilters, setMemberFilters] = useState({});
    const [memberSort, setMemberSort] = useState({ key: 'company', direction: 'asc' });
    
    const [farmFilters, setFarmFilters] = useState({});
    const [farmSort, setFarmSort] = useState({ key: 'company', direction: 'asc' });

    const [contactFilters, setContactFilters] = useState({});
    const [contactSort, setContactSort] = useState({ key: 'company', direction: 'asc' });

    // 1. Cargar todos los perfiles de usuario (incluyendo email)
    useEffect(() => {
        if (!db) {
            setIsLoading(true);
            return;
        }
        
        const profilesRef = ref(db, getDbPaths().userProfiles);
        
        const unsubscribe = onValue(profilesRef, (snapshot) => {
            try {
                const profilesSnap = snapshot.val() || {};
                
                // Cargar roles para obtener emails
                const rolesRef = ref(db, getDbPaths().userRoles);
                onValue(rolesRef, (rolesSnapshot) => {
                    const rolesVal = rolesSnapshot.val() || {};
                    const profiles = Object.keys(profilesSnap).map(uid => ({
                        id: uid,
                        email: rolesVal[uid]?.email || 'N/A', 
                        ...profilesSnap[uid],
                    }));
                    setUserProfiles(profiles);
                    setIsLoading(false);
                }, { onlyOnce: true }); // Solo necesitamos los roles una vez

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

    // 2. Aplanar datos para Pestañas de Fincas y Contactos
    const flattenedFarms = useMemo(() => {
        return userProfiles.flatMap(p => 
            (p.farms || []).map(f => ({
                ...f,
                company: p.company || p.email, // Usar compañía o email como referencia
                profileId: p.id
            }))
        );
    }, [userProfiles]);

    const flattenedContacts = useMemo(() => {
         return userProfiles.flatMap(p => 
            (p.contacts || []).map(c => ({
                ...c,
                company: p.company || p.email,
                profileId: p.id
            }))
        );
    }, [userProfiles]);


    // 3. Lógica de filtro y orden para CADA pestaña
    
    // Miembros
    const filteredAndSortedMembers = useMemo(() => {
        let finalData = userProfiles.filter(item => {
            for (const column of MEMBERS_PROFILE_TABLE_COLUMNS) {
                const key = column.key;
                const filterValue = memberFilters[key];
                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;
                let itemValue = item[key];
                if (column.type === 'boolean') itemValue = itemValue ? "Yes" : "No";
                else if (column.type === 'cert_array') itemValue = (itemValue || []).map(c => c.name).join(', ');
                itemValue = String(itemValue || '');
                if (column.optionsKey) {
                    if (itemValue !== filterValue) return false;
                } else {
                    if (!itemValue.toLowerCase().includes(filterValue.toLowerCase())) return false;
                }
            }
            return true;
        });
        if (memberSort.key) {
            finalData.sort((a, b) => {
                const aValue = a[memberSort.key] || '';
                const bValue = b[memberSort.key] || '';
                return (memberSort.direction === 'asc' ? 1 : -1) * String(aValue).localeCompare(String(bValue));
            });
        }
        return finalData;
    }, [userProfiles, memberFilters, memberSort]);

    // Fincas
    const filteredAndSortedFarms = useMemo(() => {
        let finalData = flattenedFarms.filter(item => {
            for (const column of FARMS_PROFILE_TABLE_COLUMNS) {
                const key = column.key;
                const filterValue = farmFilters[key];
                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;
                let itemValue = item[key];
                itemValue = String(itemValue || '');
                if (column.optionsKey) {
                    if (itemValue !== filterValue) return false;
                } else {
                    if (!itemValue.toLowerCase().includes(filterValue.toLowerCase())) return false;
                }
            }
            return true;
        });
        if (farmSort.key) {
            finalData.sort((a, b) => {
                const aValue = a[farmSort.key] || (a[farmSort.key] === 0 ? 0 : '');
                const bValue = b[farmSort.key] || (b[farmSort.key] === 0 ? 0 : '');
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                     return (farmSort.direction === 'asc' ? 1 : -1) * (aValue - bValue);
                }
                return (farmSort.direction === 'asc' ? 1 : -1) * String(aValue).localeCompare(String(bValue));
            });
        }
        return finalData;
    }, [flattenedFarms, farmFilters, farmSort]);

    // Contactos
    const filteredAndSortedContacts = useMemo(() => {
        let finalData = flattenedContacts.filter(item => {
            for (const column of CONTACTS_PROFILE_TABLE_COLUMNS) {
                const key = column.key;
                const filterValue = contactFilters[key];
                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;
                let itemValue = item[key];
                itemValue = String(itemValue || '');
                if (column.optionsKey) {
                    if (itemValue !== filterValue) return false;
                } else {
                    if (!itemValue.toLowerCase().includes(filterValue.toLowerCase())) return false;
                }
            }
            return true;
        });
        if (contactSort.key) {
            finalData.sort((a, b) => {
                const aValue = a[contactSort.key] || '';
                const bValue = b[contactSort.key] || '';
                return (contactSort.direction === 'asc' ? 1 : -1) * String(aValue).localeCompare(String(bValue));
            });
        }
        return finalData;
    }, [flattenedContacts, contactFilters, contactSort]);


    // Helper para renderizar celda de certificaciones
    const renderCertCell = (item, col) => {
        const value = item[col.key];
        if (col.type === 'cert_array') {
            return (value || []).map(c => `${c.name} (${c.hectares || 0} ha)`).join('; ');
        }
        if (col.type === 'boolean') {
            return value ? <span className="text-green-400">{t('profile.yes')}</span> : <span className="text-gray-500">{t('profile.no')}</span>;
        }
        return String(value || '');
    };


    // 4. Render Logic
    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="ml-3 text-sky-200">{t('profile.loading_admin')}</p>
            </div>
        );
    }
    
    // Función para renderizar la tabla activa
    const renderActiveTable = () => {
        switch(activeTab) {
            case 'members':
                return (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-sky-800/50">
                            <thead className="bg-sky-900/70">
                                <tr>
                                    {MEMBERS_PROFILE_TABLE_COLUMNS.map(column => (
                                        <TableHeaderWithControls
                                            key={column.key}
                                            column={column}
                                            currentSort={memberSort}
                                            onSortChange={(key) => setMemberSort(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }))}
                                            onFilterChange={(key, value) => setMemberFilters(prev => ({ ...prev, [key]: value }))}
                                            filterOptions={PROFILE_COLUMN_OPTIONS_MAP}
                                            currentFilters={memberFilters}
                                            t={t}
                                        />
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-sky-950/50 divide-y divide-sky-800/50">
                                {filteredAndSortedMembers.length > 0 ? (
                                    filteredAndSortedMembers.map(item => (
                                        <tr key={item.id} className="hover:bg-sky-900/60 transition-colors">
                                            {MEMBERS_PROFILE_TABLE_COLUMNS.map(col => (
                                                <td 
                                                    key={col.key} 
                                                    className="px-6 py-2 text-sm text-gray-300 whitespace-nowrap max-w-[200px] truncate"
                                                    title={renderCertCell(item, col)}
                                                >
                                                    {renderCertCell(item, col)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={MEMBERS_PROFILE_TABLE_COLUMNS.length} className="px-6 py-4 text-center text-gray-500">{t('profile.no_profiles')}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                );
            case 'farms':
                 return (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-sky-800/50">
                            <thead className="bg-sky-900/70">
                                <tr>
                                    {FARMS_PROFILE_TABLE_COLUMNS.map(column => (
                                        <TableHeaderWithControls
                                            key={column.key}
                                            column={column}
                                            currentSort={farmSort}
                                            onSortChange={(key) => setFarmSort(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }))}
                                            onFilterChange={(key, value) => setFarmFilters(prev => ({ ...prev, [key]: value }))}
                                            filterOptions={PROFILE_COLUMN_OPTIONS_MAP}
                                            currentFilters={farmFilters}
                                            t={t}
                                        />
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-sky-950/50 divide-y divide-sky-800/50">
                                {filteredAndSortedFarms.length > 0 ? (
                                    filteredAndSortedFarms.map((item, index) => (
                                        <tr key={item.profileId + index} className="hover:bg-sky-900/60 transition-colors">
                                            <td className="px-6 py-2 text-sm text-gray-300 whitespace-nowrap max-w-[200px] truncate" title={item.company}>{item.company}</td>
                                            <td className="px-6 py-2 text-sm text-gray-300 whitespace-nowrap max-w-[150px] truncate" title={item.province}>{item.province}</td>
                                            <td className="px-6 py-2 text-sm text-gray-300 whitespace-nowrap max-w-[150px] truncate" title={item.city}>{item.city}</td>
                                            <td className="px-6 py-2 text-sm text-gray-300 whitespace-nowrap" title={item.hectares}>{item.hectares || 0}</td>
                                            <td className="px-6 py-2 text-sm text-gray-300 whitespace-nowrap" title={item.workers}>{item.workers || 0}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={FARMS_PROFILE_TABLE_COLUMNS.length} className="px-6 py-4 text-center text-gray-500">{t('profile.no_farms')}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                );
            case 'contacts':
                 return (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-sky-800/50">
                            <thead className="bg-sky-900/70">
                                <tr>
                                    {CONTACTS_PROFILE_TABLE_COLUMNS.map(column => (
                                        <TableHeaderWithControls
                                            key={column.key}
                                            column={column}
                                            currentSort={contactSort}
                                            onSortChange={(key) => setContactSort(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }))}
                                            onFilterChange={(key, value) => setContactFilters(prev => ({ ...prev, [key]: value }))}
                                            filterOptions={PROFILE_COLUMN_OPTIONS_MAP}
                                            currentFilters={contactFilters}
                                            t={t}
                                        />
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-sky-950/50 divide-y divide-sky-800/50">
                                {filteredAndSortedContacts.length > 0 ? (
                                    filteredAndSortedContacts.map((item, index) => (
                                        <tr key={item.profileId + index} className="hover:bg-sky-900/60 transition-colors">
                                            <td className="px-6 py-2 text-sm text-gray-300 whitespace-nowrap max-w-[200px] truncate" title={item.company}>{item.company}</td>
                                            <td className="px-6 py-2 text-sm text-gray-300 whitespace-nowrap max-w-[150px] truncate" title={item.contact_name}>{item.contact_name}</td>
                                            <td className="px-6 py-2 text-sm text-gray-300 whitespace-nowrap max-w-[200px] truncate" title={item.contact_email}>{item.contact_email}</td>
                                            <td className="px-6 py-2 text-sm text-gray-300 whitespace-nowrap max-w-[150px] truncate" title={item.contact_phone}>{item.contact_phone}</td>
                                            <td className="px-6 py-2 text-sm text-gray-300 whitespace-nowrap max-w-[150px] truncate" title={item.contact_area}>{item.contact_area}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={CONTACTS_PROFILE_TABLE_COLUMNS.length} className="px-6 py-4 text-center text-gray-500">{t('profile.no_contacts')}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                );
            default:
                return null;
        }
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
                <Users className="w-8 h-8 mr-3 text-sky-400" />
                {t('profile.admin_title')}
            </h1>
            
            {/* Contenedor de Pestañas */}
            <div className="mb-6 p-2 rounded-xl border border-sky-700/50 bg-black/40 backdrop-blur-lg flex flex-wrap gap-2">
                <TabButton
                    isActive={activeTab === 'members'}
                    onClick={() => setActiveTab('members')}
                    icon={Building}
                >
                    {t('profile.tab.members')} ({filteredAndSortedMembers.length})
                </TabButton>
                <TabButton
                    isActive={activeTab === 'farms'}
                    onClick={() => setActiveTab('farms')}
                    icon={Home}
                >
                    {t('profile.tab.farms')} ({filteredAndSortedFarms.length})
                </TabButton>
                <TabButton
                    isActive={activeTab === 'contacts'}
                    onClick={() => setActiveTab('contacts')}
                    icon={Contact}
                >
                    {t('profile.tab.contacts')} ({filteredAndSortedContacts.length})
                </TabButton>
            </div>

            {/* Contenedor de la Tabla Activa */}
            <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
                {/* El CardTitle se renderiza dentro de la función de renderizado de tabla */}
                {renderActiveTable()}
            </div>
        </div>
    );
};

export default AdminProfileDashboard;