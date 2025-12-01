import React from 'react';

const InputField = ({ label, name, type = 'text', value, onChange, required = true, rows = 1, placeholder, icon: Icon }) => (
    <div className="text-left">
        {/* Color de etiqueta actualizado para fondos claros */}
        {label && <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
        
        <div className="relative">
            {Icon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </div>
            )}
            
            {rows > 1 ? (
                <textarea
                    id={name} 
                    name={name} 
                    value={value}
                    onChange={onChange}
                    required={required}
                    rows={rows}
                    placeholder={placeholder}
                    // Estilos actualizados para tema claro: bg-white, texto gris, borde gris claro
                    className={`block w-full ${Icon ? 'pl-10' : 'px-3'} py-2 border border-gray-300 bg-white text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-gray-400 sm:text-sm`}
                />
            ) : (
                <input
                    id={name} 
                    name={name} 
                    type={type}
                    value={value}
                    onChange={onChange}
                    required={required}
                    placeholder={placeholder}
                    // Estilos actualizados para tema claro
                    className={`block w-full ${Icon ? 'pl-10' : 'px-3'} py-2 border border-gray-300 bg-white text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-gray-400 sm:text-sm`}
                />
            )}
        </div>
    </div>
);

export default InputField;