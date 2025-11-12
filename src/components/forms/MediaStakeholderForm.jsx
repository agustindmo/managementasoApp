// src/components/dashboards/MediaStakeholderDashboard.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { Users, Loader2, Radio as MapIcon, LayoutList, ArrowUp, ArrowDown, PieChart, Target, PlusCircle, Edit, Trash2, X } from 'lucide-react'; // Added X
import { ref, onValue, remove } from 'firebase/database';
import { getDbPaths } from '../../services/firebase.js';
import CardTitle from '../ui/CardTitle.jsx';
import SelectField from '../ui/SelectField.jsx'; 
import { 
    ALL_FILTER_OPTION,
    ANO_OPTIONS,
    ALL_YEAR_FILTER,
    POSITION_SCORE_MAP, 
    MEDIA_STAKEHOLDER_TABLE_COLUMNS,
    MEDIA_STAKEHOLDER_COLUMN_OPTIONS_MAP,
    STAKEHOLDER_POSITION_OPTIONS // Added to assist in cell rendering if needed
} from '../../utils/constants.js';
import { useTranslation } from '../../context/TranslationContext.jsx'; 
import MediaStakeholderForm from '../forms/MediaStakeholderForm.jsx';
import SimpleBarChart from '../charts/SimpleBarChart.jsx';
import MediaStakeholderScatterChart from '../charts/MediaStakeholderScatterChart.jsx';


const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({
        id: key,
        ...val[key],
    }));
};

// --- Metric Card Component (Dark) ---
const MetricCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className={`p-4 rounded-2xl border ${colorClass.border} ${colorClass.bg} shadow-2xl backdrop-blur-lg flex items-center space-x-4`}>
        <div className={`p-3 rounded-full ${colorClass.iconBg}`}>
            <Icon className={`w-6 h-6 ${colorClass.text}`} />
        </div>
        <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);


// --- Cabecera de la Tabla ---
const TableHeaderWithControls = ({ column, currentSort, onSortChange, onFilterChange, currentFilters, t }) => {
    // --- This component remains unchanged from your previous version ---
    const label = t(column.labelKey); 
    
    const isSorted = currentSort.key === column.key;
    const sortIcon = isSorted ? (currentSort.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />) : null;
    
    // Use column definition from constants
    const isDropdown = !!column.optionsKey;
    let options = isDropdown ? (MEDIA_STAKEHOLDER_COLUMN_OPTIONS_MAP[column.optionsKey] || []) : [];
    
    const isTextInputFilter = !isDropdown;

    // Handle 'actions' column
    if (column.key === 'actions') {
         return (
            <th key={column.key} className="px-4 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider">
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
                            placeholder={`${t('objectives.search')} ${label}`}
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
                                <option key={option.value || option} value={option.value || option} className="bg-sky-900">
                                   {/* Handle translation keys for position */}
                                   {column.key === 'position' ? t(option.label) : (option.label || option)}
                                </option>
                            ))}
                        </select>
                    )
                )}
            </div>
        </th>
    );
};

