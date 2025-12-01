import React from 'react';
import { Edit, Trash2, Link } from 'lucide-react';

const AgendaTableRow = ({ item, onEdit, onDelete }) => {
    return (
        <tr className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-3 text-sm font-medium text-slate-800 truncate max-w-[150px]" title={item.nombre}>{item.nombre}</td>
            <td className="px-6 py-3 text-sm text-slate-500 truncate max-w-[100px]" title={item.pilar}>{item.pilar}</td>
            <td className="px-6 py-3 text-sm text-slate-500 truncate max-w-[150px]" title={item.tipoDeActo}>{item.tipoDeActo}</td>
            <td className="px-6 py-3 text-sm text-slate-500 truncate max-w-[100px]" title={item.sector}>{item.sector}</td>
            <td className="px-6 py-3 text-sm text-slate-500 truncate max-w-[250px]" title={item.situacion}>{item.situacion}</td>
            <td className="px-6 py-3 text-sm text-slate-500 truncate max-w-[200px]" title={item.impacto}>{item.impacto}</td>
            <td className="px-6 py-3 text-sm text-slate-500 truncate max-w-[150px]" title={item.institucion}>{item.institucion}</td>
            <td className="px-6 py-3 text-sm">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.condicion === 'finalizado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {item.condicion}
                </span>
            </td>
            <td className="px-6 py-3 text-sm text-slate-500">{item.agenda}</td>
            <td className="px-6 py-3 text-sm text-slate-500">{item.ano}</td>
            <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex space-x-2 justify-end">
                    <button onClick={onEdit} className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50 transition" title="Edit">
                        <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={onDelete} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition" title="Delete">
                        <Trash2 className="w-4 h-4" />
                    </button>
                    {item.ayudaMemoria && (
                        <a href={item.ayudaMemoria} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition" title="View Link">
                            <Link className="w-4 h-4" />
                        </a>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default AgendaTableRow;