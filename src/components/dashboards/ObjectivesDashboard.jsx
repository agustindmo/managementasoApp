import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { BarChart2, Loader2, Target, LayoutList, Search, ArrowUp, ArrowDown } from 'lucide-react'; 
// --- Recharts components imported for the new chart ---
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
import { useTranslation } from '../../context/TranslationContext.jsx'; // Tarea 2

// Define Table Structure and MetaData - UPDATED to use labelKey
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

// --- Utility Components (Tarea 1: Estilos oscuros) ---

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

// --- Custom Tooltip for Recharts (Added for Task 2) ---
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-gray-800 border border-gray-700 rounded-md shadow-lg">
                <p className="text-white font-semibold">{label}</p>
                <p className="text-sky-400">{`Count: ${payload[0].value}`}</p>
            </div>
        );
    }
    return null;
};


// --- Horizontal Chart for OKRs (IMPROVED WITH RECHARTS for Task 2) ---
const OKRHorizontalBarChart = ({ data, t }) => {
    
    // Convert object data to sorted array for Recharts
    const chartData = useMemo(() =>
        Object.entries(data)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => a.count - b.count) // Sort ascending for horizontal chart
    , [data]);

    if (chartData.length === 0) {
        return <p className="text-gray-500 text-center py-4">{t('objectives.no_okr_data')}</p>;
    }

    // Dynamically calculate chart height based on number of bars
    const chartHeight = Math.max(200, chartData.length * 30 + 40); // 30px per bar + padding

    return (
        <div className="p-4" style={{ height: `${chartHeight}px` }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 0, right: 10, left: 30, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                    <XAxis
                        type="number"
                        stroke="#9ca3af"
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: '#9ca3af' }}
                    />
                    <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#9ca3af"
                        width={150} // Allocate space for labels
                        tick={{ fontSize: 12, fill: '#e5e7eb' }}
                        tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 20)}...` : value} // Truncate long labels
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} />
                    <Bar dataKey="count" fill="#0ea5e9" barSize={15} radius={[0, 4, 4, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

// Custom Table Header Component with controls
const TableHeaderWithControls = ({ column, currentSort, onSortChange, onFilterChange, filterOptions, currentFilters, t }) => { // Tarea 2: Añadir t
    const label = t(column.labelKey); // Tarea 2
    
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
            // Tarea 1: Estilo de cabecera oscuro
            className="px-4 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider whitespace-nowrap"
        >
            <div className="flex flex-col space-y-1">
                {/* Sort Control */}
                <div className="flex items-center">
                    <span 
                        className={`cursor-pointer font-medium ${column.sortable ? 'hover:text-white transition-colors' : ''}`}
                        onClick={() => column.sortable && onSortChange(column.key)}
                    >
                        {label}
                    </span>
                    {sortIcon}
                </div>
                
                {/* Filter/Search Control */}
                {column.filterable && (
                    isTextInputFilter ? (
                         <input
                            type="text"
                            placeholder={`${t('objectives.search')} ${label}`} // Tarea 2
                            value={currentFilters[column.key] || ''}
                            onChange={(e) => onFilterChange(column.key, e.target.value)}
                            // Tarea 1: Estilo de input oscuro
                            className="text-xs p-1 border border-sky-700 bg-sky-950/50 text-white rounded-lg focus:ring-sky-500 focus:border-sky-500 min-w-[100px]"
                        />
                    ) : (
                        <select
                            value={currentFilters[column.key] || ALL_FILTER_OPTION}
                            onChange={(e) => onFilterChange(column.key, e.target.value)}
                            // Tarea 1: Estilo de select oscuro
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


// --- Main Objectives Dashboard Component ---
const ObjectivesDashboard = ({ db }) => { 
    const { t } = useTranslation(); // Tarea 2
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

                if (!column.optionsKey) { // Text Input Filter (partial match)
                    if (!itemValue.toLowerCase().includes(filterValue.toLowerCase())) {
                        return false;
                    }
                } else if (itemValue !== filterValue) { // Dropdown Filter (exact match)
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
    
    // Recalculate total ahorro based on filtered data
    const totalAhorro = filteredMilestones.reduce((sum, item) => sum + item.ahorro, 0);

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
            <div className="flex justify-center items-center p-8">
                {/* Tarea 1: Estilo de carga oscuro */}
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="ml-3 text-sky-200">{t('objectives.loading')}</p>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            {/* Tarea 1: Título oscuro y color de icono */}
            <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
                <Target className="w-8 h-8 mr-3 text-sky-400" />
                {t('objectives.title')}
            </h1>
            
            {/* Tarea 1: Contenedor de filtro oscuro */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg p-4 sm:max-w-xs flex-grow sm:flex-grow-0">
                    <SelectField 
                        label={t('objectives.filter_year')} 
                        name="yearFilter" 
                        options={ANO_OPTIONS} 
                        value={yearFilter} 
                        onChange={handlePrimaryYearChange}
                    />
                </div>
            </div>
            
            {/* Tarea 1: Contenedor oscuro para la tabla */}
            <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden mb-8">
                <CardTitle title={`${t('objectives.records_title')} (${filteredMilestones.length} ${t('objectives.records_count_post')}`} icon={LayoutList} />
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-sky-800/50">
                        {/* Tarea 1: Cabecera oscura */}
                        <thead className="bg-sky-900/70">
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
                                        t={t} // Tarea 2
                                    />
                                ))}
                            </tr>
                        </thead>
                        {/* Tarea 1: Cuerpo oscuro */}
                        <tbody className="bg-sky-950/50 divide-y divide-sky-800/50">
                            {filteredMilestones.length > 0 ? (
                                filteredMilestones.map(item => (
                                    <tr key={item.id} className="hover:bg-sky-900/60 transition-colors">
                                        <td className="px-6 py-2 text-sm font-medium text-white truncate max-w-[150px]" title={item.nombre}>{item.nombre}</td>
                                        <td className="px-6 py-2 text-sm text-gray-400 truncate max-w-[150px]" title={item.OKRs}>{item.OKRs}</td>
                                        <td className="px-6 py-2 text-sm text-gray-400 truncate max-w-[120px]" title={item.institucion}>{item.institucion}</td>
                                        <td className="px-6 py-2 text-sm text-gray-400">{item.ambito}</td>
                                        <td className="px-6 py-2 text-sm text-gray-400 truncate max-w-[150px]" title={item.tipoDeActo}>{item.tipoDeActo}</td>
                                        <td className="px-6 py-2 text-sm text-gray-400">{item.ano}</td>
                                        <td className="px-6 py-2 text-sm text-green-400 font-semibold">{formatCurrency(item.ahorro)}</td>
                                        
                                        <td className="px-6 py-2 text-sm text-gray-400 truncate max-w-[150px]">
                                            {item.archivo ? (
                                                <a 
                                                    href={item.archivo} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-400 hover:text-blue-300 transition"
                                                    title="View File Link"
                                                >
                                                    {t('objectives.view_link')}
                                                </a>
                                            ) : 'N/A'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={MILESTONE_COLUMNS.length} className="px-6 py-4 text-center text-gray-500">{t('objectives.no_milestones')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Tarea 1: Contenedor oscuro para el gráfico */}
            <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden mb-8">
                <CardTitle title={`${t('objectives.okr_breakdown')} (${yearFilter})`} icon={BarChart2} />
                {/* --- This component was rewritten for Task 2 --- */}
                <OKRHorizontalBarChart data={okrCounts} t={t} />
            </div>
        </div>
    );
};

export default ObjectivesDashboard;