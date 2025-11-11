// src/components/dashboards/MemberDirectoryDashboard.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { Loader2, Users, ArrowUp, ArrowDown, BookUser, Mail, Building, Briefcase } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import CardTitle from '../ui/CardTitle.jsx';
import { 
    ALL_FILTER_OPTION, 
    MEMBER_DIRECTORY_COLUMNS,
    PROFILE_COLUMN_OPTIONS_MAP
} from '../../utils/constants.js';
import { useTranslation } from '../../context/TranslationContext.jsx';

// --- Helper Components ---

const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({
        id: key,
        email: 'N/A', // Placeholder, se llenará después
        ...val[key],
    }));
};

const TableHeaderWithControls = ({ column, currentSort, onSortChange, onFilterChange, filterOptions, currentFilters, t }) => {
    const label = t(column.labelKey); 
    const isSorted = currentSort.key === column.key;
    const sortIcon = isSorted ? (currentSort.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />) : null;
    
    let options = [];
    if (column.filterable && column.optionsKey) {
         options = filterOptions[column.optionsKey] || [];
    }
    
    const isTextInputFilter = !column.optionsKey && column.type !== 'contacts_array';

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
                        column.optionsKey &&
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

// --- Componente de Tarjeta (para Usuarios) ---
const MemberCard = ({ member, t }) => (
    <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden flex flex-col p-4 space-y-3">
        <h3 className="text-lg font-bold text-white">{member.company || t('profile.col.company')}</h3>
        <p className="text-sm text-sky-300 font-medium">{member.representative || t('profile.col.representative')}</p>
        
        <div className="flex items-center text-gray-300">
            <Mail className="w-4 h-4 mr-2 text-sky-400" />
            <a href={`mailto:${member.email}`} className="text-sm truncate hover:text-sky-300">{member.email}</a>
        </div>
        <div className="flex items-center text-gray-300">
            <Briefcase className="w-4 h-4 mr-2 text-sky-400" />
            <span className="text-sm">{member.activity}</span>
        </div>
        
        {member.contacts && member.contacts.length > 0 && (
            <div className="pt-2 border-t border-sky-800/50">
                <h4 className="text-xs font-semibold text-gray-400 mb-1">{t('profile.col.contacts')}</h4>
                <p className="text-sm text-gray-300 truncate" title={(member.contacts || []).map(c => `${c.contact_name} (${c.contact_area})`).join('; ')}>
                    {(member.contacts || []).map(c => `${c.contact_name} (${c.contact_area})`).join('; ')}
                </p>
            </div>
        )}
    </div>
);


// --- Componente Principal del Dashboard ---
const MemberDirectoryDashboard = ({ db, role }) => {
    const { t } = useTranslation();
    const [userProfiles, setUserProfiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ key: 'company', direction: 'asc' });

    // Determinar el modo de vista basado en el rol
    const isCardView = role === 'user' || role === 'userinvitee';

    // 1. Cargar Perfiles y Roles (para emails)
    useEffect(() => {
        if (!db) return;
        
        const profilesRef = ref(db, getDbPaths().userProfiles);
        const rolesRef = ref(db, getDbPaths().userRoles);
        
        let profilesData = [];
        let rolesData = {};
        let profilesLoaded = false;
        let rolesLoaded = false;

        const combineData = () => {
            if (!profilesLoaded || !rolesLoaded) return;
            const combined = profilesData.map(profile => ({
                ...profile,
                email: rolesData[profile.id]?.email || 'N/A',
            }));
            setUserProfiles(combined);
            setIsLoading(false);
        };

        const unsubProfiles = onValue(profilesRef, (snapshot) => {
            profilesData = snapshotToArray(snapshot);
            profilesLoaded = true;
            combineData();
        });

        const unsubRoles = onValue(rolesRef, (snapshot) => {
            rolesData = snapshot.val() || {};
            rolesLoaded = true;
            combineData();
        });
        
        return () => {
            unsubProfiles();
            unsubRoles();
        };
    }, [db]);

    // 2. Lógica de filtro y orden
    const filteredAndSortedProfiles = useMemo(() => {
        let finalData = userProfiles.filter(item => {
            for (const column of MEMBER_DIRECTORY_COLUMNS) {
                const key = column.key;
                const filterValue = filters[key];
                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;

                let itemValue = item[key];
                
                if (column.type === 'contacts_array') {
                    itemValue = (itemValue || []).map(c => `${c.contact_name} ${c.contact_email} ${c.contact_area}`).join(', ');
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
        setSort(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const renderCellContent = (item, col) => {
        const value = item[col.key];
        if (col.type === 'contacts_array') {
            return (value || []).map(c => `${c.contact_name} (${c.contact_area})`).join('; ');
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
                <BookUser className="w-8 h-8 mr-3 text-sky-400" />
                {t('sidebar.member_directory')}
            </h1>
            
            <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
                <CardTitle title={`${t('profile.admin_records_title')} (${filteredAndSortedProfiles.length})`} icon={Users} />
                
                {isCardView ? (
                    // --- VISTA DE TARJETAS (para 'user' y 'userinvitee') ---
                    <div className="p-4">
                        {/* Controles de filtro simplificados para tarjetas */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 rounded-lg bg-sky-900/70">
                            <InputField 
                                label={t('policy.search')}
                                name="nameSearch"
                                value={filters.representative || ''}
                                onChange={(e) => handleFilterChange('representative', e.target.value)}
                                required={false}
                            />
                            <InputField 
                                label={t('profile.col.company')}
                                name="companySearch"
                                value={filters.company || ''}
                                onChange={(e) => handleFilterChange('company', e.target.value)}
                                required={false}
                            />
                            <SelectField
                                label={t('profile.col.activity')}
                                name="activityFilter"
                                value={filters.activity || ALL_FILTER_OPTION}
                                onChange={(e) => handleFilterChange('activity', e.target.value)}
                                options={[ALL_FILTER_OPTION, ...PROFILE_COLUMN_OPTIONS_MAP['activity']]}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredAndSortedProfiles.length > 0 ? (
                                filteredAndSortedProfiles.map(item => (
                                    <MemberCard key={item.id} member={item} t={t} />
                                ))
                            ) : (
                                <p className="text-center text-gray-500 p-8 col-span-full">{t('profile.no_profiles')}</p>
                            )}
                        </div>
                    </div>
                ) : (
                    // --- VISTA DE TABLA (para 'admin', 'director', 'directorinvitee') ---
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-sky-800/50">
                            <thead className="bg-sky-900/70">
                                <tr>
                                    {MEMBER_DIRECTORY_COLUMNS.map(column => (
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
                                            {MEMBER_DIRECTORY_COLUMNS.map(col => (
                                                <td 
                                                    key={col.key} 
                                                    className="px-6 py-2 text-sm text-gray-300 whitespace-nowrap max-w-[200px] truncate"
                                                    title={renderCellContent(item, col)}
                                                >
                                                    {col.key === 'email' ? (
                                                        <a href={`mailto:${item.email}`} className="text-blue-400 hover:text-blue-300">{item.email}</a>
                                                    ) : (
                                                        renderCellContent(item, col)
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={MEMBER_DIRECTORY_COLUMNS.length} className="px-6 py-4 text-center text-gray-500">{t('profile.no_profiles')}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MemberDirectoryDashboard;