import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { Loader2, Star, ArrowUp, ArrowDown, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import { ALL_FILTER_OPTION, PROJECT_TABLE_COLUMNS } from '../../utils/constants.js';
import { useTranslation } from '../../context/TranslationContext.jsx'; 

const snapshotToArray = (snapshot) => { if (!snapshot.exists()) return []; const val = snapshot.val(); return Object.keys(val).map(key => ({ id: key, ...val[key] })); };
const formatCurrency = (value) => { const numericValue = parseFloat(value) || 0; return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numericValue); };

const TableHeaderWithControls = ({ column, currentSort, onSortChange, onFilterChange, currentFilters, t }) => {
    const label = t(column.labelKey); 
    if (column.key === 'actions') return <th key={column.key} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50">{label}</th>;
    const isSorted = currentSort.key === column.key;
    const sortIcon = isSorted ? (currentSort.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />) : null;
    
    return (
        <th key={column.key} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap bg-slate-50">
            <div className="flex flex-col space-y-2">
                <div className="flex items-center cursor-pointer hover:text-slate-700" onClick={() => column.sortable && onSortChange(column.key)}>
                    <span className="font-bold">{label}</span> {sortIcon}
                </div>
                {column.filterable && (
                     <input type={column.type === 'number' ? 'number' : 'text'} placeholder={`${t('policy.search')} ${label}`} value={currentFilters[column.key] || ''} onChange={(e) => onFilterChange(column.key, e.target.value)} className="text-xs p-1 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 min-w-[100px] bg-white text-slate-800" />
                )}
            </div>
        </th>
    );
};

const ProjectTableRow = ({ item, onEdit, onDelete, isAdmin }) => (
    <tr className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
        <td className="px-6 py-3 text-sm font-medium text-slate-900">{item.name}</td>
        <td className="px-6 py-3 text-sm text-slate-600">{item.sponsor}</td>
        <td className="px-6 py-3 text-sm text-slate-600">{item.date}</td>
        <td className="px-6 py-3 text-sm text-emerald-600 font-semibold">{formatCurrency(item.amount)}</td>
        <td className="px-6 py-3 text-sm text-slate-600 truncate max-w-[200px]">{item.description}</td>
        <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
            {isAdmin && (
                <div className="flex space-x-2 justify-end">
                    <button onClick={onEdit} className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition"><Edit className="w-4 h-4" /></button>
                    <button onClick={onDelete} className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition"><Trash2 className="w-4 h-4" /></button>
                </div>
            )}
        </td>
    </tr>
);

const FinanceProjectTable = ({ db, onOpenForm, role }) => { 
    const { t } = useTranslation(); 
    const isAdmin = role === 'admin';
    const [dataItems, setDataItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ key: 'date', direction: 'desc' });

    useEffect(() => {
        if (!db) return;
        setIsLoading(true); 
        const dataRef = ref(db, getDbPaths().financeProjects); 
        const unsubscribe = onValue(dataRef, (snapshot) => {
            try { setDataItems(snapshotToArray(snapshot)); } 
            catch (e) { console.error("Error processing Project snapshot:", e); } 
            finally { setIsLoading(false); }
        });
        return () => unsubscribe();
    }, [db]);

    const filteredAndSortedItems = useMemo(() => {
        let finalData = dataItems.filter(item => {
            for (const column of PROJECT_TABLE_COLUMNS) {
                const key = column.key;
                const filterValue = filters[key];
                if (!filterValue || filterValue === ALL_FILTER_OPTION) continue;
                let itemValue = item[key] || '';
                if (!String(itemValue).toLowerCase().includes(String(filterValue).toLowerCase())) return false;
            }
            return true;
        });
        if (sort.key) {
            finalData.sort((a, b) => {
                const aValue = a[sort.key] || (sort.key === 'amount' ? 0 : '');
                const bValue = b[sort.key] || (sort.key === 'amount' ? 0 : '');
                if (sort.key === 'amount') return (sort.direction === 'asc' ? 1 : -1) * (aValue - bValue);
                return (sort.direction === 'asc' ? 1 : -1) * String(aValue).localeCompare(String(bValue));
            });
        }
        return finalData;
    }, [dataItems, filters, sort]);

    const handleDelete = async (id) => {
        if (db && isAdmin && window.confirm(t('policy.confirm_delete'))) { 
            try { await remove(ref(db, `${getDbPaths().financeProjects}/${id}`)); } catch (e) { console.error("Error deleting project:", e); }
        }
    };

    const handleSortChange = (key) => setSort(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
    const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

    if (isLoading) return <div className="flex justify-center items-center h-48"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /><p className="ml-3 text-slate-500">{t('finance.projects.loading')}</p></div>;
    
    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200">
                <div className="flex items-center space-x-3">
                    <Star className="w-5 h-5 text-blue-600" />
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{`${t('finance.tab.projects')} (${filteredAndSortedItems.length})`}</h2>
                </div>
                <div className="flex space-x-2">
                    {isAdmin && <button onClick={() => onOpenForm(null)} className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition shadow-md"><PlusCircle className="w-4 h-4" /><span>{t('finance.projects.add')}</span></button>}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>{PROJECT_TABLE_COLUMNS.map(column => (<TableHeaderWithControls key={column.key} column={column} currentSort={sort} onSortChange={handleSortChange} onFilterChange={handleFilterChange} currentFilters={filters} t={t} />))}</tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {filteredAndSortedItems.length > 0 ? filteredAndSortedItems.map(item => <ProjectTableRow key={item.id} item={item} onEdit={() => onOpenForm(item)} onDelete={() => handleDelete(item.id)} isAdmin={isAdmin} />) : <tr><td colSpan={PROJECT_TABLE_COLUMNS.length} className="px-6 py-4 text-center text-slate-500">{t('press_log.no_records')}</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default FinanceProjectTable;