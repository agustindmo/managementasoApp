import React, { useState, useEffect, useMemo } from 'react';
import { ref, push, set, serverTimestamp } from 'firebase/database';
import { Target, Save, X, Activity } from 'lucide-react';
import { useTranslation } from '../../context/TranslationContext.jsx';
import CardTitle from '../ui/CardTitle.jsx';
import InputField from '../ui/InputField.jsx';
import SelectField from '../ui/SelectField.jsx';
import { 
    COMMUNICATIONS_STRATEGY_DATA, 
    CHANNEL_METRICS_MAP, 
    INITIAL_IMPACT_LOG_STATE 
} from '../../utils/constants.js';
import { getDbPaths } from '../../services/firebase.js';

const CommunicationsImpactForm = ({ userId, db, onClose }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState(INITIAL_IMPACT_LOG_STATE);
    const [selectedStrategy, setSelectedStrategy] = useState(null);
    const [loading, setLoading] = useState(false);

    // 1. Extract Unique Options for Dropdowns
    const uniqueAreas = useMemo(() => [...new Set(COMMUNICATIONS_STRATEGY_DATA.map(d => d.area))], []);
    
    const availableMacros = useMemo(() => {
        return formData.area 
            ? [...new Set(COMMUNICATIONS_STRATEGY_DATA.filter(d => d.area === formData.area).map(d => d.producto_macro))]
            : [];
    }, [formData.area]);

    const availableSpecifics = useMemo(() => {
        return formData.producto_macro
            ? [...new Set(COMMUNICATIONS_STRATEGY_DATA.filter(d => d.area === formData.area && d.producto_macro === formData.producto_macro).map(d => d.producto_especifico))]
            : [];
    }, [formData.area, formData.producto_macro]);

    // 2. Handle Strategy Selection
    const handleStrategyChange = (e) => {
        const { name, value } = e.target;
        
        // Reset subsequent fields if parent changes
        let newFormData = { ...formData, [name]: value };
        if (name === 'area') {
            newFormData = { ...newFormData, producto_macro: '', producto_especifico: '', canal: '' };
        } else if (name === 'producto_macro') {
            newFormData = { ...newFormData, producto_especifico: '', canal: '' };
        }

        // Auto-detect Channel if strategy is complete
        if (name === 'producto_especifico') {
            const strategy = COMMUNICATIONS_STRATEGY_DATA.find(d => 
                d.area === newFormData.area && 
                d.producto_macro === newFormData.producto_macro && 
                d.producto_especifico === value
            );
            if (strategy) {
                newFormData.canal = strategy.canal;
                setSelectedStrategy(strategy);
            }
        }
        setFormData(newFormData);
    };

    const handleMetricChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            metrics: {
                ...prev.metrics,
                [key]: value
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Note: Ensure 'communicationsImpact' exists in your getDbPaths() or add it manually
            const path = getDbPaths().communicationsImpact || 'communications_impact';
            const newItemRef = push(ref(db, path));
            
            // Merge the strategic data with the user inputs
            const finalPayload = {
                ...formData,
                strategy_snapshot: selectedStrategy || {}, // Save the strategy context
                createdAt: serverTimestamp(),
                createdBy: userId
            };

            await set(newItemRef, finalPayload);
            onClose();
        } catch (error) {
            console.error("Error saving impact log:", error);
            alert("Error saving data");
        } finally {
            setLoading(false);
        }
    };

    const currentMetrics = formData.canal ? CHANNEL_METRICS_MAP[formData.canal] : [];

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-w-4xl mx-auto">
            <div className="flex justify-between items-center pr-4 border-b border-slate-100">
                <CardTitle title="New Impact Activity" icon={Target} />
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* General Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField 
                        label="Activity Title" 
                        name="title" 
                        value={formData.title} 
                        onChange={(e) => setFormData({...formData, title: e.target.value})} 
                        required 
                    />
                    <InputField 
                        label="Date" 
                        name="date" 
                        type="date" 
                        value={formData.date} 
                        onChange={(e) => setFormData({...formData, date: e.target.value})} 
                        required 
                    />
                </div>

                {/* Strategy Selector (Cascading) */}
                <div className="bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-700 uppercase flex items-center">
                        <Activity className="w-4 h-4 mr-2" /> Strategy Classification
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <SelectField
                            label="Area"
                            name="area"
                            value={formData.area}
                            options={uniqueAreas.map(a => ({ value: a, label: a }))}
                            onChange={handleStrategyChange}
                        />
                        <SelectField
                            label="Macro Product"
                            name="producto_macro"
                            value={formData.producto_macro}
                            options={availableMacros.map(m => ({ value: m, label: m }))}
                            onChange={handleStrategyChange}
                            disabled={!formData.area}
                        />
                        <SelectField
                            label="Specific Product"
                            name="producto_especifico"
                            value={formData.producto_especifico}
                            options={availableSpecifics.map(s => ({ value: s, label: s }))}
                            onChange={handleStrategyChange}
                            disabled={!formData.producto_macro}
                        />
                    </div>
                    {formData.canal && (
                         <div className="text-sm text-blue-700 bg-blue-50 p-2 rounded border border-blue-100">
                            <strong>Detected Channel:</strong> {formData.canal} 
                            {selectedStrategy && ` • Objective: ${selectedStrategy.objetivo}`}
                         </div>
                    )}
                </div>

                {/* Dynamic Metrics Inputs */}
                {currentMetrics && currentMetrics.length > 0 && (
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-700 border-b pb-2">
                            {formData.canal} Metrics
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {currentMetrics.map(metric => (
                                <div key={metric.key}>
                                    {metric.type === 'select' ? (
                                        <SelectField
                                            label={metric.label}
                                            value={formData.metrics[metric.key] || ''}
                                            options={metric.options.map(o => ({ value: o, label: o }))}
                                            onChange={(e) => handleMetricChange(metric.key, e.target.value)}
                                        />
                                    ) : (
                                        <InputField
                                            label={metric.label}
                                            type="number"
                                            value={formData.metrics[metric.key] || ''}
                                            onChange={(e) => handleMetricChange(metric.key, e.target.value)}
                                            placeholder="0"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || !formData.canal}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all disabled:opacity-50"
                >
                    {loading ? <span className="animate-pulse">Saving...</span> : (
                        <>
                            <Save className="w-4 h-4 mr-2" /> Save Impact Log
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default CommunicationsImpactForm;