// --- Fila de la Tabla (MODIFIED) ---
const StakeholderTableRow = ({ item, onEdit, onDelete, t, isAdmin }) => {
    // Determine the press log data
    const lastLog = item.lastPressLog;
    
    const renderCell = (colKey) => {
        const value = item[colKey];
        
        switch (colKey) {
            case 'name':
                return <td key={colKey} className="px-4 py-2 text-sm font-medium text-white truncate max-w-[150px]" title={value}>{value}</td>;
            case 'email':
            case 'phone':
                return <td key={colKey} className="px-4 py-2 text-sm text-gray-400 truncate max-w-[150px]" title={value}>{value || 'N/A'}</td>;
            case 'type': // Format
                return <td key={colKey} className="px-4 py-2 text-sm text-gray-400">{t(`press_log.format_opts.${String(value || '').toLowerCase()}`)}</td>;
            case 'scope':
                return <td key={colKey} className="px-4 py-2 text-sm text-gray-400">{t(`stakeholder.scope.${String(value || '').toLowerCase()}`)}</td>;
            case 'actions':
                return (
                    <td key={colKey} className="px-4 py-2 text-sm text-gray-400 text-right">
                        <button 
                            onClick={onEdit} 
                            className="p-1 text-sky-400 hover:text-sky-200 transition-colors mr-2"
                            title={t('activity.table.edit')}
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={onDelete} 
                            className="p-1 text-red-500 hover:text-red-300 transition-colors"
                            title={t('activity.table.delete')}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </td>
                );
            default:
                return <td key={colKey} className="px-4 py-2 text-sm text-gray-400">{String(value || 'N/A')}</td>;
        }
    };
    
    // Manually define the list of columns to render for this row
    const columnsToRender = MEDIA_STAKEHOLDER_TABLE_COLUMNS.filter(col => 
        col.key !== 'position' && col.key !== 'actions'
    ).map(col => col.key);

    return (
        <tr className="hover:bg-sky-900/60 transition-colors">
            {/* Render base stakeholder columns */}
            {columnsToRender.map(key => renderCell(key))}

            {/* Render Last Press Log Data */}
            <td className="px-4 py-2 text-sm text-gray-400 whitespace-nowrap">
                {lastLog ? lastLog.date : 'N/A'}
            </td>
            <td className="px-4 py-2 text-sm text-gray-400">
                {lastLog 
                    ? t(`press_log.impact_opts.${(lastLog.impact || 'Neutral').toLowerCase()}`) 
                    : 'N/A'}
            </td>
            <td className="px-4 py-2 text-sm text-gray-400 truncate max-w-[150px]">
                {lastLog 
                    ? t(`press_log.action_opts.${(lastLog.action || 'Interview').toLowerCase().replace(/ /g, '_')}`) 
                    : 'N/A'}
            </td>
            
            {/* Render Actions column (only if isAdmin) */}
            {isAdmin && renderCell('actions')}
        </tr>
    );
};


