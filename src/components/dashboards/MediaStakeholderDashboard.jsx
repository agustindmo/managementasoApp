import React, { useState, useEffect, useMemo } from 'react';
import { Users, Loader2, Radio as MapIcon, LayoutList, ArrowUp, ArrowDown, PieChart, Target, PlusCircle, Edit, Trash2, X } from 'lucide-react'; 
import { ref, onValue, remove } from 'firebase/database';
import { getDbPaths } from '../../services/firebase.js';
import CardTitle from '../ui/CardTitle.jsx';
import SelectField from '../ui/SelectField.jsx'; 
import { 
    ALL_FILTER_OPTION,
    ANO_OPTIONS,
    ALL_YEAR_FILTER,
    MEDIA_STAKEHOLDER_TABLE_COLUMNS,
    MEDIA_STAKEHOLDER_COLUMN_OPTIONS_MAP
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

// --- Metric Card Component (Light Theme) ---
const MetricCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className={`p-6 rounded-2xl border ${colorClass.border} ${colorClass.bg} shadow-sm flex items-center space-x-4 hover:shadow-md transition-all`}>
        <div className={`p-3 rounded-full ${colorClass.iconBg}`}>
            <Icon className={`w-6 h-6 ${colorClass.text}`} />
        </div>
        <div>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">{title}</p>
            <p className={`text-2xl font-extrabold ${colorClass.textDark}`}>{value}</p>
        </div>
    </div>
);

