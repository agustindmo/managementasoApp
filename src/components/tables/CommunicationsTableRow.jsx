import React from 'react';

const CommunicationsTableRow = ({ item }) => {
    return (
        <tr className="hover:bg-slate-50 transition-colors">
            <td className="px-6 py-3 text-sm font-medium text-slate-800 truncate max-w-[200px]" title={item.agendaItemName}>
                {item.agendaItemName}
            </td>
            <td className="px-6 py-3 text-sm text-slate-500 truncate max-w-[150px]" title={item.solicitud}>
                {item.solicitud}
            </td>
            <td className="px-6 py-3 text-sm text-slate-600 max-w-[300px] line-clamp-3" title={item.message}>
                {item.message}
            </td>
            <td className="px-6 py-3 text-sm text-blue-600 truncate max-w-[200px]" title={item.stakeholders.join(', ')}>
                {item.stakeholders.join(', ')}
            </td>
            <td className="px-6 py-3 text-sm text-slate-500 whitespace-nowrap">
                {item.date}
            </td>
        </tr>
    );
};

export default CommunicationsTableRow;