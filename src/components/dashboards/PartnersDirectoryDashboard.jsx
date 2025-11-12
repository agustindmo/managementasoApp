// src/components/dashboards/PartnersDirectoryDashboard.jsx

import React, { useState, useEffect, useMemo } from 'react';
// --- TASK 5: Added 'remove' ---
import { ref, onValue, remove } from 'firebase/database';
// --- TASK 5: Added new icons ---
import { Loader2, Handshake, ArrowUp, ArrowDown, Link, PlusCircle, Edit, Trash2, X } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import CardTitle from '../ui/CardTitle.jsx';
import { 
    ALL_FILTER_OPTION, 
    PARTNER_TABLE_COLUMNS,
    PARTNER_COLUMN_OPTIONS_MAP
} from '../../utils/constants.js';
import { useTranslation } from '../../context/TranslationContext.jsx'; 
// --- TASK 5: Import the form ---
import FinancePartnerForm from '../forms/FinancePartnerForm.jsx';

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

    // --- TASK 5: Allow 'actions' column but don't make it sortable/filterable ---
    if (column.key === 'actions' || column.key === 'agreement_link') {
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
// --- TASK 5: Added userId and isAdmin props ---
const PartnersDirectoryDashboard = ({ db, userId, isAdmin }) => {
    const { t } = useTranslation();
    const [partners, setPartners] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ key: 'name', direction: 'asc' }); 

    // --- TASK 5: State for modal ---
    const [formVisible, setFormVisible] = useState(false);
    const [currentPartner, setCurrentPartner] = useState(null);

    const dbPathKey = 'financePartners';
    const filterOptionsMap = PARTNER_COLUMN_OPTIONS_MAP;
    
    useEffect(() => {
        if (!db) return;
        setIsLoading(true); 

        const dataRef = ref(db, getDbPaths()[dbPathKey]); 
        
        const unsubscribe = onValue(dataRef, (snapshot) => {
            try {
                setPartners(snapshotToArray(snapshot));
            } catch (e) { console.error("Error processing Partner snapshot:", e); }
            finally { setIsLoading(false); }
        }, (error) => { console.error("Partner subscription Error:", error); setIsLoading(false); });
        
        return () => unsubscribe();
    }, [db]);

    const filteredAndSortedItems = useMemo(() => {
        let finalData = partners.filter(item => {
            for (const column of PARTNER_TABLE_COLUMNS) {
                const key = column.key;
                if (!column.filterable) continue; // Use filterable flag
                
                const filterValue = filters[key];
                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;

                let itemValue = String(item[key] || '');

                if (column.optionsKey) {
                    if (itemValue !== filterValue) return false;
                }
                else {
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
    }, [partners, filters, sort]);
    
    // --- TASK 5: Modal and Delete Handlers ---
    const handleOpenForm = (partner = null) => {
        setCurrentPartner(partner);
        setFormVisible(true);
    };

    const handleCloseForm = () => {
        setFormVisible(false);
        setCurrentPartner(null);
    };

    const handleDelete = async (id) => {
        if (!isAdmin) return;
        if (!window.confirm(t('finance.relations.partner.confirm_delete') || 'Are you sure you want to delete this partner?')) return;
        
        try {
            const itemRef = ref(db, `${getDbPaths()[dbPathKey]}/${id}`);
            await remove(itemRef);
            // Data will refetch via onValue
        } catch (error) {
            console.error("Error deleting partner:", error);
            alert("Error: " + error.message);
        }
    };

    const handleSortChange = (key) => {
        setSort(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
    };
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // --- TASK 5: Calculate visible columns for colspan ---
    const visibleColumns = PARTNER_TABLE_COLUMNS.filter(col => col.key !== 'actions' || isAdmin).length;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="ml-3 text-sky-200">{t('press_log.loading_records')}</p>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">

            {/* --- TASK 5: Form Modal --- */}
            {formVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
                    <div className="relative w-full max-w-2xl bg-gray-900 border border-sky-700/50 rounded-2xl shadow-2xl p-6 m-4">
                        <button 
                            onClick={handleCloseForm}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <FinancePartnerForm
                            userId={userId}
                            db={db}
                            role={isAdmin ? 'admin' : ''}
                            mode={currentPartner ? 'edit' : 'add'}
                            initialData={currentPartner}
                            onClose={handleCloseForm}
                        />
                    </div>
                </div>
            )}

            {/* --- TASK 5: Updated Header with Add Button --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-3xl font-bold text-white flex items-center mb-4 sm:mb-0">
                    <Handshake className="w-8 h-8 mr-3 text-sky-400" />
                    {t('sidebar.partners_directory')}
                </h1>
                {isAdmin && (
                    <button
                        onClick={() => handleOpenForm(null)}
                        className="flex-shrink-0 flex items-center justify-center px-4 py-2 bg-sky-600 text-white font-medium rounded-lg shadow-md hover:bg-sky-700 transition-colors"
                    >
                        <PlusCircle className="w-5 h-5 mr-2" />
                        {t('finance.relations.partner.form_add') || 'Add Partner'}
                    </button>
                )}
            </div>
            
            <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
                <CardTitle title={`${t('sidebar.partners_directory')} (${filteredAndSortedItems.length})`} icon={Handshake} />
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-sky-800/50">
                        <thead className="bg-sky-900/70">
                            <tr>
                                {/* --- TASK 5: Show/Hide Actions Column --- */}
                                {PARTNER_TABLE_COLUMNS.map(column => (
                                    (column.key !== 'actions' || isAdmin) && 
                                    <TableHeaderWithControls
                                        key={column.key}
                                        column={column}
                                        currentSort={sort}
                                        onSortChange={handleSortChange}
                                        onFilterChange={handleFilterChange}
                                        filterOptions={filterOptionsMap}
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
                                        <td className="px-6 py-3 text-sm font-medium text-white truncate max-w-[150px]" title={item.name}>{item.name}</td>
                                        <td className="px-6 py-3 text-sm text-gray-400">{item.area}</td>
                                        <td className="px-6 py-3 text-sm text-gray-400 truncate max-w-[150px]" title={item.contact_person}>{item.contact_person || 'N/A'}</td>
                                        <td className="px-6 py-3 text-sm text-gray-400 truncate max-w-[150px]" title={item.contact_email}>{item.contact_email || 'N/A'}</td>
                                        <td className="px-6 py-3 text-sm text-gray-400 whitespace-nowrap">
                                            {item.agreement_link ? (
                                                <a 
                                                    href={item.agreement_link} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-400 hover:text-blue-300 transition flex items-center"
                                                    title="View Document Link"
                                                >
                                                    <Link className="w-4 h-4 mr-1" /> Link
                                                </a>
                                            ) : 'N/A'}
                                        </td>
                                        {/* --- TASK 5: Render Actions Cell --- */}
                                        {isAdmin && (
                                            <td className="px-6 py-3 text-sm text-gray-400 text-right whitespace-nowrap">
                                                <button 
                                                    onClick={() => handleOpenForm(item)} 
                                                    className="p-1 text-sky-400 hover:text-sky-200 transition-colors mr-2"
                                                    title={t('activity.table.edit')}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(item.id)} 
                                                    className="p-1 text-red-500 hover:text-red-300 transition-colors"
                                                    title={t('activity.table.delete')}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={visibleColumns} className="px-6 py-4 text-center text-gray-500">{t('press_log.no_records')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PartnersDirectoryDashboard;