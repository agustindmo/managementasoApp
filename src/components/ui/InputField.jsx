import React from 'react';

const InputField = ({ label, name, type = 'text', value, onChange, required = true, rows = 1 }) => (
    <div className="text-left">
        {/* Color de etiqueta actualizado para fondos oscuros */}
        <label htmlFor={name} className="block text-sm font-medium text-gray-200">{label}</label>
        {rows > 1 ? (
            <textarea
                id={name} 
                name={name} 
                value={value}
                onChange={onChange}
                required={required}
                rows={rows}
                // Estilos actualizados para tema oscuro + paleta 'sky'
                className="mt-1 block w-full px-3 py-2 border border-sky-700 bg-sky-950/50 text-white rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500"
            />
        ) : (
            <input
                id={name} 
                name={name} 
                type={type}
                value={value}
                onChange={onChange}
                required={required}
                // Estilos actualizados para tema oscuro + paleta 'sky'
                className="mt-1 block w-full px-3 py-2 border border-sky-700 bg-sky-950/50 text-white rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500"
            />
        )}
    </div>
);

export default InputField;