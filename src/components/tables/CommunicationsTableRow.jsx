import React from 'react';

// This row is designed to receive a flattened message object
const CommunicationsTableRow = ({ item }) => {
    return (
        // TAREA 1: Estilo oscuro
        <tr className="hover:bg-sky-900/60 transition-colors">
            <td className="px-6 py-3 text-sm font-medium text-white truncate max-w-[200px]" title={item.agendaItemName}>
                {item.agendaItemName}
            </td>
            <td className="px-6 py-3 text-sm text-gray-400 truncate max-w-[150px]" title={item.solicitud}>
                {item.solicitud}
            </td>
            <td className="px-6 py-3 text-sm text-gray-300 max-w-[300px] line-clamp-3" title={item.message}>
                {item.message}
            </td>
            <td className="px-6 py-3 text-sm text-sky-400 truncate max-w-[200px]" title={item.stakeholders.join(', ')}>
                {item.stakeholders.join(', ')}
            </td>
            <td className="px-6 py-3 text-sm text-gray-400 whitespace-nowrap">
                {item.date}
            </td>
        </tr>
    );
};

export default CommunicationsTableRow;