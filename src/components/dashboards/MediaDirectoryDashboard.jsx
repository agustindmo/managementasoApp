// src/components/dashboards/MediaDirectoryDashboard.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue, remove } from 'firebase/database'; // Added 'remove'
import { Loader2, Radio, ArrowUp, ArrowDown, PlusCircle, Edit, Trash2, X } from 'lucide-react'; // Added icons
import { getDbPaths } from '../../services/firebase.js';
import CardTitle from '../ui/CardTitle.jsx';
import { 
    ALL_FILTER_OPTION, 
    MEDIA_STAKEHOLDER_TABLE_COLUMNS,
    MEDIA_STAKEHOLDER_COLUMN_OPTIONS_MAP
} from '../../utils/constants.js';
import { useTranslation } from '../../context/TranslationContext.jsx';
import MediaStakeholderForm from '../forms/MediaStakeholderForm.jsx'; // Added form import

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
    
    // --- TASK 4: Removed line that hid 'actions' column ---
    
    const isSorted = currentSort.key === column.key;
    const sortIcon = isSorted ? (currentSort.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />) : null;
    
    const isDropdown = !!column.optionsKey;
    let options = isDropdown ? (filterOptions[column.optionsKey] || []) : [];
    
    const isTextInputFilter = !isDropdown;

    // Hide filter input for 'actions' column
    if (column.key === 'actions') {
        return (
            <th className="px-4 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider">
                {label}
            </th>
        );
    }

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
// --- TASK 4: Added userId and isAdmin props ---
const MediaDirectoryDashboard = ({ db, userId, isAdmin }) => {
    const { t } = useTranslation();
    const [mediaStakeholders, setMediaStakeholders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ key: 'name', direction: 'asc' });

    // --- TASK 4: State for modal ---
    const [formVisible, setFormVisible] = useState(false);
    const [currentStakeholder, setCurrentStakeholder] = useState(null);

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
        
        // Updated filter logic to iterate keys from constants
        currentData = currentData.filter(item => {
            for (const column of MEDIA_STAKEHOLDER_TABLE_COLUMNS) {
                const key = column.key;
                if (!column.filterable) continue;
                
                const filterValue = filters[key];
                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;
                
                const itemValue = String(item[key] || '');

                if (column.optionsKey) { // Dropdown filter
                    if (itemValue !== filterValue) return false;
                } else { // Text filter
                    if (!itemValue.toLowerCase().includes(filterValue.toLowerCase())) return false;
                }
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

    // --- TASK 4: Modal and Delete Handlers ---
    const handleOpenForm = (stakeholder = null) => {
        setCurrentStakeholder(stakeholder);
        setFormVisible(true);
    };
    
    const handleCloseForm = () => {
        setFormVisible(false);
        setCurrentStakeholder(null);
    };

    const handleDelete = async (id) => {
        if (!isAdmin) return;
        if (!window.confirm(t('stakeholder.confirm_delete') || 'Are you sure you want to delete this entry?')) return;
        try {
            const itemRef = ref(db, `${getDbPaths().mediaStakeholders}/${id}`);
            await remove(itemRef);
            // Data will refetch via onValue
        } catch (error) {
            console.error("Error deleting stakeholder:", error);
        }
    };

    const handleSortChange = (key) => {
        setSort(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    };
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // --- TASK 4: Helper function to render table cells ---
    const renderCellContent = (item, column) => {
        const value = item[column.key];
        switch (column.key) {
            case 'name':
                return <td className="px-6 py-2 text-sm font-medium text-white truncate max-w-[150px]" title={value}>{value}</td>;
            case 'email':
                return <td className="px-6 py-2 text-sm text-gray-400 truncate max-w-[170px]" title={value}>{value || 'N/A'}</td>;
            case 'phone':
                return <td className="px-6 py-2 text-sm text-gray-400 truncate max-w-[120px]" title={value}>{value || 'N/A'}</td>;
            case 'type':
                return <td className="px-6 py-2 text-sm text-gray-400 capitalize">{t(`press_log.format_opts.${String(value).toLowerCase()}`)}</td>;
            case 'position':
                return <td className="px-6 py-2 text-sm text-gray-400 capitalize">{t(value)}</td>;
            case 'scope':
                return <td className="px-6 py-2 text-sm text-gray-400 capitalize">{value}</td>;
            case 'actions':
                return (
                    <td className="px-6 py-2 text-sm text-right whitespace-nowrap">
                        <button onClick={() => handleOpenForm(item)} className="p-1 text-sky-400 hover:text-sky-200 mr-2" title={t('activity.table.edit')}>
                            <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-1 text-red-500 hover:text-red-300" title={t('activity.table.delete')}>
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </td>
                );
            default:
                return <td key={column.key}></td>; // Render empty cell for unknown columns
        }
    };

    // --- TASK 4: Calculate visible columns for colspan ---
    const visibleColumns = MEDIA_STAKEHOLDER_TABLE_COLUMNS.filter(col => col.key !== 'actions' || isAdmin).length;

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
            
            {/* --- TASK 4: Form Modal --- */}
            {formVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
                    <div className="relative w-full max-w-2xl bg-gray-900 border border-sky-700/50 rounded-2xl shadow-2xl p-6 m-4 overflow-y-auto max-h-[90vh]">
                        <button onClick={handleCloseForm} className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors z-10">
                            <X className="w-6 h-6" />
                        </button>
                        <MediaStakeholderForm
                            userId={userId}
                            db={db}
                            mode={currentStakeholder ? 'edit' : 'add'}
                            initialData={currentStakeholder}
                            onClose={handleCloseForm}
                        />
                    </div>
                </div>
            )}
            
            {/* --- TASK 4: Updated Header with Add Button --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-3xl font-bold text-white flex items-center mb-4 sm:mb-0">
                    <Radio className="w-8 h-8 mr-3 text-sky-400" />
                    {t('sidebar.media_directory')}
                </h1>
                {isAdmin && (
                    <button
                        onClick={() => handleOpenForm(null)}
                        className="flex-shrink-0 flex items-center justify-center px-4 py-2 bg-sky-600 text-white font-medium rounded-lg shadow-md hover:bg-sky-700 transition-colors"
                    >
                        <PlusCircle className="w-5 h-5 mr-2" />
                        {t('stakeholder.form.add_title') || 'Add Stakeholder'}
                    </button>
                )}
            </div>
            
            <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
                <CardTitle title={`${t('sidebar.media_directory')} (${filteredStakeholders.length})`} icon={Radio} />
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-sky-800/50">
                        <thead className="bg-sky-900/70">
                            <tr>
                                {/* --- TASK 4: Updated Head --- */}
                                {MEDIA_STAKEHOLDER_TABLE_COLUMNS.map(column => (
                                    (column.key !== 'actions' || isAdmin) &&
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
                            {/* --- TASK 4: Updated Body --- */}
                            {filteredStakeholders.length > 0 ? (
                                filteredStakeholders.map((item) => (
                                    <tr key={item.id} className="hover:bg-sky-900/60 transition-colors">
                                        {MEDIA_STAKEHOLDER_TABLE_COLUMNS.map(column => 
                                            (column.key !== 'actions' || isAdmin) && renderCellContent(item, column)
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={visibleColumns} className="px-6 py-4 text-center text-gray-500">{t('stakeholder.no_stakeholders_found')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MediaDirectoryDashboard;