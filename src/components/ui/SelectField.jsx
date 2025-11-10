import React from 'react';
import { useTranslation } from '../../context/TranslationContext.jsx'; // Importar 't'

const SelectField = ({ label, name, options, value, onChange }) => {
    // Usamos 't' para traducir las opciones que son strings (claves de traducción)
    const { t } = useTranslation(); 
    
    return (
        <div className="text-left">
            {/* Estilo oscuro para la etiqueta */}
            <label htmlFor={name} className="block text-sm font-medium text-gray-200">{label}</label>
            <select
                id={name} 
                name={name} 
                value={value}
                onChange={onChange}
                // Estilo oscuro para el select
                className="mt-1 block w-full px-3 py-2 border border-sky-700 bg-sky-950/50 text-white rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500"
            >
                {options.map((opt, index) => {
                    // *** ESTA ES LA CORRECCIÓN ***
                    // 1. Comprobar si 'opt' es un objeto {value, label} o un string simple
                    const isObject = typeof opt === 'object' && opt !== null && opt.hasOwnProperty('value');
                    
                    // 2. Definir el valor y la etiqueta basados en el tipo
                    const val = isObject ? opt.value : opt;
                    // Si es objeto, usa su 'label'. Si es string, intenta traducirlo (o usa el string mismo)
                    const lbl = isObject ? opt.label : (t(opt) || opt); 
                    
                    return (
                        <option key={val + index} value={val} className="bg-sky-900 text-white">
                            {lbl}
                        </option>
                    );
                })}
            </select>
        </div>
    );
};

export default SelectField;