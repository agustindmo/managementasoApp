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
    ALL_YEAR_FILTER, // Import year filters
    ANO_OPTIONS,
    SECTOR_OPTIONS,
    ROLE_SCORE_MAP,
    POSITION_SCORE_MAP,
} from '../../utils/constants.js';
import { useTranslation } from '../../context/TranslationContext.jsx'; 

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

const TreemapMock = ({ data, t }) => { 
    const entries = Object.entries(data)
        .sort(([, countA], [, countB]) => countB - countA)
        .filter(([, count]) => count > 0);
    
    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    const colors = ['bg-sky-600', 'bg-blue-500', 'bg-green-500', 'bg-purple-400', 'bg-orange-400', 'bg-red-500', 'bg-indigo-500', 'bg-teal-500', 'bg-pink-500', 'bg-yellow-500'];

    if (total === 0) {
        return <p className="text-gray-500 text-center py-4">{t('stakeholder.no_engagement_data')}</p>;
    }

    return (
        <div className="flex w-full h-auto p-1 border border-sky-700/50 bg-black/30 rounded-lg flex-wrap gap-0.5">
            {entries.map(([label, count], index) => {
                const percentage = (count / total) * 100;
                const widthStyle = { 
                    width: `${Math.max(percentage, 5)}%`, 
                    minWidth: '80px', 
                    height: '60px', 
                };

                return (
                    <div 
                        key={label}
                        className={`flex-grow flex items-center justify-center p-1 text-center font-bold shadow-sm rounded-sm ${colors[index % colors.length]}`}
                        style={widthStyle}
                        title={`${label}: ${count} ${t('stakeholder.col.total_engagements')} (${percentage.toFixed(1)}%)`}
                    >
                        <span className={`text-xs ${percentage < 10 ? 'text-gray-900' : 'text-white'} truncate`}>{label}</span>
                    </div>
                );
            })}
        </div>
    );
};

