// src/components/utils/StakeholderInput.jsx

import React, { useState } from 'react';
import { Users, Search, Plus, Trash2, X } from 'lucide-react';
import InputField from '../components/ui/InputField.jsx';
import SelectField from '../components/ui/SelectField.jsx';
import CardTitle from '../components/ui/CardTitle.jsx';
import {
    STAKEHOLDER_TYPE_OPTIONS,
    STAKEHOLDER_AMBITO_OPTIONS,
    STAKEHOLDER_ROLE_OPTIONS,
    STAKEHOLDER_POSITION_OPTIONS
} from '../../utils/constants.js'; 

const StakeholderInput = ({ t, stakeholders, onStakeholderChange, options = [] }) => {
    const [newStakeholder, setNewStakeholder] = useState({
        name: '',
        type: Object.values(STAKEHOLDER_TYPE_OPTIONS)[0],
        ambito: Object.values(STAKEHOLDER_AMBITO_OPTIONS)[0],
        role: STAKEHOLDER_ROLE_OPTIONS[0],
        position: STAKEHOLDER_POSITION_OPTIONS[0]
    });

    const handleFieldChange = (e) => {
        const { name, value } = e.target;
        setNewStakeholder(prev => ({ ...prev, [name]: value }));
    };

    const handleAddStakeholder = (e) => {
        e.preventDefault();
        if (!newStakeholder.name.trim()) {
            alert(t('policy.form.stakeholder_error'));
            return;
        }

        const stakeholderToAdd = {
            ...newStakeholder,
            id: Date.now() // Use a temporary ID for keying before saving to DB
        };
        onStakeholderChange([...stakeholders, stakeholderToAdd]);

        // Reset form
        setNewStakeholder({
            name: '',
            type: Object.values(STAKEHOLDER_TYPE_OPTIONS)[0],
            ambito: Object.values(STAKEHOLDER_AMBITO_OPTIONS)[0],
            role: STAKEHOLDER_ROLE_OPTIONS[0],
            position: STAKEHOLDER_POSITION_OPTIONS[0]
        });
    };
    
    const handleRemoveStakeholder = (idToRemove) => {
        onStakeholderChange(stakeholders.filter(s => s.id !== idToRemove));
    };

    return (
        <div className="space-y-4 p-4 rounded-lg border border-sky-800/50 bg-sky-950/30">
            <h3 className="text-lg font-semibold text-white">{t('policy.form.stakeholder_title')}</h3>

            {/* Formulario de Adición */}
            <div className="space-y-4">
                <InputField 
                    label={t('policy.form.stakeholder_name')} 
                    name="name" 
                    value={newStakeholder.name} 
                    onChange={handleFieldChange} 
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SelectField 
                        label={t('policy.form.stakeholder_type')} 
                        name="type" 
                        options={Object.keys(STAKEHOLDER_TYPE_OPTIONS).map(key => ({ 
                            value: STAKEHOLDER_TYPE_OPTIONS[key], 
                            label: t(`stakeholder.category.${STAKEHOLDER_TYPE_OPTIONS[key]}`) 
                        }))}
                        value={newStakeholder.type} 
                        onChange={handleFieldChange} 
                    />
                    <SelectField 
                        label={t('policy.form.stakeholder_scope')} 
                        name="ambito" 
                        options={Object.values(STAKEHOLDER_AMBITO_OPTIONS)} 
                        value={newStakeholder.ambito} 
                        onChange={handleFieldChange} 
                    />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField 
                        label={t('policy.form.stakeholder_role')} 
                        name="role" 
                        options={STAKEHOLDER_ROLE_OPTIONS.map(key => ({ value: key, label: t(key) }))} 
                        value={newStakeholder.role} 
                        onChange={handleFieldChange} 
                    />
                    <SelectField 
                        label={t('policy.form.stakeholder_position')} 
                        name="position" 
                        options={STAKEHOLDER_POSITION_OPTIONS.map(key => ({ value: key, label: t(key) }))} 
                        value={newStakeholder.position} 
                        onChange={handleFieldChange} 
                    />
                </div>
                
                <button 
                    onClick={handleAddStakeholder}
                    className="flex items-center justify-center w-full py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-sky-600 hover:bg-sky-700 transition shadow-md"
                >
                    <Plus className="w-4 h-4 mr-2" /> {t('policy.form.stakeholder_add')}
                </button>
            </div>

            {/* Lista de Stakeholders Añadidos */}
            <div className="border-t border-sky-800/50 pt-4">
                <h4 className="text-md font-semibold text-gray-200 mb-2">{t('policy.form.stakeholders')} ({stakeholders.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                    {stakeholders.length === 0 ? (
                        <p className="text-gray-500 text-sm">{t('policy.form.stakeholder_empty')}</p>
                    ) : (
                        stakeholders.map(s => (
                            <div key={s.id} className="flex justify-between items-start bg-sky-950/50 p-2 rounded-md hover:bg-sky-900/60">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-white">{s.name}</p>
                                    <p className="text-xs text-gray-400">
                                        {t(`stakeholder.category.${s.type}`)} - {s.ambito} - {t(s.position)}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveStakeholder(s.id)}
                                    className="text-red-400 hover:text-red-300 p-1 ml-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default StakeholderInput;