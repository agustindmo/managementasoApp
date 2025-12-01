import React from 'react';
import { useTranslation } from '../../context/TranslationContext.jsx'; 

const SelectField = ({ label, name, options, value, onChange }) => {
    const { t } = useTranslation(); 
    
    return (
        <div className="text-left">
            {/* Estilo claro para la etiqueta */}
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <select
                id={name} 
                name={name} 
                value={value}
                onChange={onChange}
                // Estilo claro para el select: fondo blanco, texto oscuro, borde gris
                className="block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            >
                {options.map((opt, index) => {
                    const isObject = typeof opt === 'object' && opt !== null && opt.hasOwnProperty('value');
                    
                    const val = isObject ? opt.value : opt;
                    const lbl = isObject ? opt.label : (t(opt) || opt); 
                    
                    // Las opciones no necesitan clases de color de fondo en la mayoría de navegadores modernos en modo claro
                    return (
                        <option key={val + index} value={val}>
                            {lbl}
                        </option>
                    );
                })}
            </select>
        </div>
    );
};

export default SelectField;