// --- Table Header ---
const TableHeaderWithControls = ({ column, currentSort, onSortChange, onFilterChange, currentFilters, t }) => {
    const label = t(column.labelKey); 
    
    const isSorted = currentSort.key === column.key;
    const sortIcon = isSorted ? (currentSort.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />) : null;
    
    const isDropdown = !!column.optionsKey;
    let options = isDropdown ? (MEDIA_STAKEHOLDER_COLUMN_OPTIONS_MAP[column.optionsKey] || []) : [];
    
    const isTextInputFilter = !isDropdown;

    if (column.key === 'actions') {
         return (
            <th key={column.key} className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                {label}
            </th>
        );
    }

    return (
        <th 
            key={column.key} 
            className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap bg-slate-50"
        >
            <div className="flex flex-col space-y-2">
                <div className="flex items-center cursor-pointer hover:text-slate-700" onClick={() => column.sortable && onSortChange(column.key)}>
                    <span className="font-bold">{label}</span>
                    {sortIcon}
                </div>
                
                {column.filterable && (
                    isTextInputFilter ? (
                         <input
                            type="text"
                            placeholder={`${t('policy.search')} ${label}`}
                            value={currentFilters[column.key] || ''}
                            onChange={(e) => onFilterChange(column.key, e.target.value)}
                            className="text-xs p-1 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 min-w-[100px] bg-white text-slate-800"
                        />
                    ) : (
                        <select
                            value={currentFilters[column.key] || ALL_FILTER_OPTION}
                            onChange={(e) => onFilterChange(column.key, e.target.value)}
                            className="text-xs p-1 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 min-w-[100px] bg-white text-slate-800"
                        >
                            <option value={ALL_FILTER_OPTION}>{ALL_FILTER_OPTION}</option>
                            {options.map(option => (
                                <option key={option.value || option} value={option.value || option}>
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

// --- Table Row ---
const StakeholderTableRow = ({ item, onEdit, onDelete, t, isAdmin }) => {
    const lastLog = item.lastPressLog;
    
    const renderCell = (colKey) => {
        const value = item[colKey];
        
        switch (colKey) {
            case 'name':
                return <td key={colKey} className="px-6 py-3 text-sm font-medium text-slate-900 truncate max-w-[150px]" title={value}>{value}</td>;
            case 'email':
            case 'phone':
                return <td key={colKey} className="px-6 py-3 text-sm text-slate-500 truncate max-w-[150px]" title={value}>{value || 'N/A'}</td>;
            case 'type': 
                return <td key={colKey} className="px-6 py-3 text-sm text-slate-600">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {t(`press_log.format_opts.${String(value || '').toLowerCase()}`) || value}
                    </span>
                </td>;
            case 'scope':
                return <td key={colKey} className="px-6 py-3 text-sm text-slate-600">{t(`stakeholder.scope.${String(value || '').toLowerCase()}`) || value}</td>;
            case 'actions':
                return (
                    <td key={colKey} className="px-6 py-3 text-sm text-slate-500 text-right whitespace-nowrap">
                        <div className="flex justify-end space-x-2">
                            <button 
                                onClick={onEdit} 
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title={t('activity.table.edit')}
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={onDelete} 
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title={t('activity.table.delete')}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </td>
                );
            default:
                return <td key={colKey} className="px-6 py-3 text-sm text-slate-600">{String(value || 'N/A')}</td>;
        }
    };
    
    const columnsToRender = MEDIA_STAKEHOLDER_TABLE_COLUMNS.filter(col => 
        col.key !== 'position' && col.key !== 'actions'
    ).map(col => col.key);

    return (
        <tr className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
            {columnsToRender.map(key => renderCell(key))}

            {/* Last Press Log Data */}
            <td className="px-6 py-3 text-sm text-slate-500 whitespace-nowrap">
                {lastLog ? lastLog.date : 'N/A'}
            </td>
            <td className="px-6 py-3 text-sm text-slate-600">
                {lastLog 
                    ? <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        lastLog.impact === 'Positive' ? 'bg-green-100 text-green-800' :
                        lastLog.impact === 'Negative' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-800'
                    }`}>
                        {t(`press_log.impact_opts.${(lastLog.impact || 'Neutral').toLowerCase()}`)}
                      </span>
                    : 'N/A'}
            </td>
            <td className="px-6 py-3 text-sm text-slate-600 truncate max-w-[150px]">
                {lastLog 
                    ? t(`press_log.action_opts.${(lastLog.action || 'Interview').toLowerCase().replace(/ /g, '_')}`) 
                    : 'N/A'}
            </td>
            
            {isAdmin && renderCell('actions')}
        </tr>
    );
};

const MediaStakeholderMapDashboard = ({ db, userId, role }) => {
    const { t } = useTranslation(); 
    const isAdmin = role === 'admin';
    const [stakeholders, setStakeholders] = useState([]);
    const [pressLogEntries, setPressLogEntries] = useState([]); 
    const [isLoading, setIsLoading] = useState(true);
    const [yearFilter, setYearFilter] = useState(ALL_YEAR_FILTER);
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ key: 'name', direction: 'asc' });
    
    const [formVisible, setFormVisible] = useState(false);
    const [currentStakeholder, setCurrentStakeholder] = useState(null);

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

    const { totalStakeholderCount, totalEngagementCount } = useMemo(() => {
        const totalStakeholderCount = stakeholders.length;
        const filteredPressLog = pressLogEntries.filter(item => {
            if (yearFilter === ALL_YEAR_FILTER) return true;
            if (!item.date) return false; 
            const itemYear = item.date.substring(0, 4); 
            return itemYear === yearFilter;
        });
        const totalEngagementCount = filteredPressLog.length;
        return { totalStakeholderCount, totalEngagementCount };
    }, [stakeholders, pressLogEntries, yearFilter]);

    const { filteredStakeholders, distributionData } = useMemo(() => {
        let finalData = stakeholders;

        // Augment Stakeholder Data
        const augmentedStakeholders = stakeholders.map(stakeholder => {
            const relevantLogs = pressLogEntries.filter(log => (log.mediaStakeholderKeys || []).includes(stakeholder.id));
            let lastPressLog = null;
            if (relevantLogs.length > 0) {
                lastPressLog = relevantLogs.reduce((latest, current) => {
                    if (!latest || current.date > latest.date) return current;
                    return latest;
                }, null);
            }
            return { ...stakeholder, lastPressLog };
        });
        
        finalData = augmentedStakeholders;

        // Filter
        finalData = finalData.filter(item => {
            for (const column of MEDIA_STAKEHOLDER_TABLE_COLUMNS) {
                const key = column.key;
                if (!column.filterable || key === 'position') continue; 
                
                const filterValue = filters[key];
                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;

                const itemValue = String(item[key] || '');
                if (!column.optionsKey) { 
                    if (!itemValue.toLowerCase().includes(filterValue.toLowerCase())) return false;
                } else if (itemValue !== filterValue) { 
                    return false;
                }
            }
            return true;
        });

        // Sort
        if (sort.key) {
            finalData.sort((a, b) => {
                const aValue = a[sort.key] || '';
                const bValue = b[sort.key] || '';
                return (sort.direction === 'asc' ? 1 : -1) * String(aValue).localeCompare(String(bValue));
            });
        }
        
        // Chart Data
        const distributionCounts = {};
        finalData.forEach(item => {
            const key = t(`press_log.format_opts.${String(item.type || 'other').toLowerCase()}`); 
            distributionCounts[key] = (distributionCounts[key] || 0) + 1;
        });
        const distributionData = Object.entries(distributionCounts).map(([name, count]) => ({ name, count }));

        return { filteredStakeholders: finalData, distributionData };
    }, [stakeholders, pressLogEntries, filters, sort, t]);

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
        } catch (error) { console.error("Error deleting stakeholder:", error); }
    };

    const handleSortChange = (key) => setSort(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
    const handlePrimaryYearChange = (e) => setYearFilter(e.target.value);

    if (isLoading) return <div className="flex justify-center items-center p-8"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /><p className="ml-3 text-slate-500">{t('director.loading')}</p></div>;
    
    const TABLE_COLUMNS_TO_RENDER = MEDIA_STAKEHOLDER_TABLE_COLUMNS.filter(col => col.key !== 'position');

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            {formVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
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

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                    <MapIcon className="w-8 h-8 mr-3 text-blue-600" />
                    {t('stakeholder.map.title')}
                </h1>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="w-full sm:w-48"> 
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
                            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition-colors h-[42px] mt-auto"
                        >
                            <PlusCircle className="w-5 h-5 mr-2" />
                            {t('stakeholder.form.add_title')}
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <MetricCard 
                    title={t('stakeholder.metric.total_unique')}
                    value={totalStakeholderCount}
                    icon={Users}
                    colorClass={{
                        border: 'border-blue-100', bg: 'bg-white',
                        iconBg: 'bg-blue-50', text: 'text-blue-600', textDark: 'text-blue-700'
                    }}
                />
                <MetricCard 
                    title={t('stakeholder.metric.engagement')}
                    value={totalEngagementCount}
                    icon={Target}
                    colorClass={{
                        border: 'border-emerald-100', bg: 'bg-white',
                        iconBg: 'bg-emerald-50', text: 'text-emerald-600', textDark: 'text-emerald-700'
                    }}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden h-96">
                    <CardTitle title={t('stakeholder.metric.distribution')} icon={PieChart} />
                    <div className="p-4 h-full pb-12">
                        <SimpleBarChart data={distributionData} fillColor="#6366f1" />
                    </div>
                </div>

                <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden h-96 flex flex-col">
                    <CardTitle title={t('stakeholder.chart.media_position_map')} icon={MapIcon} />
                    <div className="flex-1 p-4">
                        <MediaStakeholderScatterChart data={filteredStakeholders} t={t} />
                    </div>
                </div>
            </div>
            
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <CardTitle title={`${t('stakeholder.table.title')} (${filteredStakeholders.length})`} icon={LayoutList} />
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
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
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap bg-slate-50">
                                    {t('press_log.col.date')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap bg-slate-50">
                                    {t('press_log.col.impact')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap bg-slate-50">
                                    {t('press_log.col.action')}
                                </th>
                                {isAdmin && (
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                                        {t('activity.col.actions')}
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
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
                                    <td colSpan={TABLE_COLUMNS_TO_RENDER.length + (isAdmin ? 1 : 0) + 3} className="px-6 py-8 text-center text-slate-500 italic">
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