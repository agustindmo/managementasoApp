// src/components/dashboards/StakeholderMapDashboard.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { Users, Loader2, Map as MapIcon, LayoutList, ArrowUp, ArrowDown, PieChart, Target } from 'lucide-react'; 
import { ref, onValue } from 'firebase/database';
import { getDbPaths } from '../../services/firebase.js';
import CardTitle from '../ui/CardTitle.jsx';
import SelectField from '../ui/SelectField.jsx'; 
import { 
    STAKEHOLDER_CATEGORY_OPTIONS, 
    STAKEHOLDER_AMBITO_OPTIONS,
    ALL_FILTER_OPTION,
    ALL_YEAR_FILTER, 
    ANO_OPTIONS,
    SECTOR_OPTIONS,
    ROLE_SCORE_MAP,
    POSITION_SCORE_MAP,
} from '../../utils/constants.js';
import { useTranslation } from '../../context/TranslationContext.jsx'; 
// --- NUEVO: Importar Treemap de Recharts ---
import RechartsTreemap from '../charts/RechartsTreemap.jsx';

// ... (snapshotToArray, TabButton, y StakeholderPositionChart sin cambios) ...
const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({
        id: key,
        ...val[key],
    }));
};
const TabButton = ({ isActive, onClick, label }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold transition-all duration-300 rounded-t-lg 
            ${isActive 
                ? 'bg-sky-700 text-white shadow-md' 
                : 'bg-black/30 text-gray-400 hover:bg-black/50 hover:text-white'}`
        }
    >
        {label}
    </button>
);
const StakeholderPositionChart = ({ agendaItems, selectedAgendaId, t }) => {
    const getRoleScore = (roleKey) => ROLE_SCORE_MAP[roleKey] || 0;
    const getPositionScore = (posKey) => POSITION_SCORE_MAP[posKey] || 0;
    const stakeholdersToPlot = useMemo(() => {
        let itemsToProcess = [];
        if (!selectedAgendaId) {
            itemsToProcess = [];
        } else {
            const selectedItem = agendaItems.find(item => item.id === selectedAgendaId);
            itemsToProcess = selectedItem ? [selectedItem] : [];
        }
        const uniqueStakeholders = new Map();
        itemsToProcess.forEach(item => {
            (item.stakeholders || []).forEach(s => {
                if (!uniqueStakeholders.has(s.name)) {
                    uniqueStakeholders.set(s.name, s);
                }
            });
        });
        return Array.from(uniqueStakeholders.values());
    }, [agendaItems, selectedAgendaId]);
    const plotPoints = stakeholdersToPlot.map(s => {
        const xScore = getRoleScore(s.role); // Incidencia (1-4)
        const yScore = getPositionScore(s.position); // Posición (1-3)
        const xPercent = ((xScore - 1) / 3) * 100;
        const yPercent = ((yScore - 1) / 2) * 100;
        return {
            name: s.name,
            x: xPercent,
            y: yPercent,
            role: t(s.role),
            position: t(s.position)
        };
    });
    return (
        <div className="w-full p-4">
            <div className="relative w-full h-80 bg-sky-950/30 border border-sky-700/50 rounded-lg overflow-hidden">
                {/* Ejes y Cuadrícula */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between p-2 text-xs text-gray-400">
                    <span>{t('stakeholder.position.in_favor')}</span>
                    <span>{t('stakeholder.position.neutral')}</span>
                    <span>{t('stakeholder.position.against')}</span>
                </div>
                <div className="absolute bottom-0 left-0 w-full flex justify-between p-2 text-xs text-gray-400 pl-24">
                    <span>{t('stakeholder.role.other')}</span>
                    <span>{t('stakeholder.role.technical')}</span>
                    <span>{t('stakeholder.role.influences_policy')}</span>
                    <span>{t('stakeholder.role.changes_policy')}</span>
                </div>
                <div className="absolute left-20 top-1/2 w-[calc(100%-5rem)] h-px bg-sky-800/50"></div>
                <div className="absolute left-1/4 top-0 w-px h-full bg-sky-800/50" style={{ left: 'calc(20rem + ((100% - 20rem) / 3) * 1)' }}></div>
                <div className="absolute left-1/2 top-0 w-px h-full bg-sky-800/50" style={{ left: 'calc(5rem + ((100% - 5rem) / 3) * 2)' }}></div>
                <div className="absolute left-1/2 top-0 w-px h-full bg-sky-800/50" style={{ left: 'calc(5rem + ((100% - 5rem) / 3) * 1)' }}></div>
                <div className="absolute left-1/2 top-0 w-px h-full bg-sky-800/50" style={{ left: 'calc(5rem + ((100% - 5rem) / 3) * 0 + 65px)' }}></div>
                {/* Puntos (Stakeholders) */}
                <div className="absolute left-20 bottom-10 w-[calc(100%-6rem)] h-[calc(100%-3.5rem)]">
                    {plotPoints.map(p => (
                        <div 
                            key={p.name}
                            className="absolute w-3 h-3 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 group"
                            style={{ left: `${p.x}%`, bottom: `${p.y}%` }}
                        >
                            <div 
                                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 pb-1 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 bg-black/70 px-2 py-1 rounded z-10"
                            >
                                {p.name}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
// ... (fin de componentes) ...


const StakeholderMapDashboard = ({ db }) => {
    // ... (estados existentes) ...
    const { t } = useTranslation(); 
    const [agendaItems, setAgendaItems] = useState([]);
    const [activityItems, setActivityItems] = useState([]); 
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategoryTab, setActiveCategoryTab] = useState(STAKEHOLDER_CATEGORY_OPTIONS[0]); 
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ key: 'name', direction: 'asc' });
    const [selectedAgendaId, setSelectedAgendaId] = useState(null);
    const [yearFilter, setYearFilter] = useState(ALL_YEAR_FILTER); 

    // 1. Fetch data
    useEffect(() => {
        // ... (código existente) ...
        if (!db) return;
        setIsLoading(true);
        let agendaLoaded = false;
        let activitiesLoaded = false;
        const checkDone = () => {
            if (agendaLoaded && activitiesLoaded) setIsLoading(false);
        };
        const agendaRef = ref(db, getDbPaths().agenda);
        const unsubAgenda = onValue(agendaRef, (snapshot) => {
            try { setAgendaItems(snapshotToArray(snapshot)); } 
            catch (e) { console.error("Agenda fetch error:", e); }
            finally { agendaLoaded = true; checkDone(); }
        }, (error) => { console.error("Agenda Subscription Error:", error); agendaLoaded = true; checkDone(); });
        const activitiesRef = ref(db, getDbPaths().activities);
        const unsubActivities = onValue(activitiesRef, (snapshot) => {
            try { setActivityItems(snapshotToArray(snapshot)); } 
            catch (e) { console.error("Activities fetch error:", e); }
            finally { activitiesLoaded = true; checkDone(); }
        }, (error) => { console.error("Activities Subscription Error:", error); activitiesLoaded = true; checkDone(); });
        return () => {
            unsubAgenda();
            unsubActivities(); 
        };
    }, [db]);

    // 2. Filtrar datos por Año
    // ... (código existente de filtros) ...
    const filteredAgendaItems = useMemo(() => {
        if (yearFilter === ALL_YEAR_FILTER) return agendaItems;
        return agendaItems.filter(item => item.ano === yearFilter);
    }, [agendaItems, yearFilter]);
    const filteredActivityItems = useMemo(() => {
        if (yearFilter === ALL_YEAR_FILTER) return activityItems;
        return activityItems.filter(item => item.date && item.date.startsWith(yearFilter));
    }, [activityItems, yearFilter]);
    useEffect(() => {
        if (filteredAgendaItems.length > 0) {
            const isSelectedIdValid = filteredAgendaItems.some(item => item.id === selectedAgendaId);
            if (!isSelectedIdValid) {
                setSelectedAgendaId(filteredAgendaItems[0].id);
            }
        } else {
            setSelectedAgendaId(null); 
        }
    }, [filteredAgendaItems, selectedAgendaId]);

    // 3. Aggregate Stakeholders
    // ... (código existente) ...
    const { stakeholderMetrics, aggregatedTreemapData } = useMemo(() => {
        const treemapDataByStakeholder = {}; 
        let totalEngagements = 0;
        const uniqueNames = new Set();
        filteredActivityItems.forEach(activity => {
            const institutions = Array.isArray(activity.institution) ? activity.institution : [activity.institution];
            (institutions || []).forEach(instName => {
                if (!instName || instName === 'N/A') return;
                const nameKey = instName.trim();
                uniqueNames.add(nameKey);
                treemapDataByStakeholder[nameKey] = (treemapDataByStakeholder[nameKey] || 0) + 1;
                totalEngagements++; 
            });
        });
        return {
            stakeholderMetrics: {
                totalUnique: uniqueNames.size,
                totalEngagements: totalEngagements, 
            },
            aggregatedTreemapData: treemapDataByStakeholder, 
        };
    }, [filteredActivityItems]); 
    const { categorizedStakeholders } = useMemo(() => {
        const stakeholderMap = {};
        filteredAgendaItems.forEach(agenda => {
            const agendaName = agenda.nombre || 'N/A';
            const agendaSector = agenda.sector || 'N/A';
            const agendaYear = agenda.ano || 'N/A';
            if (Array.isArray(agenda.stakeholders)) {
                agenda.stakeholders.forEach(s => {
                    const nameKey = s.name.trim();
                    if (!nameKey) return;
                    const key = `${nameKey}|${s.type}|${s.ambito}`;
                    stakeholderMap[key] = stakeholderMap[key] || {
                        name: nameKey,
                        type: s.type, 
                        ambito: s.ambito,
                        agendaItems: new Set(),
                        sectors: new Set(),
                        years: new Set(),
                        totalCount: 0, 
                    };
                    stakeholderMap[key].agendaItems.add(agendaName);
                    stakeholderMap[key].sectors.add(agendaSector);
                    stakeholderMap[key].years.add(agendaYear);
                    stakeholderMap[key].totalCount++;
                });
            }
        });
        const allStakeholders = Object.values(stakeholderMap).map(s => ({
            ...s,
            agendaItems: Array.from(s.agendaItems).join(', '),
            sectors: Array.from(s.sectors).join(', '),
            years: Array.from(s.years).join(', '),
        }));
        const categorized = STAKEHOLDER_CATEGORY_OPTIONS.reduce((acc, cat) => {
            acc[cat] = allStakeholders.filter(s => s.type === cat);
            return acc;
        }, {});
        return { categorizedStakeholders: categorized };
    }, [filteredAgendaItems]); 

    // --- MODIFICADO: Formatear datos para Treemap ---
    const treemapChartData = useMemo(() => 
        Object.keys(aggregatedTreemapData).map(key => ({ 
            name: key, 
            size: aggregatedTreemapData[key] // 'size' es la clave que Recharts Treemap espera
        })), 
    [aggregatedTreemapData]);


    // 4. Filtering and Sorting Logic
    // ... (código existente) ...
    const filteredStakeholders = useMemo(() => {
        let currentData = categorizedStakeholders[activeCategoryTab] || [];
        currentData = currentData.filter(item => {
            for (const key in filters) {
                const filterValue = filters[key];
                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;
                const itemValue = String(item[key] || '');
                if (key === 'name' || key === 'agendaItems') {
                    if (!itemValue.toLowerCase().includes(filterValue.toLowerCase())) {
                        return false;
                    }
                } 
                else if (itemValue !== filterValue) {
                    if (key === 'sectors' || key === 'years') {
                        const itemArray = itemValue.split(', ').map(v => v.trim());
                        if (!itemArray.includes(filterValue)) {
                            return false;
                        }
                    } else if (itemValue !== filterValue) {
                        return false;
                    }
                }
            }
            return true;
        });
        if (sort.key) {
            currentData.sort((a, b) => {
                const aValue = a[sort.key] || '';
                const bValue = b[sort.key] || '';
                if (sort.key === 'totalCount') {
                    return (sort.direction === 'asc' ? 1 : -1) * (aValue - bValue);
                } else {
                    return (sort.direction === 'asc' ? 1 : -1) * String(aValue).localeCompare(String(bValue));
                }
            });
        }
        return currentData; 
    }, [categorizedStakeholders, activeCategoryTab, filters, sort]);

    // ... (código existente de handlers y TableHeader) ...
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
    const STAKEHOLDER_TABLE_COLUMNS = [
        { labelKey: "stakeholder.col.name", key: "name", sortable: true, filterable: true, type: 'string' },
        { labelKey: "stakeholder.col.scope", key: "ambito", sortable: true, filterable: true, options: Object.values(STAKEHOLDER_AMBITO_OPTIONS) }, 
        { labelKey: "stakeholder.col.agenda_items", key: "agendaItems", sortable: false, filterable: true, type: 'string' },
        { labelKey: "stakeholder.col.sectors", key: "sectors", sortable: false, filterable: true, options: SECTOR_OPTIONS },
        { labelKey: "stakeholder.col.years", key: "years", sortable: true, filterable: true, options: ANO_OPTIONS.filter(opt => opt !== ALL_YEAR_FILTER) },
        { labelKey: "stakeholder.col.total_engagements", key: "totalCount", sortable: true, filterable: false, type: 'number' },
    ];
    const getCategoryLabel = (key) => {
        if (key === 'civil society and ngos') {
            return t('stakeholder.category.civil_society');
        } else if (key === 'private') {
            return t('stakeholder.category.private');
        } else if (key === 'public') {
            return t('stakeholder.category.public');
        }
        return key; 
    };
    const TableHeaderWithControls = ({ column, currentSort, onSortChange, onFilterChange, currentFilters }) => {
        const label = t(column.labelKey); 
        const isSorted = currentSort.key === column.key;
        const sortIcon = isSorted ? (currentSort.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />) : null;
        const isDropdown = !!column.options;
        let options = column.options || [];
        const isTextInputFilter = !isDropdown;
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
                                    <option key={option} value={option} className="bg-sky-900">{getCategoryLabel(option)}</option>
                                ))}
                            </select>
                        )
                    )}
                </div>
            </th>
        );
    };


    if (!db) { 
        return <div className="p-8 text-center bg-red-900/50 border border-red-700 rounded-xl m-8"><p className="text-lg font-semibold text-red-300">{t('stakeholder.db_fail')}</p></div>;
    }
    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="ml-3 text-sky-200">{t('stakeholder.loading')}</p>
            </div>
        );
    }

    const agendaOptions = filteredAgendaItems.map(item => ({ value: item.id, label: item.nombre || 'Untitled' }));

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-3xl font-bold text-white flex items-center">
                    <MapIcon className="w-8 h-8 mr-3 text-sky-400" />
                    {t('stakeholder.title')}
                </h1>
                <div className="rounded-xl shadow max-w-xs border border-sky-700/50 bg-black/40 backdrop-blur-lg p-2 mt-4 sm:mt-0">
                    <SelectField 
                        label={t('director.filter_year')}
                        name="yearFilter" 
                        options={ANO_OPTIONS} 
                        value={yearFilter} 
                        onChange={(e) => setYearFilter(e.target.value)} 
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="p-4 rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg flex flex-col items-center justify-center">
                    <p className="text-4xl font-extrabold text-white">{stakeholderMetrics.totalUnique}</p>
                    <p className="text-sm text-gray-400 mt-1">{t('stakeholder.total_unique')}</p>
                </div>
                <div className="p-4 rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg flex flex-col items-center justify-center">
                    <p className="text-4xl font-extrabold text-sky-400">{stakeholderMetrics.totalEngagements}</p>
                    <p className="text-sm text-gray-400 mt-1">{t('stakeholder.total_engagements')}</p>
                </div>
            </div>

            {/* --- MODIFICADO: Usar RechartsTreemap --- */}
            <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden mb-8">
                <CardTitle title={`${t('stakeholder.all_engagements_title')} (${yearFilter})`} icon={PieChart} />
                <div className="p-4">
                    <RechartsTreemap data={treemapChartData} />
                </div>
            </div>

            <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden mb-8">
                <CardTitle title={`${t('stakeholder.chart.title')} (${yearFilter})`} icon={Target} />
                <div className="p-4">
                    {agendaOptions.length > 0 ? (
                        <>
                            <div className="max-w-xs mb-4">
                                <SelectField 
                                    label={t('stakeholder.chart.select_agenda')}
                                    name="agendaFilter"
                                    options={agendaOptions}
                                    value={selectedAgendaId || agendaOptions[0].value} 
                                    onChange={(e) => setSelectedAgendaId(e.target.value)}
                                />
                            </div>
                            <StakeholderPositionChart 
                                agendaItems={filteredAgendaItems} 
                                selectedAgendaId={selectedAgendaId} 
                                t={t} 
                            />
                        </>
                    ) : (
                        <p className="text-gray-500 text-center py-4">{t('agenda.no_data')}</p>
                    )}
                </div>
            </div>

            {/* --- Tabla (sin cambios) --- */}
            <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
                <div className="p-4 flex gap-2 border-b border-sky-700/50 bg-sky-950/30">
                    <h3 className="text-md font-semibold text-white mr-4 self-end">{t('stakeholder.filter_by_type')}</h3>
                    {STAKEHOLDER_CATEGORY_OPTIONS.map(key => (
                        <TabButton
                            key={key}
                            label={getCategoryLabel(key)} 
                            isActive={activeCategoryTab === key}
                            onClick={() => {
                                setActiveCategoryTab(key);
                                setFilters({}); 
                                setSort({ key: 'name', direction: 'asc' });
                            }}
                        />
                    ))}
                </div>
                <CardTitle title={`${getCategoryLabel(activeCategoryTab)} ${t('sidebar.stakeholder_map')} (${filteredStakeholders.length}) (${yearFilter})`} icon={LayoutList} />
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-sky-800/50">
                        <thead className="bg-sky-900/70">
                            <tr>
                                {STAKEHOLDER_TABLE_COLUMNS.map(column => (
                                    <TableHeaderWithControls
                                        key={column.key}
                                        column={column}
                                        currentSort={sort}
                                        onSortChange={handleSortChange}
                                        onFilterChange={handleFilterChange}
                                        currentFilters={filters}
                                    />
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-sky-950/50 divide-y divide-sky-800/50">
                            {filteredStakeholders.length > 0 ? (
                                filteredStakeholders.map((item, index) => (
                                    <tr key={index} className="hover:bg-sky-900/60 transition-colors">
                                        <td className="px-6 py-2 text-sm font-medium text-white truncate max-w-[150px]" title={item.name}>{item.name}</td>
                                        <td className="px-6 py-2 text-sm text-gray-400 capitalize">{item.ambito}</td>
                                        <td className="px-6 py-2 text-sm text-gray-400 truncate max-w-[200px]" title={item.agendaItems}>{item.agendaItems}</td>
                                        <td className="px-6 py-2 text-sm text-gray-400 truncate max-w-[150px]" title={item.sectors}>{item.sectors}</td>
                                        <td className="px-6 py-2 text-sm text-gray-400">{item.years}</td>
                                        <td className="px-6 py-2 text-sm font-bold text-sky-400">{item.totalCount}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={STAKEHOLDER_TABLE_COLUMNS.length} className="px-6 py-4 text-center text-gray-500">{t('stakeholder.no_stakeholders_found')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StakeholderMapDashboard;