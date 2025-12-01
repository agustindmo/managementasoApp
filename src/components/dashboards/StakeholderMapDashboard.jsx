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
import RechartsTreemap from '../charts/RechartsTreemap.jsx';
import { 
    ScatterChart, 
    Scatter, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
} from 'recharts';


const StakeholderScatterChart = ({ data, t }) => {
    
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const pointData = payload[0].payload;
            return (
                <div className="p-2 bg-white border border-gray-200 rounded-md shadow-lg text-sm">
                    <p className="font-semibold text-sky-700">{pointData.name}</p>
                    <p className="text-gray-600">{`${t('stakeholder.influence') || 'Influence'} (X): ${pointData.x}`}</p>
                    <p className="text-gray-600">{`${t('stakeholder.position_label') || 'Position'} (Y): ${pointData.y}`}</p>
                </div>
            );
        }
        return null;
    };
    
    const maxInfluence = Math.max(...Object.values(ROLE_SCORE_MAP)); 
    const maxPosition = Math.max(...Object.values(POSITION_SCORE_MAP)); 
    
    return (
        <div style={{ width: '100%', height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid 
                        stroke="#e2e8f0" 
                        strokeDasharray="3 3"
                    />

                    <XAxis 
                        type="number" 
                        dataKey="x" 
                        name={t('stakeholder.influence') || 'Influence'} 
                        domain={[1, maxInfluence]}
                        interval={0}
                        tickCount={maxInfluence} 
                        stroke="#64748b"
                        tick={{ fill: '#64748b' }}
                        label={{ value: t('stakeholder.influence') || 'Influence (Role)', position: 'bottom', fill: '#64748b', dy: 10 }}
                    />

                    <YAxis 
                        type="number" 
                        dataKey="y" 
                        name={t('stakeholder.position_label') || 'Position'} 
                        domain={[1, maxPosition]} 
                        interval={0}
                        tickCount={maxPosition} 
                        stroke="#64748b"
                        tick={{ fill: '#64748b' }}
                        label={{ value: t('stakeholder.position_label') || 'Position (Interest)', position: 'left', angle: -90, fill: '#64748b', dx: -10 }}
                    />
                    
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip t={t} />} />
                    
                    <Scatter 
                        name="Stakeholders" 
                        data={data} 
                        fill="#0ea5e9" 
                        line={false} 
                        shape="circle" 
                        strokeWidth={1}
                        stroke="#0284c7"
                    />
                </ScatterChart>
            </ResponsiveContainer>
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
const TabButton = ({ isActive, onClick, label }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold transition-all duration-300 rounded-t-lg 
            ${isActive 
                ? 'bg-sky-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`
        }
    >
        {label}
    </button>
);

const StakeholderMapDashboard = ({ db }) => {
    const { t } = useTranslation(); 
    const [agendaItems, setAgendaItems] = useState([]);
    const [activityItems, setActivityItems] = useState([]); 
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategoryTab, setActiveCategoryTab] = useState(STAKEHOLDER_CATEGORY_OPTIONS[0]); 
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ key: 'name', direction: 'asc' });
    const [selectedAgendaId, setSelectedAgendaId] = useState(null);
    const [yearFilter, setYearFilter] = useState(ALL_YEAR_FILTER); 

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

    const { stakeholderMetrics, treemapChartData } = useMemo(() => {
        const treemapDataByStakeholder = {}; 
        let totalEngagements = 0;
        const uniqueNames = new Set();
        
        filteredActivityItems.forEach(activity => {
            const institutions = Array.isArray(activity.institution) ? activity.institution : [activity.institution];
            (institutions || []).forEach(instName => {
                if (!instName || instName === 'N/A') return;
                
                const nameKey = instName.trim().toLowerCase(); 
                
                uniqueNames.add(nameKey);
                treemapDataByStakeholder[nameKey] = (treemapDataByStakeholder[nameKey] || 0) + 1; 
                totalEngagements++; 
            });
        });
        
        const flatData = Object.keys(treemapDataByStakeholder).map(key => ({ 
            name: key, 
            value: treemapDataByStakeholder[key]
        }));
        
        const treemapChartData = flatData.length > 0 ? [{ 
            name: t('stakeholder.all_engagements_title') || 'Engagements', 
            children: flatData 
        }] : [];


        return {
            stakeholderMetrics: {
                totalUnique: uniqueNames.size,
                totalEngagements: totalEngagements, 
            },
            treemapChartData,
        };
    }, [filteredActivityItems, t]); 
    
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
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
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
            return t('stakeholder.category.civil_society') || 'Civil Society/NGOs';
        } else if (key === 'private') {
            return t('stakeholder.category.private') || 'Private Sector';
        } else if (key === 'public') {
            return t('stakeholder.category.public') || 'Public';
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
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
            >
                <div className="flex flex-col space-y-1">
                    <div className="flex items-center">
                        <span 
                            className={`cursor-pointer font-medium ${column.sortable ? 'hover:text-sky-700 transition-colors' : ''}`}
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
                                placeholder={`${t('stakeholder.search_placeholder') || 'Search'} ${label}`} 
                                value={currentFilters[column.key] || ''}
                                onChange={(e) => onFilterChange(column.key, e.target.value)}
                                className="text-xs p-1 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-sky-500 focus:border-sky-500 min-w-[80px]"
                            />
                        ) : (
                            <select
                                value={currentFilters[column.key] || ALL_FILTER_OPTION}
                                onChange={(e) => onFilterChange(column.key, e.target.value)}
                                className="text-xs p-1 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-sky-500 focus:border-sky-500 min-w-[80px]"
                            >
                                <option value={ALL_FILTER_OPTION} className="bg-gray-50">{t('stakeholder.category.all') || 'All'}</option>
                                {options.map(option => (
                                    <option key={option} value={option} className="bg-white">{getCategoryLabel(option)}</option>
                                ))}
                            </select>
                        )
                    )}
                </div>
            </th>
        );
    };


    if (!db) { 
        return <div className="p-8 text-center bg-red-50 border border-red-200 rounded-xl m-8"><p className="text-lg font-semibold text-red-600">{t('stakeholder.db_fail') || 'Database connection failed.'}</p></div>;
    }
    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
                <p className="ml-3 text-gray-500">{t('stakeholder.loading') || 'Loading data...'}</p>
            </div>
        );
    }

    const agendaOptions = filteredAgendaItems.map(item => ({ value: item.id, label: item.nombre || 'Untitled' }));

    const StakeholderPositionChart = ({ agendaItems, selectedAgendaId, t }) => {
        const getRoleScore = (roleKey) => ROLE_SCORE_MAP[roleKey] || 1; 
        const getPositionScore = (posKey) => POSITION_SCORE_MAP[posKey] || 1; 
        
        const stakeholdersToPlot = useMemo(() => {
            let itemsToProcess = [];
            if (!selectedAgendaId || !agendaItems) {
                itemsToProcess = [];
            } else {
                const selectedItem = agendaItems.find(item => item.id === selectedAgendaId);
                itemsToProcess = selectedItem ? [selectedItem] : [];
            }
            
            const uniqueStakeholderMap = new Map(); 
            
            itemsToProcess.forEach(item => {
                (item.stakeholders || []).forEach(s => {
                    if (!uniqueStakeholderMap.has(s.name)) {
                        uniqueStakeholderMap.set(s.name, s);
                    }
                });
            });
            
            return Array.from(uniqueStakeholderMap.values()).map(s => { 
                const xScore = getRoleScore(s.role); 
                const yScore = getPositionScore(s.position); 
                return {
                    name: s.name,
                    x: xScore, 
                    y: yScore, 
                    role: t(s.role),
                    position: t(s.position)
                };
            });
        }, [agendaItems, selectedAgendaId, t]);
        
        return (
            <div className="w-full p-4">
                {stakeholdersToPlot.length > 0 ? (
                    <StakeholderScatterChart data={stakeholdersToPlot} t={t} />
                ) : (
                    <p className="text-gray-500 text-center py-8">{t('stakeholder.select_agenda_or_no_data')}</p>
                )}
            </div>
        );
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <MapIcon className="w-8 h-8 mr-3 text-sky-600" />
                    {t('stakeholder.title') || 'Stakeholder Map'}
                </h1>
                <div className="rounded-xl shadow-sm max-w-xs border border-gray-200 bg-white p-2 mt-4 sm:mt-0">
                    <SelectField 
                        label={t('director.filter_year') || 'Filter Year'}
                        name="yearFilter" 
                        options={ANO_OPTIONS} 
                        value={yearFilter} 
                        onChange={(e) => setYearFilter(e.target.value)} 
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm flex flex-col items-center justify-center hover:shadow-md transition-shadow">
                    <p className="text-4xl font-extrabold text-gray-800">{stakeholderMetrics.totalUnique}</p>
                    <p className="text-sm text-gray-500 mt-1">{t('stakeholder.total_unique') || 'Total Unique Public Stakeholders (Institutions)'}</p>
                </div>
                <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm flex flex-col items-center justify-center hover:shadow-md transition-shadow">
                    <p className="text-4xl font-extrabold text-sky-600">{stakeholderMetrics.totalEngagements}</p>
                    <p className="text-sm text-gray-500 mt-1">{t('stakeholder.total_engagements') || 'Total Engagements Logged (Public Stakeholders)'}</p>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-8 h-96">
                <CardTitle title={`${t('stakeholder.all_engagements_title') || 'Engagements by Public Stakeholder'} (${yearFilter})`} icon={PieChart} />
                <div className="p-4 h-[calc(100%-4rem)]">
                    {treemapChartData && treemapChartData.length > 0 ? (
                        <RechartsTreemap data={treemapChartData} dataKey="value" />
                    ) : (
                        <p className="text-gray-500 text-center py-8">{t('stakeholder.no_treemap_data') || 'No engagement data for Treemap.'}</p>
                    )}
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-8 h-auto">
                <CardTitle title={`${t('stakeholder.chart.title') || 'Position Matrix'} (${yearFilter})`} icon={Target} />
                <div className="p-4">
                    {agendaOptions.length > 0 ? (
                        <>
                            <div className="max-w-xs mb-4">
                                <SelectField 
                                    label={t('stakeholder.chart.select_agenda') || 'Select Agenda Item'}
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
                        <p className="text-gray-500 text-center py-4">{t('agenda.no_data') || 'No agenda items found for matrix.'}</p>
                    )}
                </div>
            </div>


            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="p-4 flex gap-2 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-md font-semibold text-gray-700 mr-4 self-end">{t('stakeholder.filter_by_type') || 'Filter By Type:'}</h3>
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
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
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
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredStakeholders.length > 0 ? (
                                filteredStakeholders.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3 text-sm font-medium text-gray-900 truncate max-w-[150px]" title={item.name}>{item.name}</td>
                                        <td className="px-6 py-3 text-sm text-gray-600 capitalize">{item.ambito}</td>
                                        <td className="px-6 py-3 text-sm text-gray-600 truncate max-w-[200px]" title={item.agendaItems}>{item.agendaItems}</td>
                                        <td className="px-6 py-3 text-sm text-gray-600 truncate max-w-[150px]" title={item.sectors}>{item.sectors}</td>
                                        <td className="px-6 py-3 text-sm text-gray-600">{item.years}</td>
                                        <td className="px-6 py-3 text-sm font-bold text-sky-600">{item.totalCount}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={STAKEHOLDER_TABLE_COLUMNS.length} className="px-6 py-4 text-center text-gray-500">{t('stakeholder.no_stakeholders_found') || 'No stakeholders found in this category.'}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StakeholderMapDashboard;