// --- MODIFICADO: Lógica de labels actualizada ---
const StakeholderPositionChart = ({ agendaItems, selectedAgendaId, t }) => {
    
    const getRoleScore = (roleKey) => ROLE_SCORE_MAP[roleKey] || 0;
    const getPositionScore = (posKey) => POSITION_SCORE_MAP[posKey] || 0;

    const stakeholdersToPlot = useMemo(() => {
        let itemsToProcess = [];
        
        // --- MODIFICADO: Ya no hay 'all', chequear 'selectedAgendaId' ---
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
                {/* Eje Y (Posición) */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between p-2 text-xs text-gray-400">
                    <span>{t('stakeholder.position.in_favor')}</span>
                    <span>{t('stakeholder.position.neutral')}</span>
                    <span>{t('stakeholder.position.against')}</span>
                </div>
                {/* Eje X (Incidencia) */}
                <div className="absolute bottom-0 left-0 w-full flex justify-between p-2 text-xs text-gray-400 pl-24">
                    <span>{t('stakeholder.role.other')}</span>
                    <span>{t('stakeholder.role.technical')}</span>
                    <span>{t('stakeholder.role.influences_policy')}</span>
                    <span>{t('stakeholder.role.changes_policy')}</span>
                </div>
                
                {/* Líneas de cuadrícula */}
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
                            {/* --- MODIFICADO: Label con fondo, oculto por defecto --- */}
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
// --- Fin del nuevo componente ---


const StakeholderMapDashboard = ({ db }) => {
    const { t } = useTranslation(); 
    const [agendaItems, setAgendaItems] = useState([]);
    const [activityItems, setActivityItems] = useState([]); // --- NUEVO: Estado para Actividades
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategoryTab, setActiveCategoryTab] = useState(STAKEHOLDER_CATEGORY_OPTIONS[0]); 
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ key: 'name', direction: 'asc' });
    const [selectedAgendaId, setSelectedAgendaId] = useState(null);
    const [yearFilter, setYearFilter] = useState(ALL_YEAR_FILTER); // --- NUEVO: Estado de Filtro de Año

    // 1. Fetch data from Agenda AND Activities
    useEffect(() => {
        if (!db) return;
        setIsLoading(true);
        let agendaLoaded = false;
        let activitiesLoaded = false;

        const checkDone = () => {
            if (agendaLoaded && activitiesLoaded) setIsLoading(false);
        };

        const agendaRef = ref(db, getDbPaths().agenda);
        const unsubAgenda = onValue(agendaRef, (snapshot) => {
            try {
                setAgendaItems(snapshotToArray(snapshot));
            } catch (e) { console.error("Agenda fetch error:", e); }
            finally { agendaLoaded = true; checkDone(); }
        }, (error) => { console.error("Agenda Subscription Error:", error); agendaLoaded = true; checkDone(); });
        
        // --- NUEVO: Fetch de Actividades ---
        const activitiesRef = ref(db, getDbPaths().activities);
        const unsubActivities = onValue(activitiesRef, (snapshot) => {
            try {
                setActivityItems(snapshotToArray(snapshot));
            } catch (e) { console.error("Activities fetch error:", e); }
            finally { activitiesLoaded = true; checkDone(); }
        }, (error) => { console.error("Activities Subscription Error:", error); activitiesLoaded = true; checkDone(); });

        return () => {
            unsubAgenda();
            unsubActivities(); // Limpiar ambas suscripciones
        };
    }, [db]);

    // --- NUEVO: Hooks para filtrar datos por año ---
    const filteredAgendaItems = useMemo(() => {
        if (yearFilter === ALL_YEAR_FILTER) return agendaItems;
        return agendaItems.filter(item => item.ano === yearFilter);
    }, [agendaItems, yearFilter]);

    const filteredActivityItems = useMemo(() => {
        if (yearFilter === ALL_YEAR_FILTER) return activityItems;
        return activityItems.filter(item => item.date && item.date.startsWith(yearFilter));
    }, [activityItems, yearFilter]);

    // Hook para setear el ID de agenda por defecto (basado en agenda FILTRADA)
    useEffect(() => {
        if (filteredAgendaItems.length > 0) {
            // Si el ID seleccionado ya no está en la lista filtrada, resetea
            const isSelectedIdValid = filteredAgendaItems.some(item => item.id === selectedAgendaId);
            if (!isSelectedIdValid) {
                setSelectedAgendaId(filteredAgendaItems[0].id);
            }
        } else {
            setSelectedAgendaId(null); // No hay items
        }
    }, [filteredAgendaItems, selectedAgendaId]);

    // 2. Aggregate Stakeholders (MODIFICADO para usar datos separados)
    // --- Métricas y Treemap (Contadores) -> Usan Activity Log ---
    const { stakeholderMetrics, aggregatedTreemapData } = useMemo(() => {
        const treemapDataByStakeholder = {}; 
        let totalEngagements = 0;
        const uniqueNames = new Set();
        
        // Usar datos de ACTIVIDADES FILTRADAS
        filteredActivityItems.forEach(activity => {
            const institutions = Array.isArray(activity.institution) ? activity.institution : [activity.institution];
            
            (institutions || []).forEach(instName => {
                if (!instName || instName === 'N/A') return;
                
                const nameKey = instName.trim();
                uniqueNames.add(nameKey);
                treemapDataByStakeholder[nameKey] = (treemapDataByStakeholder[nameKey] || 0) + 1;
                totalEngagements++; // Contar cada aparición
            });
        });
        
        return {
            stakeholderMetrics: {
                totalUnique: uniqueNames.size,
                totalEngagements: totalEngagements, // Métrica corregida
            },
            aggregatedTreemapData: treemapDataByStakeholder, 
        };
    }, [filteredActivityItems]); // Depende de las actividades filtradas

    // --- Tabla de Stakeholders -> Usa Agenda ---
    const { categorizedStakeholders } = useMemo(() => {
        const stakeholderMap = {};
        
        // Usar datos de AGENDA FILTRADA
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
    }, [filteredAgendaItems]); // Depende de la agenda filtrada


    // 3. Filtering and Sorting Logic (para la tabla)
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
    
    // Custom Table Header Component
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

    // --- MODIFICADO: Opciones de Agenda sin "All" ---
    const agendaOptions = filteredAgendaItems.map(item => ({ value: item.id, label: item.nombre || 'Untitled' }));

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-3xl font-bold text-white flex items-center">
                    <MapIcon className="w-8 h-8 mr-3 text-sky-400" />
                    {t('stakeholder.title')}
                </h1>
                
                {/* --- NUEVO: Filtro de Año --- */}
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
                {/* --- MODIFICADO: Valor usa 'totalEngagements' --- */}
                <div className="p-4 rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg flex flex-col items-center justify-center">
                    <p className="text-4xl font-extrabold text-sky-400">{stakeholderMetrics.totalEngagements}</p>
                    <p className="text-sm text-gray-400 mt-1">{t('stakeholder.total_engagements')}</p>
                </div>
            </div>

            <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden mb-8">
                <CardTitle title={`${t('stakeholder.all_engagements_title')} (${yearFilter})`} icon={PieChart} />
                <div className="p-4">
                    <TreemapMock data={aggregatedTreemapData} t={t} />
                </div>
            </div>

            <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden mb-8">
                <CardTitle title={`${t('stakeholder.chart.title')} (${yearFilter})`} icon={Target} />
                <div className="p-4">
                    {/* --- MODIFICADO: Dropdown y renderizado de gráfico --- */}
                    {agendaOptions.length > 0 ? (
                        <>
                            <div className="max-w-xs mb-4">
                                <SelectField 
                                    label={t('stakeholder.chart.select_agenda')}
                                    name="agendaFilter"
                                    options={agendaOptions}
                                    value={selectedAgendaId || agendaOptions[0].value} // Usar el estado o el primero de la lista
                                    onChange={(e) => setSelectedAgendaId(e.target.value)}
                                />
                            </div>
                            <StakeholderPositionChart 
                                agendaItems={filteredAgendaItems} // Pasar items filtrados
                                selectedAgendaId={selectedAgendaId} 
                                t={t} 
                            />
                        </>
                    ) : (
                        <p className="text-gray-500 text-center py-4">{t('agenda.no_data')}</p>
                    )}
                </div>
            </div>

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