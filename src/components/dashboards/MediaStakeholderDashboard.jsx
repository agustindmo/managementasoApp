// src/components/dashboards/MediaStakeholderMapDashboard.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { Users, Loader2, Radio as MapIcon, LayoutList, ArrowUp, ArrowDown, PieChart, Target, PlusCircle, Edit, Trash2 } from 'lucide-react'; 
import { ref, onValue, remove } from 'firebase/database'; // Import remove
import { getDbPaths } from '../../services/firebase.js';
import CardTitle from '../ui/CardTitle.jsx';
import SelectField from '../ui/SelectField.jsx'; 
import { 
    ALL_FILTER_OPTION,
    ANO_OPTIONS,
    ALL_YEAR_FILTER,
    POSITION_SCORE_MAP, 
    MEDIA_STAKEHOLDER_TABLE_COLUMNS,
    MEDIA_STAKEHOLDER_COLUMN_OPTIONS_MAP
} from '../../utils/constants.js';
import { useTranslation } from '../../context/TranslationContext.jsx'; 
// Importar el nuevo formulario
import MediaStakeholderForm from '../forms/MediaStakeholderForm.jsx';

const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({
        id: key,
        ...val[key],
    }));
};

// --- NUEVO: Componente de Gráfico de Burbujas ---
const BubbleChartMock = ({ data, t, title }) => {
    const entries = Object.entries(data)
        .sort(([, countA], [, countB]) => countB - countA)
        .filter(([, count]) => count > 0);
    
    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    const max = Math.max(...entries.map(([, count]) => count));

    // Asignar colores basados en la clave (ej. Posición)
    const getBgColor = (key) => {
        if (key === t('stakeholder.position.in_favor')) return 'bg-green-600/70 border-green-400';
        if (key === t('stakeholder.position.against')) return 'bg-red-600/70 border-red-400';
        if (key === t('stakeholder.position.neutral')) return 'bg-yellow-600/70 border-yellow-400';
        // Colores de fallback para Scope
        const colors = ['bg-sky-600/70 border-sky-400', 'bg-blue-600/70 border-blue-400', 'bg-purple-600/70 border-purple-400', 'bg-orange-600/70 border-orange-400'];
        const index = Object.keys(data).indexOf(key);
        return colors[index % colors.length];
    };

    if (total === 0) {
        return <p className="text-gray-500 text-center py-4">{t('stakeholder.no_engagement_data')}</p>;
    }

    return (
         <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
            <CardTitle title={`${title} (${total})`} icon={PieChart} />
            <div className="flex w-full h-48 p-4 bg-black/30 rounded-b-lg flex-wrap gap-4 items-center justify-center">
                {entries.map(([label, count]) => {
                    const size = 48 + (count / max) * 64; // min 48px, max 112px
                    return (
                        <div 
                            key={label}
                            className={`flex flex-col items-center justify-center rounded-full shadow-2xl transition-all duration-300 ${getBgColor(label)}`}
                            style={{ 
                                height: `${size}px`, 
                                width: `${size}px`,
                                borderWidth: '2px'
                            }}
                            title={`${label}: ${count}`}
                        >
                            <span className="text-xl font-bold text-white">{count}</span>
                            <span className="text-xs text-white/80 truncate px-2">{label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


// --- Cabecera de la Tabla ---
const TableHeaderWithControls = ({ column, currentSort, onSortChange, onFilterChange, currentFilters, t }) => {
    const label = t(column.labelKey); 
    if (column.key === 'actions') {
        return <th key={column.key} className="px-6 py-3 text-left text-xs font-medium text-sky-200 uppercase tracking-wider">{label}</th>;
    }
    
    const isSorted = currentSort.key === column.key;
    const sortIcon = isSorted ? (currentSort.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />) : null;
    
    const isDropdown = !!column.optionsKey;
    let options = isDropdown ? (MEDIA_STAKEHOLDER_COLUMN_OPTIONS_MAP[column.optionsKey] || []) : [];
    
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

// --- Fila de la Tabla ---
const StakeholderTableRow = ({ item, onEdit, onDelete, t, isAdmin }) => {
    return (
        <tr className="hover:bg-sky-900/60 transition-colors">
            <td className="px-6 py-2 text-sm font-medium text-white truncate max-w-[150px]" title={item.name}>{item.name}</td>
            <td className="px-6 py-2 text-sm text-gray-400 capitalize">{t(`press_log.format_opts.${item.type.toLowerCase()}`)}</td>
            <td className="px-6 py-2 text-sm text-gray-400 capitalize">{t(item.position)}</td>
            <td className="px-6 py-2 text-sm text-gray-400 capitalize">{item.scope}</td>
            <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                {isAdmin && (
                    <div className="flex space-x-2 justify-end">
                        <button
                            onClick={onEdit}
                            className="text-sky-400 hover:text-sky-200 p-1 rounded-full hover:bg-sky-800/50 transition"
                            title={t('activity.form.edit_title')}
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onDelete}
                            className="text-red-400 hover:text-red-200 p-1 rounded-full hover:bg-red-800/50 transition"
                            title={t('admin.reject')}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </td>
        </tr>
    );
};


// --- Componente de Dashboard Principal ---
const MediaStakeholderMapDashboard = ({ db, userId, role }) => {
    const { t } = useTranslation(); 
    const [pressLogItems, setPressLogItems] = useState([]);
    const [mediaStakeholders, setMediaStakeholders] = useState([]); // El "mapa"
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ key: 'name', direction: 'asc' });
    const [yearFilter, setYearFilter] = useState(ALL_YEAR_FILTER);
    
    const [view, setView] = useState('table');
    const [activeRecord, setActiveRecord] = useState(null);
    const isAdmin = role === 'admin';

    // 1. Fetch data from Press Log (para métricas) AND Media Stakeholders (para la tabla)
    useEffect(() => {
        if (!db) return;
        setIsLoading(true);
        let pressLogLoaded = false;
        let stakeholdersLoaded = false;

        const checkDone = () => {
            if (pressLogLoaded && stakeholdersLoaded) setIsLoading(false);
        };

        const pressLogRef = ref(db, getDbPaths().pressLog);
        const unsubPressLog = onValue(pressLogRef, (snapshot) => {
            try { setPressLogItems(snapshotToArray(snapshot)); } 
            catch (e) { console.error("Press Log fetch error:", e); }
            finally { pressLogLoaded = true; checkDone(); }
        }, (error) => { console.error("Press Log Subscription Error:", error); pressLogLoaded = true; checkDone(); });
        
        const stakeholdersRef = ref(db, getDbPaths().mediaStakeholders);
        const unsubStakeholders = onValue(stakeholdersRef, (snapshot) => {
            try { setMediaStakeholders(snapshotToArray(snapshot)); }
            catch (e) { console.error("Media Stakeholders fetch error:", e); }
            finally { stakeholdersLoaded = true; checkDone(); }
        }, (error) => { console.error("Media Stakeholders Subscription Error:", error); stakeholdersLoaded = true; checkDone(); });

        return () => {
            unsubPressLog();
            unsubStakeholders();
        };
    }, [db]);

    // 2. Filtrar Press Log por Año
    const filteredPressLogItems = useMemo(() => {
        if (yearFilter === ALL_YEAR_FILTER) return pressLogItems;
        return pressLogItems.filter(item => item.date && item.date.startsWith(yearFilter));
    }, [pressLogItems, yearFilter]);

    // 3. Aggregate Metrics (Contadores) from Press Log
    const stakeholderMetrics = useMemo(() => {
        let totalEngagements = 0;
        const uniqueNames = new Set();
        
        filteredPressLogItems.forEach(log => {
            const keys = log.mediaStakeholderKeys || [];
            keys.forEach(key => {
                totalEngagements++; // Contar cada aparición
                uniqueNames.add(key); // Añadir a Set para conteo único
            });
        });
        
        return {
            totalUnique: uniqueNames.size,
            totalEngagements: totalEngagements,
        };
    }, [filteredPressLogItems]);

    // 4. Aggregate Treemaps from Media Stakeholders list (la tabla principal)
    const { treemapByPosition, treemapByScope } = useMemo(() => {
        const treemapByPosition = {};
        const treemapByScope = {};

        mediaStakeholders.forEach(s => {
            const positionKey = t(s.position) || 'N/A';
            const scopeKey = s.scope || 'N/A';
            
            treemapByPosition[positionKey] = (treemapByPosition[positionKey] || 0) + 1;
            treemapByScope[scopeKey] = (treemapByScope[scopeKey] || 0) + 1;
        });
        
        return { treemapByPosition, treemapByScope };
    }, [mediaStakeholders, t]);


    // 5. Filtering and Sorting Logic (para la tabla)
    const filteredStakeholders = useMemo(() => {
        // No filtramos por año la lista principal de stakeholders
        let currentData = mediaStakeholders; 
        
        currentData = currentData.filter(item => {
            for (const key in filters) {
                const filterValue = filters[key];
                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;
                const itemValue = String(item[key] || '');
                if (itemValue !== filterValue) return false;
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

    // Handlers
    const handleSortChange = (key) => {
        setSort(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    };
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };
    const handleOpenForm = (record = null) => {
        setActiveRecord(record);
        setView('form');
    };
    const handleCloseForm = () => {
        setActiveRecord(null);
        setView('table');
    };
    const handleDelete = async (id) => {
        if (db && isAdmin && window.confirm(t('policy.confirm_delete'))) { 
            try {
                const itemRef = ref(db, `${getDbPaths().mediaStakeholders}/${id}`);
                await remove(itemRef); 
            } catch (e) { console.error("Error deleting media stakeholder:", e); }
        }
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

    // --- Render Lógica ---

    if (view === 'form') {
        return (
             <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <MediaStakeholderForm
                    userId={userId}
                    db={db}
                    initialData={activeRecord}
                    onClose={handleCloseForm}
                    mode={activeRecord ? 'edit' : 'add'}
                />
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-3xl font-bold text-white flex items-center">
                    <MapIcon className="w-8 h-8 mr-3 text-sky-400" />
                    {t('media_stakeholder.title')}
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

            {/* --- MODIFICADO: Usar BubbleChartMock en lugar de TreemapMock --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <BubbleChartMock data={treemapByPosition} t={t} title={t('media_stakeholder.position_chart')} />
                <BubbleChartMock data={treemapByScope} t={t} title={t('media_stakeholder.scope_chart')} />
            </div>

            <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-sky-900/70 rounded-t-xl border-b border-sky-700/50">
                    <div className="flex items-center space-x-3">
                        <LayoutList className="w-5 h-5 text-sky-300" />
                        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                            {`${t('sidebar.media_stakeholder_map')} (${filteredStakeholders.length})`}
                        </h2>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => handleOpenForm(null)}
                            className="flex items-center space-x-2 bg-sky-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-sky-700 transition shadow-md"
                            title={t('media_stakeholder.form.add_title')}
                        >
                            <PlusCircle className="w-4 h-4" />
                            <span>{t('media_stakeholder.form.add_title')}</span>
                        </button>
                    )}
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-sky-800/50">
                        <thead className="bg-sky-900/70">
                            <tr>
                                {MEDIA_STAKEHOLDER_TABLE_COLUMNS.map(column => (
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
                            </tr>
                        </thead>
                        <tbody className="bg-sky-950/50 divide-y divide-sky-800/50">
                            {filteredStakeholders.length > 0 ? (
                                filteredStakeholders.map((item, index) => (
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
                                <tr><td colSpan={MEDIA_STAKEHOLDER_TABLE_COLUMNS.length} className="px-6 py-4 text-center text-gray-500">{t('stakeholder.no_stakeholders_found')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MediaStakeholderMapDashboard;