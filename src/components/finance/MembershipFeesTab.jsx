// src/components/finance/MembershipFeesTab.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue, update, serverTimestamp } from 'firebase/database';
import { Users, Loader2, Save, ArrowUp, ArrowDown } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import { useTranslation } from '../../context/TranslationContext.jsx';
import CardTitle from '../ui/CardTitle.jsx';
import InputField from '../ui/InputField.jsx';
import {
    ALL_FILTER_OPTION,
    MEMBERSHIP_FEE_TABLE_COLUMNS,
    MEMBERSHIP_FEE_COLUMN_OPTIONS_MAP
} from '../../utils/constants.js';

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
const TableHeaderWithControls = ({ column, currentSort, onSortChange, onFilterChange, filterOptions, currentFilters, t }) => {
    const label = t(column.labelKey); 

    if (column.key === 'actions' || column.key === 'feeAmount') {
        return <th key={column.key} className="px-6 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider">{label}</th>;
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
                                <option key={option} value={option} className="bg-sky-900">
                                    {t(`finance.fees.type_opts.${option.toLowerCase()}`)}
                                </option>
                            ))}
                        </select>
                    )
                )}
            </div>
        </th>
    );
};


const MembershipFeesTab = ({ db, userId }) => {
    const { t } = useTranslation();
    const [profiles, setProfiles] = useState([]);
    const [fees, setFees] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ key: 'company', direction: 'asc' });

    // 1. Cargar perfiles y cuotas
    useEffect(() => {
        if (!db) return;
        
        const profilesRef = ref(db, getDbPaths().userProfiles);
        const feesRef = ref(db, getDbPaths().financeMembershipFees);
        
        let profilesLoaded = false;
        let feesLoaded = false;
        const checkDone = () => {
            if (profilesLoaded && feesLoaded) setIsLoading(false);
        };

        const unsubProfiles = onValue(profilesRef, (snapshot) => {
            setProfiles(snapshotToArray(snapshot));
            profilesLoaded = true;
            checkDone();
        });

        const unsubFees = onValue(feesRef, (snapshot) => {
            setFees(snapshot.val() || {});
            feesLoaded = true;
            checkDone();
        });

        return () => {
            unsubProfiles();
            unsubFees();
        };
    }, [db]);

    // 2. Combinar datos de perfil y cuotas
    const enhancedProfiles = useMemo(() => {
        const exporterActivities = ["Exportador", "productor-exportador"];
        return profiles.map(profile => {
            const feeObj = fees[profile.id] || {};
            const feeAmount = parseFloat(feeObj.amount) || 0;
            
            const type = exporterActivities.includes(profile.activity) 
                ? "Exporter" 
                : "Adherent";
                
            return {
                ...profile,
                feeAmount,
                membershipType: type
            };
        });
    }, [profiles, fees]);

    // 3. Lógica de Filtro, Orden y Suma Total
    const { filteredAndSortedProfiles, totalSum } = useMemo(() => {
        let finalData = enhancedProfiles.filter(item => {
            for (const column of MEMBERSHIP_FEE_TABLE_COLUMNS) {
                const key = column.key;
                const filterValue = filters[key];
                
                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;

                let itemValue = item[key];
                
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
                const aValue = a[sort.key] || (sort.key === 'feeAmount' ? 0 : '');
                const bValue = b[sort.key] || (sort.key === 'feeAmount' ? 0 : '');
                
                if (sort.key === 'feeAmount') {
                    return (sort.direction === 'asc' ? 1 : -1) * (aValue - bValue);
                }
                return (sort.direction === 'asc' ? 1 : -1) * String(aValue).localeCompare(String(bValue));
            });
        }
        
        const sum = finalData.reduce((acc, item) => acc + item.feeAmount, 0);
        
        return { filteredAndSortedProfiles: finalData, totalSum: sum };
    }, [enhancedProfiles, filters, sort]);


    // 4. Handlers
    const handleSortChange = (key) => {
        setSort(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleFeeChange = (profileId, value) => {
        setFees(prev => ({
            ...prev,
            [profileId]: {
                ...prev[profileId],
                amount: value // Guardar como string, se parseará al guardar
            }
        }));
    };
    
    const handleSaveFee = async (profileId) => {
        if (!db || !userId) return;
        setSavingId(profileId); 
        
        const newAmount = parseFloat(fees[profileId]?.amount) || 0;
        
        try {
            const feeRef = ref(db, `${getDbPaths().financeMembershipFees}/${profileId}`);
            await update(feeRef, {
                amount: newAmount,
                lastUpdatedBy: userId,
                lastUpdatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating membership fee:", error);
        } finally {
            setSavingId(null);
        }
    };


    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="ml-3 text-sky-200">{t('finance.fees.loading')}</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
            <CardTitle 
                title={`${t('finance.tab.fees')} (${filteredAndSortedProfiles.length}) | ${t('finance.fees.total')}: ${formatCurrency(totalSum)}`} 
                icon={Users} 
            />
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-sky-800/50">
                    <thead className="bg-sky-900/70">
                        <tr>
                            {MEMBERSHIP_FEE_TABLE_COLUMNS.map(column => (
                                <TableHeaderWithControls
                                    key={column.key}
                                    column={column}
                                    currentSort={sort}
                                    onSortChange={handleSortChange}
                                    onFilterChange={handleFilterChange}
                                    filterOptions={MEMBERSHIP_FEE_COLUMN_OPTIONS_MAP}
                                    currentFilters={filters}
                                    t={t}
                                />
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-sky-950/50 divide-y divide-sky-800/50">
                        {filteredAndSortedProfiles.length > 0 ? (
                            filteredAndSortedProfiles.map(profile => {
                                const isSavingThis = savingId === profile.id;
                                return (
                                    <tr key={profile.id} className="hover:bg-sky-900/60 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-white" title={profile.company || profile.representative}>
                                            {profile.company || profile.representative}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400" title={profile.activity}>
                                            {profile.activity}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400">
                                            {t(`finance.fees.type_opts.${profile.membershipType.toLowerCase()}`)}
                                        </td>
                                        <td className="px-6 py-4 min-w-[150px]">
                                            <InputField 
                                                label=""
                                                name={`fee_${profile.id}`}
                                                type="number"
                                                value={String(fees[profile.id]?.amount || '')}
                                                onChange={(e) => handleFeeChange(profile.id, e.target.value)}
                                                required={false}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleSaveFee(profile.id)}
                                                disabled={isSavingThis}
                                                className={`flex items-center justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition duration-300 ${
                                                    isSavingThis ? 'bg-sky-400 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700'
                                                }`}
                                            >
                                                {isSavingThis ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                <span className="ml-2">{isSavingThis ? t('profile.saving') : t('finance.fees.save')}</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr><td colSpan={MEMBERSHIP_FEE_TABLE_COLUMNS.length} className="px-6 py-4 text-center text-gray-500">{t('finance.fees.no_members')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default MembershipFeesTab;