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
            id: Date.now() 
        };
        onStakeholderChange([...stakeholders, stakeholderToAdd]);

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
        <div className="space-y-4 p-4 rounded-lg border border-slate-200 bg-slate-50">
            <h3 className="text-lg font-semibold text-slate-800">{t('policy.form.stakeholder_title')}</h3>

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
                    className="flex items-center justify-center w-full py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
                >
                    <Plus className="w-4 h-4 mr-2" /> {t('policy.form.stakeholder_add')}
                </button>
            </div>

            <div className="border-t border-slate-200 pt-4">
                <h4 className="text-md font-medium text-slate-600 mb-2">{t('policy.form.stakeholders')} ({stakeholders.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                    {stakeholders.length === 0 ? (
                        <p className="text-slate-400 text-sm">{t('policy.form.stakeholder_empty')}</p>
                    ) : (
                        stakeholders.map(s => (
                            <div key={s.id} className="flex justify-between items-start bg-white p-2 rounded-md border border-slate-100 hover:bg-slate-50 shadow-sm">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-800">{s.name}</p>
                                    <p className="text-xs text-slate-500">
                                        {t(`stakeholder.category.${s.type}`)} - {s.ambito} - {t(s.position)}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveStakeholder(s.id)}
                                    className="text-red-500 hover:text-red-700 p-1 ml-2"
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