// --- Componente Principal (MODIFIED) ---
const MediaStakeholderMapDashboard = ({ db, userId, isAdmin }) => {
    const { t } = useTranslation(); 
    const [stakeholders, setStakeholders] = useState([]);
    const [pressLogEntries, setPressLogEntries] = useState([]); // Array of press log items
    const [isLoading, setIsLoading] = useState(true);
    const [yearFilter, setYearFilter] = useState(ALL_YEAR_FILTER);
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ key: 'name', direction: 'asc' });
    
    // Form Modal State
    const [formVisible, setFormVisible] = useState(false);
    const [currentStakeholder, setCurrentStakeholder] = useState(null);

    // Data Fetching (Unchanged logic, just cleanup comments)
    useEffect(() => {
        if (!db) return;
        setIsLoading(true);
        
        const paths = getDbPaths();
        const stakeholderRef = ref(db, paths.mediaStakeholders);
        const pressLogRef = ref(db, paths.pressLog); 

        let stakeholdersLoaded = false;
        let pressLogLoaded = false;

        const checkLoadingDone = () => {
            if (stakeholdersLoaded && pressLogLoaded) setIsLoading(false);
        };

        const unsubscribeStakeholders = onValue(stakeholderRef, (snapshot) => {
            try { setStakeholders(snapshotToArray(snapshot)); }
            catch (e) { console.error("Stakeholder fetch error:", e); }
            finally { stakeholdersLoaded = true; checkLoadingDone(); }
        }, (error) => { console.error("Stakeholder Subscription Error:", error); stakeholdersLoaded = true; checkLoadingDone(); });

        const unsubscribePressLog = onValue(pressLogRef, (snapshot) => {
            try { setPressLogEntries(snapshotToArray(snapshot)); }
            catch (e) { console.error("Press Log fetch error:", e); }
            finally { pressLogLoaded = true; checkLoadingDone(); }
        }, (error) => { console.error("Press Log Subscription Error:", error); pressLogLoaded = true; checkLoadingDone(); });

        return () => {
            unsubscribeStakeholders();
            unsubscribePressLog();
        };
    }, [db]);


    // Metric Card Counts (Unchanged logic)
    const { totalStakeholderCount, totalEngagementCount } = useMemo(() => {
        const totalStakeholderCount = stakeholders.length;
        // The press log filter logic here seems to filter by a generic 'fecha' which might not exist, but let's keep the logic as-is for engagement count.
        const filteredPressLog = pressLogEntries.filter(item => {
            if (yearFilter === ALL_YEAR_FILTER) return true;
            if (!item.date) return false; // Assuming 'date' is the correct field from pressLog
            const itemYear = item.date.substring(0, 4); 
            return itemYear === yearFilter;
        });
        const totalEngagementCount = filteredPressLog.length;
        return { totalStakeholderCount, totalEngagementCount };
    }, [stakeholders, pressLogEntries, yearFilter]);


    // Table Filtering, Sorting, and Chart Data (MODIFIED for press log augmentation)
    const { filteredStakeholders, distributionData } = useMemo(() => {
        let finalData = stakeholders;

        // --- 1. Augment Stakeholder Data with the last press log details (New Logic) ---
        const augmentedStakeholders = stakeholders.map(stakeholder => {
            const relevantLogs = pressLogEntries.filter(log => (log.mediaStakeholderKeys || []).includes(stakeholder.id));
            
            let lastPressLog = null;
            if (relevantLogs.length > 0) {
                // Find the latest log entry by date (YYYY-MM-DD format comparison works as string comparison)
                lastPressLog = relevantLogs.reduce((latest, current) => {
                    if (!latest || current.date > latest.date) return current;
                    return latest;
                }, null);
            }

            return {
                ...stakeholder,
                lastPressLog: lastPressLog,
            };
        });
        
        finalData = augmentedStakeholders;


        // --- 2. Table Column Filters (Modified to ignore 'position') ---
        finalData = finalData.filter(item => {
            for (const column of MEDIA_STAKEHOLDER_TABLE_COLUMNS) {
                const key = column.key;
                if (!column.filterable || key === 'position') continue; // Skip 'position' filter
                
                const filterValue = filters[key];
                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;

                const itemValue = String(item[key] || '');

                if (!column.optionsKey) { // Text Input
                    if (!itemValue.toLowerCase().includes(filterValue.toLowerCase())) {
                        return false;
                    }
                } else if (itemValue !== filterValue) { // Dropdown
                    return false;
                }
            }
            return true;
        });

        // --- 3. Sorting ---
        if (sort.key) {
            finalData.sort((a, b) => {
                const aValue = a[sort.key] || '';
                const bValue = b[sort.key] || '';
                return (sort.direction === 'asc' ? 1 : -1) * String(aValue).localeCompare(String(bValue));
            });
        }
        
        // --- 4. Data for Distribution Chart (Bar Chart) ---
        const distributionCounts = {};
        finalData.forEach(item => {
            const key = t(`press_log.format_opts.${String(item.type || 'other').toLowerCase()}`); 
            distributionCounts[key] = (distributionCounts[key] || 0) + 1;
        });
        const distributionData = Object.entries(distributionCounts).map(([name, count]) => ({ name, count }));

        return { 
            filteredStakeholders: finalData, 
            distributionData 
        };
        
    }, [stakeholders, pressLogEntries, filters, sort, t]);


    // --- Form and Delete Handlers (Unchanged) ---
    const handleOpenForm = (stakeholder = null) => {
        setCurrentStakeholder(stakeholder); 
        setFormVisible(true);
    };

    const handleCloseForm = () => {
        setFormVisible(false);
        setCurrentStakeholder(null);
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('stakeholder.confirm_delete'))) return;
        try {
            const itemRef = ref(db, `${getDbPaths().mediaStakeholders}/${id}`);
            await remove(itemRef);
        } catch (error) {
            console.error("Error deleting stakeholder:", error);
        }
    };

    // --- Filter and Sort Handlers (Unchanged) ---
    const handleSortChange = (key) => {
        setSort(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handlePrimaryYearChange = (e) => {
        setYearFilter(e.target.value);
    };

    // --- Loading UI (Unchanged) ---
    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="ml-3 text-sky-200">{t('director.loading')}</p>
            </div>
        );
    }
    
    // Define the columns that should be rendered in the table (excluding 'position')
    const TABLE_COLUMNS_TO_RENDER = MEDIA_STAKEHOLDER_TABLE_COLUMNS.filter(col => col.key !== 'position');

    // --- Main JSX (MODIFIED) ---
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            
            {/* --- Form Modal (Custom Modal implementation left as is, just content updated) --- */}
            {formVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
                    <div className="relative w-full max-w-2xl bg-gray-900 border border-sky-700/50 rounded-2xl shadow-2xl p-6 m-4">
                        <button 
                            onClick={handleCloseForm}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors"
                        >
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

            {/* --- Header (Unchanged) --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-3xl font-bold text-white flex items-center mb-4 sm:mb-0">
                    <MapIcon className="w-8 h-8 mr-3 text-sky-400" />
                    {t('stakeholder.map.title')}
                </h1>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <div className="rounded-xl shadow w-full sm:max-w-xs border border-sky-700/50 bg-black/40 backdrop-blur-lg p-2 flex-shrink-0"> 
                        <SelectField 
                            label={t('director.filter_year')}
                            name="yearFilter" 
                            options={ANO_OPTIONS} 
                            value={yearFilter} 
                            onChange={handlePrimaryYearChange} 
                        />
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => handleOpenForm(null)}
                            className="flex-shrink-0 flex items-center justify-center px-4 py-2 h-[42px] sm:h-auto mt-4 sm:mt-0 sm:self-end bg-sky-600 text-white font-medium rounded-lg shadow-md hover:bg-sky-700 transition-colors"
                        >
                            <PlusCircle className="w-5 h-5 mr-2" />
                            {t('stakeholder.form.add_title')}
                        </button>
                    )}
                </div>
            </div>

            {/* --- TASK 1: Metric Cards (Unchanged) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <MetricCard 
                    title={t('stakeholder.metric.total_unique')}
                    value={totalStakeholderCount}
                    icon={Users}
                    colorClass={{
                        border: 'border-sky-700/50', bg: 'bg-black/40',
                        iconBg: 'bg-sky-800/50', text: 'text-sky-400'
                    }}
                />
                <MetricCard 
                    title={t('stakeholder.metric.engagement')}
                    value={totalEngagementCount}
                    icon={Target}
                    colorClass={{
                        border: 'border-green-700/50', bg: 'bg-black/40',
                        iconBg: 'bg-green-800/50', text: 'text-green-400'
                    }}
                />
                {/* --- TASK 1: Filtered card removed --- */}
            </div>

            {/* --- Charts (Unchanged) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Chart 1 (Stakeholder Distribution) */}
                <div className="lg:col-span-1 rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden h-96">
                    <CardTitle title={t('stakeholder.metric.distribution')} icon={PieChart} />
                    <div className="p-4">
                        <SimpleBarChart data={distributionData} fillColor="#8884d8" />
                    </div>
                </div>

                {/* --- TASK 4: Scatter Plot --- */}
                <div className="lg:col-span-2 rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden h-96 flex flex-col">
                    <CardTitle title={t('stakeholder.chart.media_position_map')} icon={MapIcon} />
                    <div className="flex-1 p-4">
                        <MediaStakeholderScatterChart data={filteredStakeholders} t={t} />
                    </div>
                </div>
            </div>
            
            {/* --- Table (MODIFIED) --- */}
            <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
                <CardTitle title={`${t('stakeholder.table.title')} (${filteredStakeholders.length})`} icon={LayoutList} />
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-sky-800/50">
                        <thead className="bg-sky-900/70">
                            <tr>
                                {TABLE_COLUMNS_TO_RENDER.map(column => (
                                    (column.key !== 'actions' || isAdmin) &&
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
                                {/* Add new headers for Press Log */}
                                <th 
                                    key="lastPressLogDate" 
                                    className="px-4 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider whitespace-nowrap"
                                >
                                    {t('press_log.col.date')}
                                </th>
                                <th 
                                    key="lastPressLogImpact" 
                                    className="px-4 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider whitespace-nowrap"
                                >
                                    {t('press_log.col.impact')}
                                </th>
                                <th 
                                    key="lastPressLogAction" 
                                    className="px-4 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider whitespace-nowrap"
                                >
                                    {t('press_log.col.action')}
                                </th>
                                
                                {isAdmin && (
                                    <th 
                                        key="actions" 
                                        className="px-4 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider"
                                    >
                                        {t('activity.col.actions')}
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-sky-950/50 divide-y divide-sky-800/50">
                            {filteredStakeholders.length > 0 ? (
                                filteredStakeholders.map((item) => (
                                    <StakeholderTableRow
                                        key={item.id}
                                        item={item}
                                        onEdit={() => handleOpenForm(item)} 
                                        onDelete={() => handleDelete(item.id)} 
                                        t={t}
                                        isAdmin={isAdmin}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td 
                                        colSpan={TABLE_COLUMNS_TO_RENDER.length + (isAdmin ? 1 : 0) + 3} 
                                        className="px-6 py-4 text-center text-gray-500"
                                    >
                                        {t('stakeholder.no_stakeholders_found')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MediaStakeholderMapDashboard;