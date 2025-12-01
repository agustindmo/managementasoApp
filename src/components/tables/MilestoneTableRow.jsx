import React from 'react';
import { Edit, Trash2, Link } from 'lucide-react';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

const MilestoneTableRow = ({ item, onEdit, onDelete }) => {
    return (
        <tr className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-3 text-sm font-medium text-slate-800 truncate max-w-[150px]" title={item.nombre}>{item.nombre}</td>
            <td className="px-6 py-3 text-sm text-slate-500 truncate max-w-[150px]" title={item.OKRs}>{item.OKRs}</td>
            <td className="px-6 py-3 text-sm text-slate-500 truncate max-w-[120px]" title={item.institucion}>{item.institucion}</td>
            <td className="px-6 py-3 text-sm text-slate-500">{item.ambito}</td>
            <td className="px-6 py-3 text-sm text-slate-500 truncate max-w-[150px]" title={item.tipoDeActo}>{item.tipoDeActo}</td>
            <td className="px-6 py-3 text-sm text-slate-500">{item.ano}</td>
            <td className="px-6 py-3 text-sm text-emerald-600 font-semibold">{formatCurrency(item.ahorro)}</td>
            
            <td className="px-6 py-3 text-sm text-slate-500 truncate max-w-[150px]">
                {item.archivo ? (
                    <a 
                        href={item.archivo} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 transition flex items-center"
                        title="View File Link"
                    >
                        <Link className="w-4 h-4 mr-1" /> View Link
                    </a>
                ) : 'N/A'}
            </td>

            <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex space-x-2 justify-end">
                    <button onClick={onEdit} className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50 transition" title="Edit">
                        <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={onDelete} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition" title="Delete">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default MilestoneTableRow;