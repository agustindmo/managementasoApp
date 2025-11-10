import React from 'react';
import { Edit, Trash2, Link } from 'lucide-react';
// We do not need Realtime DB imports here because deletion logic is passed via onDelete prop.

const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

const MilestoneTableRow = ({ item, onEdit, onDelete }) => {
    return (
        // Tarea 1: Estilo de fila oscuro
        <tr className="hover:bg-sky-900/60 transition-colors">
            <td className="px-6 py-2 text-sm font-medium text-white truncate max-w-[150px]" title={item.nombre}>{item.nombre}</td>
            <td className="px-6 py-2 text-sm text-gray-400 truncate max-w-[150px]" title={item.OKRs}>{item.OKRs}</td>
            <td className="px-6 py-2 text-sm text-gray-400 truncate max-w-[120px]" title={item.institucion}>{item.institucion}</td>
            <td className="px-6 py-2 text-sm text-gray-400">{item.ambito}</td>
            <td className="px-6 py-2 text-sm text-gray-400 truncate max-w-[150px]" title={item.tipoDeActo}>{item.tipoDeActo}</td>
            <td className="px-6 py-2 text-sm text-gray-400">{item.ano}</td>
            {/* Tarea 1: Color de texto de moneda actualizado */}
            <td className="px-6 py-2 text-sm text-green-400 font-semibold">{formatCurrency(item.ahorro)}</td>
            
            <td className="px-6 py-2 text-sm text-gray-400 truncate max-w-[150px]">
                {item.archivo ? (
                    // Tarea 1: Color de enlace actualizado
                    <a 
                        href={item.archivo} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition"
                        title="View File Link"
                    >
                        View Link
                    </a>
                ) : 'N/A'}
            </td>

            {/* Tarea 1: Estilo de botones oscuro */}
            <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex space-x-2 justify-end">
                    <button
                        onClick={onEdit}
                        className="text-sky-400 hover:text-sky-200 p-1 rounded-full hover:bg-sky-800/50 transition"
                        title="Edit Record"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="text-red-400 hover:text-red-200 p-1 rounded-full hover:bg-red-800/50 transition"
                        title="Delete Record"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default MilestoneTableRow;