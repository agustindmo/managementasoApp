import React from 'react';

const CardTitle = ({ title, icon: Icon }) => (
    // TAREA 1: Estilo de tarjeta claro (blanco) con bordes suaves
    <div className="flex items-center space-x-3 p-4 bg-white rounded-t-xl border-b border-gray-100">
        {/* TAREA 4: Iconos consistentes en tono azul */}
        <Icon className="w-5 h-5 text-sky-600" />
        <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">{title}</h2>
    </div>
);

export default CardTitle;