// src/components/governance/MeetingsTab.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { Loader2, Calendar, ArrowUp, ArrowDown, PlusCircle, Edit, Trash2, Link } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import CardTitle from '../ui/CardTitle.jsx';
import { 
    ALL_FILTER_OPTION,
    GOVERNANCE_MEETING_TABLE_COLUMNS,
    GOVERNANCE_MEETING_COLUMN_OPTIONS_MAP
} from '../../utils/constants.js';
import { useTranslation } from '../../context/TranslationContext.jsx'; 
import GovernanceMeetingForm from '../forms/GovernanceMeetingForm.jsx';

const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({
        id: key,
        ...val[key],
    }));
};

const TableHeaderWithControls = ({ column, currentSort, onSortChange, onFilterChange, filterOptions, currentFilters, t, isAdmin }) => {
    const label = t(column.labelKey); 

    if (column.key === 'actions' && !isAdmin) {
        return null;
    }
    
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
            className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap bg-slate-50"
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
                                <option key={option} value={option}>
                                    {t(`governance.meeting.type.${option.toLowerCase()}`)}
                                </option>
                            ))}
                        </select>
                    )
                )}
            </div>
        </th>
    );
};

const MeetingTableRow = ({ item, onEdit, onDelete, t, isAdmin }) => {
    return (
        <tr className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
            <td className="px-6 py-3 text-sm font-medium text-slate-800 truncate max-w-[200px]" title={item.name}>{item.name}</td>
            <td className="px-6 py-3 text-sm text-slate-500">{item.date}</td>
            <td className="px-6 py-3 text-sm text-slate-500">{t(`governance.meeting.type.${item.type.toLowerCase()}`)}</td>
            <td className="px-6 py-3 text-sm text-slate-500 whitespace-nowrap">
                {item.call_link ? (
                    <a href={item.call_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 transition flex items-center">
                        <Link className="w-4 h-4 mr-1" /> {t('governance.meeting.col.call_link')}
                    </a>
                ) : 'N/A'}
            </td>
            <td className="px-6 py-3 text-sm text-slate-500 whitespace-nowrap">
                {item.minute_link ? (
                    <a href={item.minute_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 transition flex items-center">
                        <Link className="w-4 h-4 mr-1" /> {t('governance.meeting.col.minute_link')}
                    </a>
                ) : 'N/A'}
            </td>
            {isAdmin && (
                <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2 justify-end">
                        <button
                            onClick={onEdit}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition"
                            title={t('activity.form.edit_title')}
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onDelete}
                            className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition"
                            title={t('admin.reject')}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </td>
            )}
        </tr>
    );
};

const MeetingsTab = ({ db, userId, role }) => {
    const { t } = useTranslation();
    const [dataItems, setDataItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ key: 'date', direction: 'desc' });
    const [view, setView] = useState('table');
    const [activeRecord, setActiveRecord] = useState(null);

    const isAdmin = role === 'admin';
    const dbPathKey = 'governanceMeetings';
    const filterOptionsMap = GOVERNANCE_MEETING_COLUMN_OPTIONS_MAP;
    
    useEffect(() => {
        if (!db) return;
        
        const dataRef = ref(db, getDbPaths()[dbPathKey]);
        
        const unsubscribe = onValue(dataRef, (snapshot) => {
            try {
                setDataItems(snapshotToArray(snapshot));
            } catch (e) { console.error("Error processing governance meetings snapshot:", e); }
            finally { setIsLoading(false); }
        }, (err) => {
            console.error("Governance meetings subscription error:", err);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [db]);

    const filteredAndSortedItems = useMemo(() => {
        let finalData = dataItems;

        if (role === 'user' || role === 'userinvitee') {
            finalData = finalData.filter(item => item.type === 'Assembly');
        }

        finalData = finalData.filter(item => {
            for (const key in filters) {
                const filterValue = filters[key]?.toLowerCase();
                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;
                const itemValue = String(item[key] || '').toLowerCase();
                if (key === 'type' && filterValue !== itemValue.toLowerCase()) return false;
                if (key !== 'type' && !itemValue.includes(filterValue)) return false;
            }
            return true;
        });

        if (sort.key) {
            finalData.sort((a, b) => {
                const aValue = a[sort.key] || '';
                const bValue = b[sort.key] || '';
                return (sort.direction === 'asc' ? 1 : -1) * String(aValue).localeCompare(String(bValue));
            });
        }
        return finalData;
    }, [dataItems, filters, sort, role]);

    const handleSortChange = (key) => {
        setSort(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    };
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };
    const handleOpenForm = (record = null) => {
        if (!isAdmin) return;
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
                const itemRef = ref(db, `${getDbPaths()[dbPathKey]}/${id}`);
                await remove(itemRef); 
            } catch (e) { console.error("Error deleting governance meeting:", e); }
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="ml-3 text-slate-500">{t('profile.loading_admin')}</p>
            </div>
        );
    }
    
    if (view === 'form' && isAdmin) {
        return (
            <GovernanceMeetingForm
                userId={userId}
                db={db}
                initialData={activeRecord}
                onClose={handleCloseForm}
                mode={activeRecord ? 'edit' : 'add'}
                role={role}
            />
        );
    }
    
    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200">
                <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                        {`${t('governance.tab.meetings')} (${filteredAndSortedItems.length})`}
                    </h2>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => handleOpenForm(null)}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition shadow-md"
                    >
                        <PlusCircle className="w-4 h-4" />
                        <span>{t('governance.meeting.form.add_title')}</span>
                    </button>
                )}
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            {GOVERNANCE_MEETING_TABLE_COLUMNS.map(column => (
                                (isAdmin || column.key !== 'actions') &&
                                <TableHeaderWithControls
                                    key={column.key}
                                    column={column}
                                    currentSort={sort}
                                    onSortChange={handleSortChange}
                                    onFilterChange={handleFilterChange}
                                    filterOptions={filterOptionsMap}
                                    currentFilters={filters}
                                    t={t}
                                    isAdmin={isAdmin}
                                />
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {filteredAndSortedItems.length > 0 ? (
                            filteredAndSortedItems.map(item => (
                                <MeetingTableRow
                                    key={item.id}
                                    item={item}
                                    onEdit={() => handleOpenForm(item)} 
                                    onDelete={() => handleDelete(item.id)} 
                                    t={t}
                                    isAdmin={isAdmin}
                                />
                            ))
                        ) : (
                            <tr><td colSpan={GOVERNANCE_MEETING_TABLE_COLUMNS.length} className="px-6 py-4 text-center text-slate-500">{t('stakeholder.no_stakeholders_found')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MeetingsTab;