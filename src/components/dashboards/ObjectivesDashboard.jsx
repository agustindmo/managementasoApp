import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { BarChart2, Loader2, Target, LayoutList, ArrowUp, ArrowDown, Link } from 'lucide-react'; 
import { 
    ResponsiveContainer, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip 
} from 'recharts';
import { getDbPaths } from '../../services/firebase.js';
import CardTitle from '../ui/CardTitle.jsx';
import SelectField from '../ui/SelectField.jsx';
import { ANO_OPTIONS, ALL_YEAR_FILTER, MILESTONE_COLUMN_OPTIONS_MAP, ALL_FILTER_OPTION } from '../../utils/constants.js';
import { useTranslation } from '../../context/TranslationContext.jsx';

// Define Table Structure and MetaData
const MILESTONE_COLUMNS = [
    { labelKey: "objectives.col.nombre", key: "nombre", sortable: true, filterable: true, type: 'string' },        
    { labelKey: "objectives.col.okrs", key: "OKRs", sortable: true, filterable: true, type: 'string' },           
    { labelKey: "objectives.col.institucion", key: "institucion", sortable: true, filterable: true, type: 'string' },
    { labelKey: "objectives.col.ambito", key: "ambito", sortable: true, filterable: true, optionsKey: 'ambito', type: 'string' }, 
    { labelKey: "objectives.col.tipo_acto", key: "tipoDeActo", sortable: true, filterable: true, optionsKey: 'tipoDeActo', type: 'string' }, 
    { labelKey: "objectives.col.ano", key: "ano", sortable: true, filterable: true, optionsKey: 'ano', type: 'string' },      
    { labelKey: "objectives.col.ahorro", key: "ahorro", sortable: true, filterable: true, type: 'number' },    
    { labelKey: "objectives.col.link", key: "archivo", sortable: false, filterable: true, type: 'string' }, 
];

// --- Utility Functions ---

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
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(numericValue);
};

// --- Custom Tooltip for Recharts (Light Theme) ---
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-lg">
                <p className="text-slate-800 font-semibold mb-1">{label}</p>
                <p className="text-blue-600 font-medium">{`Count: ${payload[0].value}`}</p>
            </div>
        );
    }
    return null;
};

