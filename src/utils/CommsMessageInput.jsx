// src/components/utils/CommsMessageInput.jsx

import React, { useState, useMemo } from 'react';
import { MessageSquare, Calendar, X, Trash2, Search } from 'lucide-react';
// This path is correct: It goes up one folder (to src/components/) and then down into ui/
import InputField from '../components/ui/InputField.jsx';
import CardTitle from '../components/ui/CardTitle.jsx';
const CommsMessageInput = ({ t, messages, onMessageChange, stakeholders }) => {
    const [newMessage, setNewMessage] = useState({
        message: '',
        date: new Date().toISOString().slice(0, 10),
        stakeholders: [] // Array of stakeholder names (strings)
    });
    const [searchTerm, setSearchTerm] = useState('');
    
    // Lista de nombres de stakeholders únicos disponibles para este item de agenda
    const availableStakeholderNames = useMemo(() => {
        return (stakeholders || []).map(s => s.name).filter((v, i, a) => a.indexOf(v) === i);
    }, [stakeholders]);

    const filteredStakeholders = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        // 1. Filtrar los disponibles por término de búsqueda
        let results = availableStakeholderNames.filter(name => name.toLowerCase().includes(lowerSearch));
        // 2. Excluir los ya seleccionados en el nuevo mensaje
        return results.filter(name => !newMessage.stakeholders.includes(name));
    }, [searchTerm, availableStakeholderNames, newMessage.stakeholders]);
    
    const handleAddStakeholderToMessage = (name) => {
        setNewMessage(prev => ({
            ...prev,
            stakeholders: [...prev.stakeholders, name]
        }));
        setSearchTerm(''); // Limpiar después de añadir
    };
    
    const handleRemoveStakeholderFromMessage = (nameToRemove) => {
        setNewMessage(prev => ({
            ...prev,
            stakeholders: prev.stakeholders.filter(name => name !== nameToRemove)
        }));
    };
    
    const handleAddMessage = (e) => {
        e.preventDefault();
        if (!newMessage.message.trim()) {
            alert(t('comms.form.empty_message_error'));
            return;
        }
        if (newMessage.stakeholders.length === 0) {
            alert(t('comms.form.no_stakeholder_error'));
            return;
        }

        const messageToAdd = {
            ...newMessage,
            id: Date.now() // ID temporal
        };
        onMessageChange([...messages, messageToAdd]);

        // Reset form
        setNewMessage({
            message: '',
            date: new Date().toISOString().slice(0, 10),
            stakeholders: []
        });
        setSearchTerm('');
    };

    const handleRemoveMessage = (idToRemove) => {
        onMessageChange(messages.filter(m => m.id !== idToRemove));
    };


    return (
        <div className="space-y-4 p-4 rounded-lg border border-sky-800/50 bg-sky-950/30">
            <h3 className="text-lg font-semibold text-white">{t('comms.form.title')}</h3>
            
            {/* Formulario de Nuevo Mensaje */}
            <div className="space-y-4 p-4 border border-sky-700/50 rounded-lg bg-sky-950/40">
                <InputField 
                    label={t('comms.form.message_label')} 
                    name="message" 
                    value={newMessage.message} 
                    onChange={(e) => setNewMessage(prev => ({...prev, message: e.target.value}))}
                    rows={4}
                />
                
                <div className="grid grid-cols-2 gap-4">
                    <InputField 
                        label={t('comms.form.date_label')} 
                        name="date" 
                        type="date"
                        value={newMessage.date} 
                        onChange={(e) => setNewMessage(prev => ({...prev, date: e.target.value}))}
                    />
                </div>
                
                {/* Selector de Stakeholders */}
                {availableStakeholderNames.length > 0 && (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-200">{t('comms.form.select_stakeholders_search')}</label>
                        <InputField 
                            label=""
                            name="stakeholderSearch"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('comms.form.search_placeholder')}
                            icon={Search}
                        />
                        {/* Resultados de Búsqueda */}
                        {filteredStakeholders.length > 0 && (
                            <div className="max-h-24 overflow-y-auto space-y-1 rounded-lg border border-sky-700 bg-black/40 p-2">
                                {filteredStakeholders.map(name => (
                                    <div 
                                        key={name}
                                        className="p-1.5 text-sm text-gray-200 rounded-md hover:bg-sky-700 cursor-pointer"
                                        onClick={() => handleAddStakeholderToMessage(name)}
                                    >
                                        {name}
                                    </div>
                                ))}
                            </div>
                        )}
                        {/* Stakeholders Seleccionados */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-sky-800/50">
                            {newMessage.stakeholders.map(name => (
                                <span key={name} className="flex items-center bg-sky-700 text-white text-sm font-medium px-2 py-0.5 rounded-full">
                                    {name}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveStakeholderFromMessage(name)}
                                        className="ml-1.5 text-sky-200 hover:text-white"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                {availableStakeholderNames.length === 0 && (
                     <p className="text-yellow-400 text-sm">{t('comms.form.no_stakeholders')}</p>
                )}
                
                <button 
                    onClick={handleAddMessage}
                    className="flex items-center justify-center w-full py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-sky-600 hover:bg-sky-700 transition shadow-md"
                >
                    <MessageSquare className="w-4 h-4 mr-2" /> {t('comms.form.add_message')}
                </button>
            </div>


            {/* Lista de Mensajes Existentes */}
            <div className="border-t border-sky-800/50 pt-4">
                <h4 className="text-md font-semibold text-gray-200 mb-2">{t('comms.form.selected')} ({messages.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                    {messages.length === 0 ? (
                        <p className="text-gray-500 text-sm">{t('comms.form.no_messages')}</p>
                    ) : (
                        messages.map(m => (
                            <div key={m.id} className="flex justify-between items-start bg-sky-950/50 p-2 rounded-md hover:bg-sky-900/60">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-white">{m.message.substring(0, 50)}...</p>
                                    <p className="text-xs text-gray-400">{m.date}</p>
                                    <p className="text-xs text-sky-300 mt-1">
                                        {m.stakeholders.join(', ')}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveMessage(m.id)}
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

export default CommsMessageInput;