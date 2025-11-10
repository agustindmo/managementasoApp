import React, { useState, useMemo } from 'react';
import { ref, set, push, serverTimestamp } from 'firebase/database';
import { Calendar, X, Plus, Users, Trash2, MessageSquare } from 'lucide-react'; 
import CardTitle from '../ui/CardTitle.jsx';
import InputField from '../ui/InputField.jsx';
import SelectField from '../ui/SelectField.jsx';
import { 
    INITIAL_AGENDA_STATE, 
    PILAR_OPTIONS, 
    TIPO_DE_ACTO_OPTIONS, 
    SECTOR_OPTIONS, 
    CONDICION_OPTIONS, 
    AGENDA_OPTIONS, 
    ANO_OPTIONS, 
    ALL_YEAR_FILTER,
    STAKEHOLDER_TYPE_OPTIONS, 
    STAKEHOLDER_AMBITO_OPTIONS,
    STAKEHOLDER_ROLE_OPTIONS,
    STAKEHOLDER_POSITION_OPTIONS,
} from '../../utils/constants.js'; 
import { getDbPaths } from '../../services/firebase.js'; 
import { useTranslation } from '../../context/TranslationContext.jsx'; 

// Estado inicial para un stakeholder
const INITIAL_STAKEHOLDER_STATE = {
    name: '',
    type: Object.values(STAKEHOLDER_TYPE_OPTIONS)[0], 
    ambito: Object.values(STAKEHOLDER_AMBITO_OPTIONS)[0], 
    role: STAKEHOLDER_ROLE_OPTIONS[0], 
    position: STAKEHOLDER_POSITION_OPTIONS[0], 
};

// Estado inicial para un nuevo mensaje de comunicación
const INITIAL_COMMS_MESSAGE_STATE = {
    message: '',
    date: new Date().toISOString().slice(0, 10),
    stakeholderKeys: [], 
};