// --- Horizontal Chart for OKRs (Light Theme) ---
const OKRHorizontalBarChart = ({ data, t }) => {
    
    const chartData = useMemo(() =>
        Object.entries(data)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => a.count - b.count)
    , [data]);

    if (chartData.length === 0) {
        return <p className="text-slate-400 text-center py-8 italic">{t('objectives.no_okr_data')}</p>;
    }

    const chartHeight = Math.max(200, chartData.length * 40 + 40); 

    return (
        <div className="p-4" style={{ height: `${chartHeight}px` }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis
                        type="number"
                        stroke="#64748b"
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                    />
                    <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#64748b"
                        width={180} 
                        tick={{ fontSize: 12, fill: '#475569' }}
                        tickFormatter={(value) => value.length > 25 ? `${value.substring(0, 25)}...` : value}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />
                    <Bar dataKey="count" fill="#3b82f6" barSize={20} radius={[0, 4, 4, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

// --- Table Header Component ---
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
            className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap bg-slate-50"
        >
            <div className="flex flex-col space-y-2">
                {/* Sort Control */}
                <div className="flex items-center cursor-pointer hover:text-slate-700 transition-colors" onClick={() => column.sortable && onSortChange(column.key)}>
                    <span className="font-bold">{label}</span>
                    {sortIcon}
                </div>
                
                {/* Filter/Search Control */}
                {column.filterable && (
                    isTextInputFilter ? (
                         <input
                            type="text"
                            placeholder={`${t('policy.search')}...`}
                            value={currentFilters[column.key] || ''}
                            onChange={(e) => onFilterChange(column.key, e.target.value)}
                            className="text-xs p-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full bg-white text-slate-800 shadow-sm"
                        />
                    ) : (
                        <select
                            value={currentFilters[column.key] || ALL_FILTER_OPTION}
                            onChange={(e) => onFilterChange(column.key, e.target.value)}
                            className="text-xs p-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full bg-white text-slate-800 shadow-sm"
                        >
                            <option value={ALL_FILTER_OPTION}>{ALL_FILTER_OPTION}</option>
                            {options.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    )
                )}
            </div>
        </th>
    );
};

// --- Main Objectives Dashboard Component ---
const ObjectivesDashboard = ({ db }) => { 
    const { t } = useTranslation();
    const [milestones, setMilestones] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [yearFilter, setYearFilter] = useState(ALL_YEAR_FILTER);
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ key: 'nombre', direction: 'asc' });

    // 1. Fetch Milestones Data
    useEffect(() => {
        if (!db) return;

        const milestonesRef = ref(db, getDbPaths().milestones); 

        const unsubscribe = onValue(milestonesRef, (snapshot) => {
            try {
                const fetchedMilestones = snapshotToArray(snapshot).map(data => ({
                    ...data,
                    ahorro: typeof data.ahorro === 'number' ? data.ahorro : (parseFloat(data.ahorro) || 0),
                    ano: data.ano?.toString() || 'N/A', 
                    OKRs: data.OKRs || 'N/A',
                }));
                setMilestones(fetchedMilestones);
                setIsLoading(false);
            } catch (error) {
                console.error("Error processing snapshot data for Objectives:", error);
            }
        }, (error) => {
            console.error("Error fetching milestones for Objectives:", error);
            setIsLoading(false);
        });

        return () => unsubscribe(); 
    }, [db]);

    // 2. Data Processing and Filtering
    const { filteredMilestones, okrCounts } = useMemo(() => {
        let finalData = yearFilter === ALL_YEAR_FILTER
            ? milestones
            : milestones.filter(item => item.ano === yearFilter);

        finalData = finalData.filter(item => {
            for (const column of MILESTONE_COLUMNS) {
                const key = column.key;
                const filterValue = filters[key];

                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;

                const itemValue = String(item[key] || '');

                if (!column.optionsKey) { 
                    if (!itemValue.toLowerCase().includes(filterValue.toLowerCase())) {
                        return false;
                    }
                } else if (itemValue !== filterValue) {
                    return false;
                }
            }
            return true;
        });

        if (sort.key) {
            finalData.sort((a, b) => {
                const column = MILESTONE_COLUMNS.find(c => c.key === sort.key);
                const aValue = a[sort.key] || (column?.type === 'number' ? -Infinity : '');
                const bValue = b[sort.key] || (column?.type === 'number' ? -Infinity : '');
                
                if (column?.type === 'number') {
                    return (sort.direction === 'asc' ? 1 : -1) * (aValue - bValue);
                } else {
                    return (sort.direction === 'asc' ? 1 : -1) * String(aValue).localeCompare(String(bValue));
                }
            });
        }

        const okrCounts = {};
        finalData.forEach(item => {
            const okrKey = item.OKRs.trim() || 'N/A'; 
            okrCounts[okrKey] = (okrCounts[okrKey] || 0) + 1;
        });

        return {
            filteredMilestones: finalData,
            okrCounts: okrCounts,
        };
    }, [milestones, yearFilter, filters, sort]);
    
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

    const handlePrimaryYearChange = (e) => {
        const value = e.target.value;
        setYearFilter(value);
        setFilters(prev => ({ 
            ...prev, 
            ano: value 
        })); 
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="ml-3 text-slate-500">{t('objectives.loading')}</p>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center">
                    <Target className="w-8 h-8 mr-3 text-blue-600" />
                    {t('objectives.title')}
                </h1>
                
                <div className="w-full sm:w-48">
                    <SelectField 
                        label={t('objectives.filter_year')} 
                        name="yearFilter" 
                        options={ANO_OPTIONS} 
                        value={yearFilter} 
                        onChange={handlePrimaryYearChange}
                    />
                </div>
            </div>
            
            {/* Chart Section */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-8">
                <CardTitle title={`${t('objectives.okr_breakdown') || 'Objectives Breakdown'} (${yearFilter})`} icon={BarChart2} />
                <OKRHorizontalBarChart data={okrCounts} t={t} />
            </div>

            {/* Table Section */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-8">
                <div className="p-4 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center">
                        <LayoutList className="w-5 h-5 mr-2 text-blue-600" />
                        {`${t('objectives.records_title')} (${filteredMilestones.length})`}
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                {MILESTONE_COLUMNS.map(column => (
                                    <TableHeaderWithControls
                                        key={column.key}
                                        column={column}
                                        currentSort={sort}
                                        onSortChange={handleSortChange}
                                        onFilterChange={handleFilterChange}
                                        filterOptions={MILESTONE_COLUMN_OPTIONS_MAP}
                                        currentFilters={filters}
                                        t={t}
                                    />
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredMilestones.length > 0 ? (
                                filteredMilestones.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900 truncate max-w-[200px]" title={item.nombre}>{item.nombre}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 truncate max-w-[150px]" title={item.OKRs}>{item.OKRs}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 truncate max-w-[150px]" title={item.institucion}>{item.institucion}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{item.ambito}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 truncate max-w-[150px]" title={item.tipoDeActo}>{item.tipoDeActo}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{item.ano}</td>
                                        <td className="px-6 py-4 text-sm text-emerald-600 font-semibold">{formatCurrency(item.ahorro)}</td>
                                        
                                        <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                                            {item.archivo ? (
                                                <a 
                                                    href={item.archivo} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 transition flex items-center"
                                                    title="View File Link"
                                                >
                                                    <Link className="w-4 h-4 mr-1" />
                                                    {t('objectives.view_link') || 'View'}
                                                </a>
                                            ) : <span className="text-slate-400">N/A</span>}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={MILESTONE_COLUMNS.length} className="px-6 py-8 text-center text-slate-500 italic">{t('objectives.no_milestones')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ObjectivesDashboard;