// src/components/governance/LegalDocumentsTab.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { Loader2, FileText, ArrowUp, ArrowDown, PlusCircle, Edit, Trash2, Link } from 'lucide-react';
import { getDbPaths } from '../../services/firebase.js';
import CardTitle from '../ui/CardTitle.jsx';
import { 
    ALL_FILTER_OPTION,
    LEGAL_DOCUMENT_TABLE_COLUMNS,
} from '../../utils/constants.js';
import { useTranslation } from '../../context/TranslationContext.jsx'; 
import LegalDocumentForm from '../forms/LegalDocumentForm.jsx';

const snapshotToArray = (snapshot) => {
    if (!snapshot.exists()) return [];
    const val = snapshot.val();
    return Object.keys(val).map(key => ({
        id: key,
        ...val[key],
    }));
};

// --- Cabecera de la Tabla ---
const TableHeaderWithControls = ({ column, currentSort, onSortChange, onFilterChange, currentFilters, t, isAdmin }) => {
    const label = t(column.labelKey); 

    if (column.key === 'actions' && !isAdmin) {
        return null; // Ocultar columna de acciones si no es admin
    }
    
    const isSorted = currentSort.key === column.key;
    const sortIcon = isSorted ? (currentSort.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />) : null;
    
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
                     <input
                        type="text"
                        placeholder={`${t('policy.search')} ${label}`}
                        value={currentFilters[column.key] || ''}
                        onChange={(e) => onFilterChange(column.key, e.target.value)}
                        className="text-xs p-1 border border-sky-700 bg-sky-950/50 text-white rounded-lg focus:ring-sky-500 focus:border-sky-500 min-w-[100px]"
                    />
                )}
            </div>
        </th>
    );
};

// --- Fila de la Tabla ---
const DocumentTableRow = ({ item, onEdit, onDelete, t, isAdmin }) => {
    return (
        <tr className="hover:bg-sky-900/60 transition-colors">
            <td className="px-6 py-2 text-sm font-medium text-white truncate max-w-[200px]" title={item.name}>{item.name}</td>
            <td className="px-6 py-2 text-sm text-gray-400">{item.date}</td>
            <td className="px-6 py-2 text-sm text-gray-400 whitespace-nowrap">
                {item.link ? (
                    <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition flex items-center"
                        title="View Document Link"
                    >
                        <Link className="w-4 h-4 mr-1" /> Link
                    </a>
                ) : 'N/A'}
            </td>
            {isAdmin && (
                <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
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
                </td>
            )}
        </tr>
    );
};

// --- Componente Principal de la Pestaña ---
const LegalDocumentsTab = ({ db, userId, role }) => {
    const { t } = useTranslation();
    const [dataItems, setDataItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ key: 'date', direction: 'desc' });
    const [view, setView] = useState('table');
    const [activeRecord, setActiveRecord] = useState(null);

    const isAdmin = role === 'admin';
    const dbPathKey = 'legalDocuments';
    
    // 1. Data Fetching
    useEffect(() => {
        if (!db) return;
        
        const dataRef = ref(db, getDbPaths()[dbPathKey]);
        
        const unsubscribe = onValue(dataRef, (snapshot) => {
            try {
                setDataItems(snapshotToArray(snapshot));
            } catch (e) { console.error("Error processing legal documents snapshot:", e); }
            finally { setIsLoading(false); }
        }, (err) => {
            console.error("Legal documents subscription error:", err);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [db]);

    // 2. Lógica de filtro y orden
    const filteredAndSortedItems = useMemo(() => {
        let finalData = dataItems.filter(item => {
            for (const key in filters) {
                const filterValue = filters[key]?.toLowerCase();
                if (!filterValue) continue;
                const itemValue = String(item[key] || '').toLowerCase();
                if (!itemValue.includes(filterValue)) return false;
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
    }, [dataItems, filters, sort]);

    // Handlers
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
            } catch (e) { console.error("Error deleting legal document:", e); }
        }
    };

    // 3. Render Logic
    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="ml-3 text-sky-200">{t('profile.loading_admin')}</p>
            </div>
        );
    }
    
    if (view === 'form' && isAdmin) {
        return (
            <LegalDocumentForm
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
        <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-sky-900/70 rounded-t-xl border-b border-sky-700/50">
                <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-sky-300" />
                    <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                        {`${t('governance.tab.documents')} (${filteredAndSortedItems.length})`}
                    </h2>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => handleOpenForm(null)}
                        className="flex items-center space-x-2 bg-sky-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-sky-700 transition shadow-md"
                    >
                        <PlusCircle className="w-4 h-4" />
                        <span>{t('governance.doc.form.add_title')}</span>
                    </button>
                )}
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-sky-800/50">
                    <thead className="bg-sky-900/70">
                        <tr>
                            {LEGAL_DOCUMENT_TABLE_COLUMNS.map(column => (
                                <TableHeaderWithControls
                                    key={column.key}
                                    column={column}
                                    currentSort={sort}
                                    onSortChange={handleSortChange}
                                    onFilterChange={handleFilterChange}
                                    filterOptions={{}}
                                    currentFilters={filters}
                                    t={t}
                                    isAdmin={isAdmin}
                                />
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-sky-950/50 divide-y divide-sky-800/50">
                        {filteredAndSortedItems.length > 0 ? (
                            filteredAndSortedItems.map(item => (
                                <DocumentTableRow
                                    key={item.id}
                                    item={item}
                                    onEdit={() => handleOpenForm(item)} 
                                    onDelete={() => handleDelete(item.id)} 
                                    t={t}
                                    isAdmin={isAdmin}
                                />
                            ))
                        ) : (
                            <tr><td colSpan={LEGAL_DOCUMENT_TABLE_COLUMNS.length} className="px-6 py-4 text-center text-gray-500">{t('stakeholder.no_stakeholders_found')}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LegalDocumentsTab;