const AgendaForm = ({ userId, db, mode = 'add', initialData = null, onClose }) => {
    const { t } = useTranslation();
    
    const initialFormData = initialData ? 
        { ...initialData, stakeholders: initialData.stakeholders || [], commsMessages: initialData.commsMessages || [] } : 
        INITIAL_AGENDA_STATE;
        
    const [formData, setFormData] = useState(initialFormData);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');
    
    const [newStakeholder, setNewStakeholder] = useState(INITIAL_STAKEHOLDER_STATE);
    const [newCommMessage, setNewCommMessage] = useState(INITIAL_COMMS_MESSAGE_STATE);

    // TAREA 6: Nuevo estado para la búsqueda de stakeholders
    const [stakeholderSearchTerm, setStakeholderSearchTerm] = useState('');

    const isReady = !!db && !!userId;
    const formTitle = mode === 'edit' 
        ? `${t('policy.form.edit_agenda')}: ${initialData?.nombre}` 
        : t('policy.form.add_agenda');

    // --- Handlers de Stakeholder ---
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleStakeholderChange = (e) => {
        const { name, value } = e.target;
        setNewStakeholder(prev => ({ ...prev, [name]: value }));
    };
    
    const addStakeholder = (e) => {
        e.preventDefault();
        if (!newStakeholder.name.trim()) {
            setMessage(t('policy.form.stakeholder_error'));
            setMessageType('error');
            return;
        }
        
        const validTypes = Object.values(STAKEHOLDER_TYPE_OPTIONS);
        const validAmbitos = Object.values(STAKEHOLDER_AMBITO_OPTIONS);
        const validRoles = STAKEHOLDER_ROLE_OPTIONS;
        const validPositions = STAKEHOLDER_POSITION_OPTIONS;

        const stakeholderToAdd = {
            id: Date.now(), 
            ...newStakeholder,
            type: validTypes.includes(newStakeholder.type) ? newStakeholder.type : validTypes[0],
            ambito: validAmbitos.includes(newStakeholder.ambito) ? newStakeholder.ambito : validAmbitos[0],
            role: validRoles.includes(newStakeholder.role) ? newStakeholder.role : validRoles[0],
            position: validPositions.includes(newStakeholder.position) ? newStakeholder.position : validPositions[0],
        };
        setFormData(prev => ({ ...prev, stakeholders: [...prev.stakeholders, stakeholderToAdd] }));
        setNewStakeholder(INITIAL_STAKEHOLDER_STATE);
        setMessage('');
    };
    
    const removeStakeholder = (id) => {
        setFormData(prev => ({ ...prev, stakeholders: prev.stakeholders.filter(s => s.id !== id) }));
    };

    // --- Handlers de Communication Message ---
    const handleCommMessageChange = (e) => {
        const { name, value } = e.target;
        setNewCommMessage(prev => ({ ...prev, [name]: value }));
    };

    // TAREA 6: Actualizado para añadir/quitar stakeholders
    const handleCommStakeholderToggle = (stakeholderName) => {
        setNewCommMessage(prev => {
            const currentKeys = prev.stakeholderKeys;
            const isSelected = currentKeys.includes(stakeholderName);
            const newKeys = isSelected 
                ? currentKeys.filter(name => name !== stakeholderName) 
                : [...currentKeys, stakeholderName]; 
            return { ...prev, stakeholderKeys: newKeys };
        });
        // Limpiar la búsqueda después de seleccionar
        setStakeholderSearchTerm('');
    };

    const addCommMessage = (e) => {
        e.preventDefault();
        
        if (!newCommMessage.message.trim()) {
            setMessage(t('comms.form.empty_message_error'));
            setMessageType('error');
            return;
        }
        if (newCommMessage.stakeholderKeys.length === 0) {
            setMessage(t('comms.form.no_stakeholder_error'));
            setMessageType('error');
            return;
        }

        const messageToAdd = { id: Date.now(), ...newCommMessage };
        setFormData(prev => ({ ...prev, commsMessages: [...(prev.commsMessages || []), messageToAdd] }));
        setNewCommMessage(INITIAL_COMMS_MESSAGE_STATE); 
        setStakeholderSearchTerm('');
        setMessage('');
    };

    const removeCommMessage = (id) => {
        setFormData(prev => ({ ...prev, commsMessages: prev.commsMessages.filter(msg => msg.id !== id) }));
    };
    
    // TAREA 6: Lógica de filtrado para la búsqueda de stakeholders
    const filteredStakeholders = useMemo(() => {
        if (!stakeholderSearchTerm) {
            return []; // No mostrar nada si no hay búsqueda
        }
        return formData.stakeholders.filter(
            s => s.name.toLowerCase().includes(stakeholderSearchTerm.toLowerCase()) &&
                 !newCommMessage.stakeholderKeys.includes(s.name) // Ocultar los ya seleccionados
        );
    }, [stakeholderSearchTerm, formData.stakeholders, newCommMessage.stakeholderKeys]);


    // --- Handle Submit ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isReady) return; 
        setIsLoading(true);
        setMessage('');
        setMessageType('success');

        try {
            const path = getDbPaths().agenda;
            
            const cleanData = {
                ...formData,
                stakeholders: (formData.stakeholders || []).map(({ id, ...rest }) => rest),
                commsMessages: (formData.commsMessages || []).map(({ id, ...rest }) => rest)
            };

            if (mode === 'edit' && initialData?.id) {
                const itemRef = ref(db, `${path}/${initialData.id}`);
                await set(itemRef, { ...cleanData, updatedAt: serverTimestamp() });
                setMessage(t('policy.form.success_update'));
            } else {
                const newItemRef = push(ref(db, path));
                await set(newItemRef, { ...cleanData, id: newItemRef.key, createdAt: serverTimestamp(), createdBy: userId });
                setMessage(t('policy.form.success_add'));
            }

            setTimeout(onClose, 1000); 
        } catch (error) {
            console.error(`Error ${mode} Agenda document in Realtime DB: `, error);
            setMessage(t('policy.form.fail'));
            setMessageType('error');
            setIsLoading(false);
        }
    };

    return (
        <div className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <CardTitle title={formTitle} icon={Calendar} />
                <button onClick={onClose} className="p-3 text-gray-400 hover:text-white transition" title="Close Form">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                
                {/* --- Campos Principales --- */}
                <InputField label={t('policy.form.nombre')} name="nombre" value={formData.nombre} onChange={handleFormChange} />
                <InputField label={t('policy.form.solicitud')} name="solicitud" value={formData.solicitud} onChange={handleFormChange} rows={2} />
                <div className="grid grid-cols-2 gap-4">
                    <SelectField label={t('policy.form.pilar')} name="pilar" options={PILAR_OPTIONS} value={formData.pilar} onChange={handleFormChange} />
                    <SelectField label={t('policy.form.tipo_acto')} name="tipoDeActo" options={TIPO_DE_ACTO_OPTIONS} value={formData.tipoDeActo} onChange={handleFormChange} />
                </div>
                <InputField label={t('policy.form.impacto')} name="impacto" value={formData.impacto} onChange={handleFormChange} rows={2} />
                <div className="grid grid-cols-2 gap-4">
                    <SelectField label={t('policy.form.sector')} name="sector" options={SECTOR_OPTIONS} value={formData.sector} onChange={handleFormChange} />
                    <InputField label={t('policy.form.institucion')} name="institucion" value={formData.institucion} onChange={handleFormChange} />
                </div>
                <InputField 
                    label={t('policy.form.situacion')} 
                    name="situacion" 
                    value={formData.situacion} 
                    onChange={handleFormChange} 
                    rows={4} 
                />
                <div className="grid grid-cols-2 gap-4"> 
                    <SelectField label={t('policy.form.condicion')} name="condicion" options={CONDICION_OPTIONS} value={formData.condicion} onChange={handleFormChange} />
                    <SelectField label={t('policy.form.agenda')} name="agenda" options={AGENDA_OPTIONS} value={formData.agenda} onChange={handleFormChange} />
                </div>
                <div className="grid grid-cols-2 gap-4"> 
                    <SelectField 
                        label={t('policy.form.ano')} 
                        name="ano" 
                        options={ANO_OPTIONS.filter(opt => opt !== ALL_YEAR_FILTER)} 
                        value={formData.ano} 
                        onChange={handleFormChange} 
                    />
                </div>
                <InputField label={t('policy.form.ayuda_memoria')} name="ayudaMemoria" type="url" value={formData.ayudaMemoria} onChange={handleFormChange} required={false} />

                {/* --- Stakeholder Entry Section --- */}
                <div className="border-t border-sky-800/50 pt-4 mt-4">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-sky-400" />
                        {t('policy.form.stakeholder_title')} ({formData.stakeholders.length})
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end bg-sky-950/30 border border-sky-800/50 p-4 rounded-lg">
                         <InputField 
                            label={t('policy.form.stakeholder_name')} 
                            name="name" 
                            value={newStakeholder.name} 
                            onChange={handleStakeholderChange} 
                            required={false} 
                        />
                        <SelectField 
                            label={t('policy.form.stakeholder_type')} 
                            name="type" 
                            options={Object.values(STAKEHOLDER_TYPE_OPTIONS).map(opt => ({ value: opt, label: t(`stakeholder.category.${opt.replace(/ /g, '_')}`) }))}
                            value={newStakeholder.type} 
                            onChange={handleStakeholderChange} 
                        />
                         <SelectField 
                            label={t('policy.form.stakeholder_scope')} 
                            name="ambito" 
                            options={Object.values(STAKEHOLDER_AMBITO_OPTIONS)} 
                            value={newStakeholder.ambito} 
                            onChange={handleStakeholderChange} 
                        />
                        <SelectField 
                            label={t('policy.form.stakeholder_role')} 
                            name="role" 
                            options={STAKEHOLDER_ROLE_OPTIONS.map(opt => ({ value: opt, label: t(opt) }))} 
                            value={newStakeholder.role} 
                            onChange={handleStakeholderChange} 
                        />
                        <SelectField 
                            label={t('policy.form.stakeholder_position')} 
                            name="position" 
                            options={STAKEHOLDER_POSITION_OPTIONS.map(opt => ({ value: opt, label: t(opt) }))} 
                            value={newStakeholder.position} 
                            onChange={handleStakeholderChange} 
                        />
                        <button
                            type="button"
                            onClick={addStakeholder}
                            className="w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-sky-600 hover:bg-sky-700 transition duration-300 shadow-md h-10"
                            title="Add Stakeholder"
                        >
                            <Plus className="w-4 h-4 mr-1" /> {t('policy.form.stakeholder_add')}
                        </button>
                    </div>

                    <div className="max-h-40 overflow-y-auto border border-sky-800/50 rounded-lg p-2 bg-black/30">
                        {formData.stakeholders.length === 0 ? (
                            <p className="text-center text-sm text-gray-500 p-2">{t('policy.form.stakeholder_empty')}</p>
                        ) : (
                            <ul className="space-y-1">
                                {formData.stakeholders.map((s, index) => (
                                    <li key={s.id} className="flex justify-between items-start bg-sky-950/50 p-2 rounded-md hover:bg-sky-900/60">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-white">{index + 1}. {s.name}</p>
                                            <p className="text-xs text-gray-400 capitalize">
                                                {t(s.role)} | {t(s.position)} | {s.ambito} | {t(`stakeholder.category.${s.type.replace(/ /g, '_')}`)}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeStakeholder(s.id)}
                                            className="text-red-400 hover:text-red-300 p-1 ml-2"
                                            title="Remove Stakeholder"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* --- TAREA 6: Sección de Mensajes de Comunicación (Actualizada) --- */}
                <div className="border-t border-sky-800/50 pt-4 mt-4">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2 text-sky-400" />
                        {t('comms.form.title')} ({(formData.commsMessages || []).length})
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 items-start bg-sky-950/30 border border-sky-800/50 p-4 rounded-lg">
                        {/* Columna Izquierda: Mensaje y Fecha */}
                        <div className="space-y-4">
                            <InputField 
                                label={t('comms.form.message_label')} 
                                name="message" 
                                value={newCommMessage.message} 
                                onChange={handleCommMessageChange} 
                                required={false} 
                                rows={4}
                            />
                            <InputField 
                                label={t('comms.form.date_label')} 
                                name="date" 
                                type="date"
                                value={newCommMessage.date} 
                                onChange={handleCommMessageChange} 
                                required={false} 
                            />
                        </div>
                        
                        {/* Columna Derecha: Selección de Stakeholders y Botón */}
                        <div className="space-y-3">
                            {/* TAREA 6: Input de Búsqueda */}
                            <InputField 
                                label={t('comms.form.select_stakeholders_search')}
                                name="stakeholderSearch" 
                                value={stakeholderSearchTerm} 
                                onChange={(e) => setStakeholderSearchTerm(e.target.value)} 
                                required={false} 
                                placeholder={t('comms.form.search_placeholder')}
                            />
                            
                            {/* TAREA 6: Lista de resultados de búsqueda */}
                            {filteredStakeholders.length > 0 && (
                                <div className="max-h-24 overflow-y-auto space-y-1 rounded-lg border border-sky-700 bg-black/40 p-2">
                                    {filteredStakeholders.map(s => (
                                        <div 
                                            key={s.id}
                                            className="p-2 text-sm text-gray-200 rounded-md hover:bg-sky-700 cursor-pointer"
                                            onClick={() => handleCommStakeholderToggle(s.name)}
                                        >
                                            {s.name}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* TAREA 6: Stakeholders seleccionados */}
                            {newCommMessage.stakeholderKeys.length > 0 && (
                                <div className="space-y-1 pt-2">
                                    <label className="block text-xs font-medium text-gray-400">{t('comms.form.selected')}:</label>
                                    <div className="flex flex-wrap gap-2">
                                        {newCommMessage.stakeholderKeys.map(name => (
                                            <span key={name} className="flex items-center bg-sky-700 text-white text-sm font-medium px-2 py-0.5 rounded-full">
                                                {name}
                                                <button
                                                    type="button"
                                                    onClick={() => handleCommStakeholderToggle(name)}
                                                    className="ml-1.5 text-sky-200 hover:text-white"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {formData.stakeholders.length === 0 && (
                                <p className="text-sm text-gray-500">{t('comms.form.no_stakeholders')}</p>
                            )}
                            
                            <button
                                type="button"
                                onClick={addCommMessage}
                                className="w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-sky-600 hover:bg-sky-700 transition duration-300 shadow-md"
                            >
                                <Plus className="w-4 h-4 mr-1" /> {t('comms.form.add_message')}
                            </button>
                        </div>
                    </div>

                    {/* Lista de Mensajes Añadidos */}
                    <div className="max-h-40 overflow-y-auto border border-sky-800/50 rounded-lg p-2 bg-black/30 space-y-1">
                        {(formData.commsMessages || []).length === 0 ? (
                            <p className="text-center text-sm text-gray-500 p-2">{t('comms.form.no_messages')}</p>
                        ) : (
                            (formData.commsMessages || []).map((msg) => (
                                <li key={msg.id} className="flex justify-between items-start bg-sky-950/50 p-2 rounded-md hover:bg-sky-900/60">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-200 w-full truncate" title={msg.message}>{msg.message}</p>
                                        <p className="text-xs text-sky-400">{msg.date} - [{msg.stakeholderKeys.join(', ')}]</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeCommMessage(msg.id)}
                                        className="text-red-400 hover:text-red-300 p-1 ml-2"
                                        title="Remove Message"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </li>
                            ))
                        )}
                    </div>
                </div>

                {/* --- Botón de Submit --- */}
                <button
                    type="submit"
                    disabled={isLoading || !isReady}
                    className={`w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition duration-300 ease-in-out ${
                        isLoading || !isReady ? 'bg-sky-400 cursor-not-allowed opacity-70' : 'bg-sky-600 hover:bg-sky-700'
                    }`}
                >
                    {isLoading ? t('activity.form.saving') : !isReady ? t('activity.form.connecting') : (mode === 'edit' ? t('policy.form.update_item') : t('policy.form.add_item'))}
                </button>
                {message && (
                    <p className={`text-center text-sm mt-2 ${messageType === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {message}
                    </p>
                )}
            </form>
        </div>
    );
};

export default AgendaForm;