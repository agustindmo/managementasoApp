import React, { useState, useMemo } from 'react';
import { MessageSquare, Calendar, X, Trash2, Search } from 'lucide-react';
import InputField from '../components/ui/InputField.jsx';
import CardTitle from '../components/ui/CardTitle.jsx';

const CommsMessageInput = ({ t, messages, onMessageChange, stakeholders }) => {
    const [newMessage, setNewMessage] = useState({
        message: '',
        date: new Date().toISOString().slice(0, 10),
        stakeholders: [] 
    });
    const [searchTerm, setSearchTerm] = useState('');
    
    const availableStakeholderNames = useMemo(() => {
        return (stakeholders || []).map(s => s.name).filter((v, i, a) => a.indexOf(v) === i);
    }, [stakeholders]);

    const filteredStakeholders = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        let results = availableStakeholderNames.filter(name => name.toLowerCase().includes(lowerSearch));
        return results.filter(name => !newMessage.stakeholders.includes(name));
    }, [searchTerm, availableStakeholderNames, newMessage.stakeholders]);
    
    const handleAddStakeholderToMessage = (name) => {
        setNewMessage(prev => ({
            ...prev,
            stakeholders: [...prev.stakeholders, name]
        }));
        setSearchTerm('');
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
            id: Date.now() 
        };
        onMessageChange([...messages, messageToAdd]);

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
        <div className="space-y-4 p-4 rounded-lg border border-slate-200 bg-slate-50">
            <h3 className="text-lg font-semibold text-slate-800">{t('comms.form.title')}</h3>
            
            <div className="space-y-4 p-4 border border-slate-200 rounded-lg bg-white shadow-sm">
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
                
                {availableStakeholderNames.length > 0 && (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">{t('comms.form.select_stakeholders_search')}</label>
                        <InputField 
                            label=""
                            name="stakeholderSearch"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('comms.form.search_placeholder')}
                            icon={Search}
                        />
                        {filteredStakeholders.length > 0 && (
                            <div className="max-h-24 overflow-y-auto space-y-1 rounded-lg border border-slate-200 bg-gray-50 p-2">
                                {filteredStakeholders.map(name => (
                                    <div 
                                        key={name}
                                        className="p-1.5 text-sm text-gray-700 rounded-md hover:bg-blue-100 cursor-pointer transition-colors"
                                        onClick={() => handleAddStakeholderToMessage(name)}
                                    >
                                        {name}
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                            {newMessage.stakeholders.map(name => (
                                <span key={name} className="flex items-center bg-blue-100 text-blue-800 text-sm font-medium px-2 py-0.5 rounded-full">
                                    {name}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveStakeholderFromMessage(name)}
                                        className="ml-1.5 text-blue-600 hover:text-blue-800"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                {availableStakeholderNames.length === 0 && (
                     <p className="text-yellow-600 text-sm italic">{t('comms.form.no_stakeholders')}</p>
                )}
                
                <button 
                    onClick={handleAddMessage}
                    className="flex items-center justify-center w-full py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
                >
                    <MessageSquare className="w-4 h-4 mr-2" /> {t('comms.form.add_message')}
                </button>
            </div>


            <div className="border-t border-slate-200 pt-4">
                <h4 className="text-md font-medium text-slate-600 mb-2">{t('comms.form.selected')} ({messages.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                    {messages.length === 0 ? (
                        <p className="text-slate-400 text-sm">{t('comms.form.no_messages')}</p>
                    ) : (
                        messages.map(m => (
                            <div key={m.id} className="flex justify-between items-start bg-white p-3 rounded-lg border border-slate-100 hover:shadow-sm transition-shadow">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-800">{m.message.substring(0, 50)}...</p>
                                    <p className="text-xs text-slate-500">{m.date}</p>
                                    <p className="text-xs text-blue-500 mt-1">
                                        {m.stakeholders.join(', ')}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveMessage(m.id)}
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

export default CommsMessageInput;