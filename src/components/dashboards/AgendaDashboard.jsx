import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { Calendar, Loader2, BarChart2, LayoutList, PieChart, TrendingUp, Users, GitCommit, ListChecks, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import CardTitle from '../ui/CardTitle.jsx';
import { AGENDA_COLUMN_OPTIONS_MAP, ALL_FILTER_OPTION } from '../../utils/constants.js';
import { useTranslation } from '../../context/TranslationContext.jsx'; // Tarea 2

// Define Table Structure and MetaData (Ahora usa labelKey)
const AGENDA_COLUMNS = [
    { labelKey: "policy.col.nombre", key: "nombre", sortable: true, filterable: true, type: 'string' }, 
    { labelKey: "policy.col.pilar", key: "pilar", sortable: true, filterable: true, optionsKey: 'pilar', type: 'string' },
    { labelKey: "policy.col.tipo_acto", key: "tipoDeActo", sortable: true, filterable: true, optionsKey: 'tipoDeActo', type: 'string' },
    { labelKey: "policy.col.sector", key: "sector", sortable: true, filterable: true, optionsKey: 'sector', type: 'string' }, 
    { labelKey: "policy.col.situacion", key: "situacion", sortable: false, filterable: true, type: 'string' }, 
    { labelKey: "policy.col.impacto", key: "impacto", sortable: true, filterable: true, type: 'string' }, 
    { labelKey: "policy.col.institucion", key: "institucion", sortable: true, filterable: true, type: 'string' }, 
    { labelKey: "policy.col.condicion", key: "condicion", sortable: true, filterable: true, optionsKey: 'condicion', type: 'string' },
    { labelKey: "policy.col.agenda", key: "agenda", sortable: true, filterable: true, optionsKey: 'agenda', type: 'string' },
    { labelKey: "policy.col.ano", key: "ano", sortable: true, filterable: true, optionsKey: 'ano', type: 'string' }, 
    { labelKey: "activity.col.link", key: "ayudaMemoria", sortable: false, filterable: true, type: 'string' }, 
];

// Tarea 2: Usar labelKey para traducción
const CHART_TABS = {
    sector: { labelKey: 'agenda.chart.sector', icon: Users, type: 'Radar' },
    institucion: { labelKey: 'agenda.chart.institucion', icon: Calendar, type: 'Bar' },
    pilar: { labelKey: 'agenda.chart.pilar', icon: TrendingUp, type: 'Radar' },
    agenda: { labelKey: 'agenda.chart.agenda', icon: LayoutList, type: 'Pie' },
    condicion: { labelKey: 'agenda.chart.condicion', icon: ListChecks, type: 'Pie' },
    tipoDeActo: { labelKey: 'agenda.chart.tipo_acto', icon: GitCommit, type: 'Treemap' }, 
};

// --- Chart/Utility Components (Tarea 1: Estilos oscuros) ---

const TabButton = ({ isActive, onClick, label }) => (
    <button
        onClick={onClick}
        className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
            isActive
                ? 'bg-sky-700 text-white shadow-md' // Estilo activo
                : 'bg-black/30 text-gray-400 hover:bg-black/50 hover:text-white' // Estilo inactivo
        }`}
    >
        {label}
    </button>
);

const ChartContainer = ({ title, icon: Icon, children }) => (
    // Tarea 1: Contenedor oscuro
    <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden h-96 flex flex-col">
        <CardTitle title={title} icon={Icon || BarChart2} />
        <div className="p-4 flex-1 flex justify-center items-center overflow-y-auto">
            {children}
        </div>
    </div>
);

const HorizontalBarChartMock = ({ data, totalCount, t }) => { // Tarea 2: Añadir t
    const sortedCounts = Object.entries(data)
        .sort(([, countA], [, countB]) => countB - countA);

    if (sortedCounts.length === 0) {
        return <p className="text-gray-500 text-center py-4">{t('agenda.no_data')}</p>;
    }

    return (
        <div className="w-full space-y-3 px-4 py-4">
            <h3 className="text-lg font-bold text-white mb-4">{t('agenda.chart.ranking')}</h3>
            {sortedCounts.map(([label, count]) => {
                const percentage = (totalCount > 0) ? (count / totalCount) * 100 : 0;
                return (
                    <div key={label} className="flex items-center space-x-2">
                        <span className="text-sm w-48 text-gray-200 truncate text-right font-medium">{label}</span>
                        <div className="flex-1 bg-sky-950/50 rounded-full h-4">
                            <div 
                                className="bg-sky-500 h-4 rounded-full transition-all duration-500" 
                                style={{ width: `${percentage}%` }}
                                title={`${percentage.toFixed(1)}%`}
                            ></div>
                        </div>
                        <span className="text-xs w-10 text-left text-gray-400">{count}</span>
                    </div>
                );
            })}
        </div>
    );
};

const PieChartMock = ({ data, totalCount, t }) => { // Tarea 2: Añadir t
    const chartData = Object.entries(data).map(([key, count], index) => ({
        key,
        percentage: totalCount > 0 ? (count / totalCount) * 100 : 0,
        color: ['bg-sky-500', 'bg-green-500', 'bg-purple-500', 'bg-gray-400', 'bg-red-500', 'bg-yellow-500'][index % 6],
        count: count,
    }));

    if (chartData.length === 0) {
        return <p className="text-gray-500 text-center py-4">{t('agenda.no_data')}</p>;
    }

    return (
        <div className="flex items-center space-x-12">
            <div className="w-32 h-32 rounded-full border-8 border-sky-900/50 bg-sky-950/50 flex items-center justify-center relative shadow-inner">
                 <div className="relative z-10 text-3xl font-bold text-white">{totalCount}</div>
            </div>
            
            <div className="text-sm space-y-2 max-h-80 overflow-y-auto">
                {chartData.map(item => (
                    <div key={item.key} className="flex items-center text-gray-200">
                        <span className={`w-3 h-3 mr-2 ${item.color} rounded-full`}></span>
                        <span className="font-medium w-32 truncate">{item.key}:</span>
                        <span className="text-gray-400 font-bold">{item.percentage.toFixed(1)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const RadarChartMock = ({ data, totalCount, t }) => { // Tarea 2: Añadir t
    const axes = Object.entries(data).map(([label, count]) => ({
        label: label,
        normalizedValue: totalCount > 0 ? (count / totalCount) * 10 : 0 
    })).sort((a, b) => b.normalizedValue - a.normalizedValue);

    if (axes.length === 0) {
        return <p className="text-gray-500 text-center py-4">{t('agenda.no_data')}</p>;
    }
    
    return (
        <div className="flex flex-col items-center space-y-6 w-full">
            <div className="w-48 h-48 relative border border-sky-700/50 rounded-full flex items-center justify-center">
                {[0.25, 0.5, 0.75, 1.0].map((scale, index) => (
                    <div 
                        key={index} 
                        className="absolute border border-sky-800/80 rounded-full"
                        style={{ width: `${scale * 90}%`, height: `${scale * 90}%` }}
                    />
                ))}
                
                <div className="absolute w-1 h-1 bg-red-500 rounded-full" />
            </div>
            
            <div className="text-xs space-y-1 w-full max-w-sm max-h-80 overflow-y-auto">
                <h3 className="text-sm font-bold text-white mb-2">{t('agenda.chart.strength')}</h3>
                {axes.map(axis => (
                    <div key={axis.label} className="flex justify-between">
                        <span className="font-medium text-gray-300">{axis.label}:</span>
                        <span className="font-bold text-sky-400">{axis.normalizedValue.toFixed(1)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TreemapMock = ({ data, t }) => { // Tarea 2: Añadir t
    const entries = Object.entries(data)
        .sort(([, countA], [, countB]) => countB - countA);
    
    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    const colors = ['bg-sky-600', 'bg-blue-500', 'bg-gray-700', 'bg-purple-600', 'bg-gray-400', 'bg-sky-800'];

    if (total === 0) {
        return <p className="text-gray-500 text-center py-4">{t('agenda.no_data')}</p>;
    }

    return (
        <div className="flex w-full h-full p-2 space-x-1 border border-sky-700/50 bg-black/30 rounded-lg">
            {entries.map(([label, count], index) => {
                const percentage = (count / total) * 100;
                const widthStyle = { 
                    width: `${Math.max(percentage, 5)}%`, 
                    minWidth: '50px',
                    height: '100%' 
                };

                return (
                    <div 
                        key={label}
                        className={`flex-shrink-0 flex items-center justify-center p-1 text-center font-bold shadow-md rounded-sm ${colors[index % colors.length]}`}
                        style={widthStyle}
                        title={`${label}: ${count} (${percentage.toFixed(1)}%)`}
                    >
                        <span className={`text-xs ${percentage < 5 ? 'text-gray-800' : 'text-white'}`}>{label}</span>
                    </div>
                );
            })}
        </div>
    );
};

const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({
        id: key,
        ...val[key],
    }));
};

// Custom Table Header Component with controls (Tarea 1: Estilos oscuros)
const TableHeaderWithControls = ({ column, currentSort, onSortChange, onFilterChange, filterOptions, currentFilters, dataItems, t }) => {
    const label = t(column.labelKey); // Tarea 2

    const isSorted = currentSort.key === column.key;
    const sortIcon = isSorted ? (currentSort.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />) : null;
    
    let options = [];
    if (column.filterable) {
        if (column.optionsKey) {
            options = filterOptions[column.optionsKey] || [];
        } else {
            const uniqueValues = [...new Set(dataItems.map(item => String(item[column.key] || 'N/A')))];
            options = uniqueValues.filter(v => v !== 'N/A' && v !== '').sort();
        }
    }
    
    const isTextField = !column.optionsKey;
    
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
                    isTextField ? (
                        <input
                            type="text"
                            placeholder={`${t('policy.search')} ${label}`} // Tarea 2
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


const AgendaDashboard = ({ db }) => {
    const { t } = useTranslation(); // Tarea 2
    const [allAgendaItems, setAllAgendaItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeChartTab, setActiveChartTab] = useState('sector'); 
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ key: 'nombre', direction: 'asc' });

    // 1. Fetch Agenda Data in Real-Time
    useEffect(() => {
        if (!db) {
            setIsLoading(true);
            return;
        }
        
        setIsLoading(true); 
        const agendaRef = ref(db, getDbPaths().agenda);

        const unsubscribe = onValue(agendaRef, (snapshot) => {
            try {
                const items = snapshotToArray(snapshot);
                setAllAgendaItems(items);
                setIsLoading(false);
            } catch (e) {
                console.error("Error processing Agenda snapshot:", e);
                setIsLoading(false);
            }
        }, (error) => {
             console.error("Agenda Subscription Error:", error);
             setIsLoading(false);
        });

        return () => unsubscribe(); 
    }, [db]); 
    
    // 2. Data Filtering, Sorting, and Aggregation Logic 
    const { filteredAgendaItems, aggregatedData } = useMemo(() => {
        let finalData = allAgendaItems.filter(item => {
            // Column Filters
            for (const column of AGENDA_COLUMNS) {
                const key = column.key;
                const filterValue = filters[key];
                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;

                const itemValue = String(item[key] || '');

                if (!column.optionsKey) {
                    if (!itemValue.toLowerCase().includes(filterValue.toLowerCase())) {
                        return false;
                    }
                } 
                else if (itemValue !== filterValue) {
                    return false;
                }
            }
            return true;
        });

        // Sorting
        if (sort.key) {
            finalData.sort((a, b) => {
                const column = AGENDA_COLUMNS.find(c => c.key === sort.key);
                const aValue = a[sort.key] || '';
                const bValue = b[sort.key] || '';
                
                return (sort.direction === 'asc' ? 1 : -1) * String(aValue).localeCompare(String(bValue));
            });
        }
        
        // Aggregate data based on final filtered results
        const totals = {
            sector: {}, institucion: {}, pilar: {}, 
            agenda: {}, condicion: {}, tipoDeActo: {}
        };

        finalData.forEach(item => {
            Object.keys(totals).forEach(key => {
                const value = item[key] || 'N/A';
                totals[key][value] = (totals[key][value] || 0) + 1;
            });
        });
        
        return {
            filteredAgendaItems: finalData,
            aggregatedData: { totalCount: finalData.length, ...totals }
        };
    }, [allAgendaItems, filters, sort]);
    
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

    // Renders the selected chart
    const renderChart = (category) => {
        const counts = aggregatedData[category] || {};
        const totalCount = aggregatedData.totalCount || 0;
        
        if (Object.keys(counts).length === 0) {
            return <p className="text-gray-500 text-center py-4">{t('agenda.no_data')}</p>;
        }

        const chartType = CHART_TABS[category].type;

        switch (chartType) {
            case 'Pie':
                return <PieChartMock data={counts} totalCount={totalCount} t={t} />;
            case 'Radar':
                return <RadarChartMock data={counts} totalCount={totalCount} t={t} />;
            case 'Treemap':
                return <TreemapMock data={counts} t={t} />;
            case 'Bar':
            default:
                return <HorizontalBarChartMock data={counts} totalCount={totalCount} t={t} />;
        }
    };

    
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            {/* Tarea 1: Título oscuro y color de icono */}
            <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
                <Calendar className="w-8 h-8 mr-3 text-sky-400" />
                {t('agenda.title')}
            </h1>

            {/* Tarea 1: Contenedor oscuro para la tabla */}
            <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden mb-8">
                <CardTitle title={`${t('agenda.records_title')}: ${aggregatedData.totalCount ?? 0}`} icon={LayoutList} />
                
                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
                        <p className="ml-3 text-sky-200">{t('activity.loading_records')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-sky-800/50">
                            {/* Tarea 1: Cabecera oscura */}
                            <thead className="bg-sky-900/70">
                                <tr>
                                    {AGENDA_COLUMNS.map(column => (
                                        <TableHeaderWithControls
                                            key={column.key}
                                            column={column}
                                            currentSort={sort}
                                            onSortChange={handleSortChange}
                                            onFilterChange={handleFilterChange}
                                            filterOptions={AGENDA_COLUMN_OPTIONS_MAP}
                                            currentFilters={filters}
                                            dataItems={allAgendaItems}
                                            t={t} // Tarea 2
                                        />
                                    ))}
                                </tr>
                            </thead>
                            {/* Tarea 1: Cuerpo oscuro */}
                            <tbody className="bg-sky-950/50 divide-y divide-sky-800/50">
                                {filteredAgendaItems.length > 0 ? (
                                    filteredAgendaItems.map(item => (
                                        // Tarea 1: Fila oscura
                                        <tr key={item.id} className="hover:bg-sky-900/60 transition-colors">
                                            <td className="px-6 py-2 text-sm font-medium text-white truncate max-w-[150px]" title={item.nombre}>{item.nombre}</td>
                                            <td className="px-6 py-2 text-sm text-gray-400 truncate max-w-[100px]" title={item.pilar}>{item.pilar}</td>
                                            <td className="px-6 py-2 text-sm text-gray-400 truncate max-w-[150px]" title={item.tipoDeActo}>{item.tipoDeActo}</td>
                                            <td className="px-6 py-2 text-sm text-gray-400 truncate max-w-[100px]" title={item.sector}>{item.sector}</td>
                                            <td className="px-6 py-2 text-sm text-gray-400 truncate max-w-[200px]" title={item.situacion}>{item.situacion}</td>
                                            <td className="px-6 py-2 text-sm text-gray-400 truncate max-w-[200px]" title={item.impacto}>{item.impacto}</td>
                                            <td className="px-6 py-2 text-sm text-gray-400 truncate max-w-[150px]" title={item.institucion}>{item.institucion}</td>
                                            <td className="px-6 py-2 text-sm text-gray-400">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${item.condicion === 'finalizado' ? 'bg-green-900/50 text-green-300' : 'bg-yellow-900/50 text-yellow-300'}`}>
                                                    {item.condicion}
                                                </span>
                                            </td>
                                            <td className="px-6 py-2 text-sm text-gray-400">{item.agenda}</td>
                                            <td className="px-6 py-2 text-sm text-gray-400">{item.ano}</td>
                                            <td className="px-6 py-2 text-sm text-gray-400 truncate max-w-[150px]">
                                                {item.ayudaMemoria ? (
                                                    <a 
                                                        href={item.ayudaMemoria} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-blue-400 hover:text-blue-300 transition"
                                                        title="View Link"
                                                    >
                                                        View Link
                                                    </a>
                                                ) : 'N/A'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={AGENDA_COLUMNS.length} className="px-6 py-4 text-center text-gray-500">{t('policy.no_records')}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* 2. Visualization Tabs and Chart */}
            <div className="mb-4 flex flex-wrap gap-2">
                {Object.entries(CHART_TABS).map(([key, { labelKey }]) => (
                    <TabButton
                        key={key}
                        label={t(labelKey)} // Tarea 2
                        isActive={activeChartTab === key}
                        onClick={() => setActiveChartTab(key)}
                    />
                ))}
            </div>

            <ChartContainer 
                title={`${t('agenda.chart.distribution_by')} ${t(CHART_TABS[activeChartTab].labelKey)}`} // Tarea 2
                icon={CHART_TABS[activeChartTab].icon}
            >
                {renderChart(activeChartTab)}
            </ChartContainer>
        </div>
    );
};

export default AgendaDashboard;