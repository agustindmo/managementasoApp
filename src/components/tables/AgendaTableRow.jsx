import React from 'react';
import { Edit, Trash2, Link } from 'lucide-react';
// We do not need Realtime DB imports here because deletion logic is passed via onDelete prop.

const AgendaTableRow = ({ item, onEdit, onDelete }) => {
    return (
        // Tarea 1: Estilo de fila oscuro
        <tr className="hover:bg-sky-900/60 transition-colors">
            <td className="px-6 py-2 text-sm font-medium text-white truncate max-w-[150px]" title={item.nombre}>{item.nombre}</td>
            <td className="px-6 py-2 text-sm text-gray-400 truncate max-w-[100px]" title={item.pilar}>{item.pilar}</td>
            <td className="px-6 py-2 text-sm text-gray-400 truncate max-w-[150px]" title={item.tipoDeActo}>{item.tipoDeActo}</td>
            <td className="px-6 py-2 text-sm text-gray-400 truncate max-w-[100px]" title={item.sector}>{item.sector}</td>
            <td className="px-6 py-2 text-sm text-gray-400 truncate max-w-[250px]" title={item.situacion}>{item.situacion}</td>
            <td className="px-6 py-2 text-sm text-gray-400 truncate max-w-[200px]" title={item.impacto}>{item.impacto}</td>
            <td className="px-6 py-2 text-sm text-gray-400 truncate max-w-[150px]" title={item.institucion}>{item.institucion}</td>
            <td className="px-6 py-2 text-sm text-gray-400">
                {/* Tarea 1: Estilo de insignia oscuro */}
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${item.condicion === 'finalizado' ? 'bg-green-900/50 text-green-300' : 'bg-yellow-900/50 text-yellow-300'}`}>
                    {item.condicion}
                </span>
            </td>
            <td className="px-6 py-2 text-sm text-gray-400">{item.agenda}</td>
            <td className="px-6 py-2 text-sm text-gray-400">{item.ano}</td>
            <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
                {/* Tarea 1: Estilo de botones oscuro */}
                <div className="flex space-x-2">
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
                    {item.ayudaMemoria && (
                        <a 
                            href={item.ayudaMemoria} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-200 p-1 rounded-full hover:bg-blue-800/50 transition"
                            title="View Link"
                        >
                            <Link className="w-4 h-4" />
                        </a>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default AgendaTableRow;