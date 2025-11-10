import React from 'react';

const CardTitle = ({ title, icon: Icon }) => (
    // TAREA 1: Estilo de tarjeta oscuro/transparente
    <div className="flex items-center space-x-3 p-4 bg-sky-900/70 rounded-t-xl border-b border-sky-700/50">
        {/* TAREA 4: Iconos consistentes */}
        <Icon className="w-5 h-5 text-sky-300" />
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">{title}</h2>
    </div>
);

export default CardTitle;