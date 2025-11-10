import React, { useState, useEffect } from 'react';
import { ref, onValue, update, serverTimestamp } from 'firebase/database';
import { User, Save, Loader2, CheckCircle, XCircle, Plus, Trash2, MapPin } from 'lucide-react'; // Iconos añadidos
import { getDbPaths } from '../../services/firebase.js';
import { useTranslation } from '../../context/TranslationContext.jsx';
import CardTitle from '../ui/CardTitle.jsx';
import InputField from '../ui/InputField.jsx';
import SelectField from '../ui/SelectField.jsx';
import { 
    INITIAL_USER_PROFILE_STATE,
    ECUADOR_PROVINCES,
    ECUADOR_DATA, // TAREA 1: Importar datos de ciudades
    INDUSTRY_ACTIVITIES,
    CERTIFICATIONS_LIST,
    COMPANY_AREAS
} from '../../utils/constants.js';

// Componente helper para Checkbox (sin cambios)
const CheckboxField = ({ label, name, checked, onChange }) => (
    <label className="flex items-center space-x-2 text-gray-200 hover:text-white cursor-pointer">
        <input 
            type="checkbox"
            name={name}
            className="rounded text-sky-500 focus:ring-sky-600 bg-sky-950/50 border-sky-700"
            checked={checked}
            onChange={onChange}
        />
        <span>{label}</span>
    </label>
);

// Estado inicial para un nuevo contacto
const INITIAL_CONTACT_STATE = {
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    contact_area: COMPANY_AREAS[0],
};

// TAREA 1: Estado inicial para una nueva finca
const INITIAL_FARM_STATE = {
    province: ECUADOR_PROVINCES[0],
    city: ECUADOR_DATA[ECUADOR_PROVINCES[0]][0], // Ciudad por defecto
    hectares: '',
    workers: '',
};

const UserProfile = ({ userId, db }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState(INITIAL_USER_PROFILE_STATE);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success'); 
    
    const [newContact, setNewContact] = useState(INITIAL_CONTACT_STATE);
    const [newFarm, setNewFarm] = useState(INITIAL_FARM_STATE); // TAREA 1: Estado para nueva finca
    
    // TAREA 1: Estado para las opciones de ciudades
    const [cityOptions, setCityOptions] = useState(ECUADOR_DATA[newFarm.province] || []);

    const dbPaths = getDbPaths();
    
    // 1. Cargar datos del perfil existente
    useEffect(() => {
        if (!db || !userId) return;

        const profileRef = ref(db, `${dbPaths.userProfiles}/${userId}`);
        
        const unsubscribe = onValue(profileRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setFormData({
                    ...INITIAL_USER_PROFILE_STATE, 
                    ...data, 
                    // TAREA 1: Asegurar que los arrays (incluyendo los nuevos) existan
                    export_certifications: data.export_certifications || [],
                    farm_certifications: data.farm_certifications || [], // Nombre actualizado
                    contacts: data.contacts || [], 
                    farms: data.farms || [], // Nuevo array
                });
            } else {
                setFormData(INITIAL_USER_PROFILE_STATE);
            }
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching user profile:", error);
            setMessage(t('profile.load_error'));
            setMessageType('error'); 
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [db, userId, dbPaths.userProfiles, t]);

    // 2. Handlers para el formulario
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // --- TAREA 1: Lógica de Certificación con Hectáreas ---
    
    // Maneja el check/uncheck
    const handleCertificationToggle = (listName, certName) => {
        setFormData(prev => {
            const currentList = prev[listName] || [];
            const isChecked = currentList.some(c => c.name === certName);
            
            const newList = isChecked
                ? currentList.filter(c => c.name !== certName) // Quitar
                : [...currentList, { name: certName, hectares: '' }]; // Añadir objeto
                
            return { ...prev, [listName]: newList };
        });
    };

    // Maneja el cambio en el input de hectáreas
    const handleCertHectaresChange = (listName, certName, hectares) => {
        setFormData(prev => {
            const currentList = prev[listName] || [];
            const newList = currentList.map(cert => 
                cert.name === certName ? { ...cert, hectares: hectares } : cert
            );
            return { ...prev, [listName]: newList };
        });
    };

    // Helper para comprobar si una certificación está marcada
    const isCertChecked = (listName, certName) => {
        return (formData[listName] || []).some(c => c.name === certName);
    };

    // Helper para obtener las hectáreas de una certificación
    const getCertHectares = (listName, certName) => {
        const cert = (formData[listName] || []).find(c => c.name === certName);
        return cert ? cert.hectares : '';
    };

    // --- Handlers Multi-Contacto ---
    const handleContactChange = (e) => {
        const { name, value } = e.target;
        setNewContact(prev => ({ ...prev, [name]: value }));
    };

    const addContact = (e) => {
        e.preventDefault();
        if (!newContact.contact_name.trim()) {
            setMessage(t('profile.contact_empty_name'));
            setMessageType('error');
            return;
        }
        const contactToAdd = { id: Date.now(), ...newContact };
        setFormData(prev => ({ ...prev, contacts: [...prev.contacts, contactToAdd] }));
        setNewContact(INITIAL_CONTACT_STATE); 
        setMessage('');
    };

    const removeContact = (id) => {
        setFormData(prev => ({ ...prev, contacts: formData.contacts.filter(contact => contact.id !== id) }));
    };

    // --- TAREA 1: Handlers para Multi-Finca ---
    const handleFarmChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'province') {
            // Si la provincia cambia, actualizar las ciudades y resetear la ciudad seleccionada
            const newCities = ECUADOR_DATA[value] || [];
            setCityOptions(newCities);
            setNewFarm(prev => ({
                ...prev,
                province: value,
                city: newCities[0] || '' // Seleccionar la primera ciudad de la nueva lista
            }));
        } else {
            setNewFarm(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const addFarm = (e) => {
        e.preventDefault();
        if (!newFarm.province || !newFarm.city) {
            setMessage(t('profile.farm_empty_name')); // Necesitarás esta clave de traducción
            setMessageType('error');
            return;
        }
        const farmToAdd = { id: Date.now(), ...newFarm };
        setFormData(prev => ({ ...prev, farms: [...prev.farms, farmToAdd] }));
        setNewFarm(INITIAL_FARM_STATE); // Resetear formulario de finca
        setCityOptions(ECUADOR_DATA[INITIAL_FARM_STATE.province] || []); // Resetear ciudades
        setMessage('');
    };

    const removeFarm = (id) => {
        setFormData(prev => ({ ...prev, farms: formData.farms.filter(farm => farm.id !== id) }));
    };

    // 3. Handler para guardar
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!db || !userId) return;

        setIsSaving(true);
        setMessage('');
        setMessageType('success'); 

        try {
            const profileRef = ref(db, `${dbPaths.userProfiles}/${userId}`);
            
            // Limpiar IDs temporales de contactos y fincas
            const cleanData = {
                ...formData,
                contacts: formData.contacts.map(({ id, ...rest }) => rest),
                farms: formData.farms.map(({ id, ...rest }) => rest), // TAREA 1
            };

            await update(profileRef, {
                ...cleanData,
                lastUpdated: serverTimestamp()
            });
            
            setMessage(t('profile.update_success')); 
            setMessageType('success'); 
            
            setTimeout(() => setMessage(''), 3000); 
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage(t('profile.update_error'));
            setMessageType('error'); 
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                <p className="ml-3 text-sky-200">{t('profile.loading')}</p>
            </div>
        );
    }

    const isExporterOrGrower = formData.activity.includes('Exportador') || formData.activity.includes('Productor');

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
                <User className="w-8 h-8 mr-3 text-sky-400" />
                {t('profile.title')}
            </h1>

            <form onSubmit={handleSubmit} className="rounded-2xl border border-sky-700/50 bg-black/40 shadow-2xl backdrop-blur-lg overflow-hidden max-w-4xl mx-auto">
                <CardTitle title={t('profile.form_title')} icon={User} />
                
                <div className="p-6 space-y-6">
                    {/* Sección 1: Compañía */}
                    <div className="p-4 rounded-lg border border-sky-800/50 bg-sky-950/30 space-y-4">
                        <h3 className="text-lg font-semibold text-white">{t('profile.company_title')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label={t('profile.company')} name="company" value={formData.company} onChange={handleChange} required={false} />
                            <InputField label={t('profile.company_ruc')} name="company_ruc" value={formData.company_ruc} onChange={handleChange} required={false} />
                            <InputField label={t('profile.representative')} name="representative" value={formData.representative} onChange={handleChange} required={false} />
                            <InputField label={t('profile.representative_id')} name="representative_id" value={formData.representative_id} onChange={handleChange} required={false} />
                        </div>
                    </div>

                    {/* Sección 2: Actividad y Certificaciones */}
                    <div className="p-4 rounded-lg border border-sky-800/50 bg-sky-950/30 space-y-4">
                        <h3 className="text-lg font-semibold text-white">{t('profile.activity_title')}</h3>
                        <SelectField label={t('profile.activity')} name="activity" options={INDUSTRY_ACTIVITIES} value={formData.activity} onChange={handleChange} />

                        {isExporterOrGrower && (
                            <div className="space-y-4 pl-4 border-l-2 border-sky-700">
                                {/* Checkbox para Exportador */}
                                <CheckboxField label={t('profile.exports_certified')} name="exports_certified_products" checked={formData.exports_certified_products} onChange={handleChange} />
                                {formData.exports_certified_products && (
                                    <div className="p-3 rounded-lg bg-sky-950/50 border border-sky-800 space-y-2">
                                        <h4 className="font-medium text-sky-200">{t('profile.export_certifications')}</h4>
                                        {CERTIFICATIONS_LIST.map(cert => (
                                            <div key={cert} className="flex items-center space-x-4">
                                                <CheckboxField 
                                                    label={cert} 
                                                    name={`export_${cert}`}
                                                    checked={isCertChecked('export_certifications', cert)} 
                                                    onChange={() => handleCertificationToggle('export_certifications', cert)} 
                                                />
                                                {isCertChecked('export_certifications', cert) && (
                                                    <InputField 
                                                        label="" // Sin etiqueta
                                                        name={`export_hectares_${cert}`}
                                                        type="number"
                                                        value={getCertHectares('export_certifications', cert)}
                                                        onChange={(e) => handleCertHectaresChange('export_certifications', cert, e.target.value)}
                                                        placeholder={t('profile.cert_hectares_placeholder')}
                                                        required={false}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {/* Checkbox para Productor */}
                                <CheckboxField label={t('profile.is_grower')} name="is_grower" checked={formData.is_grower} onChange={handleChange} />
                                {formData.is_grower && (
                                    <div className="p-3 rounded-lg bg-sky-950/50 border border-sky-800 space-y-4">
                                        <h4 className="font-medium text-sky-200">{t('profile.farm_title')}</h4>
                                        
                                        {/* TAREA 1: Formulario para añadir fincas */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end bg-sky-950/30 border border-sky-800/50 p-4 rounded-lg">
                                            <SelectField label={t('profile.farm_province')} name="province" options={ECUADOR_PROVINCES} value={newFarm.province} onChange={handleFarmChange} />
                                            <SelectField label={t('profile.farm_city')} name="city" options={cityOptions} value={newFarm.city} onChange={handleFarmChange} />
                                            <InputField label={t('profile.farm_hectares')} name="hectares" type="number" value={newFarm.hectares} onChange={handleFarmChange} required={false} />
                                            <InputField label={t('profile.farm_workers')} name="workers" type="number" value={newFarm.workers} onChange={handleFarmChange} required={false} />
                                            <div className="md:col-span-1"></div>
                                            <button
                                                type="button"
                                                onClick={addFarm}
                                                className="w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-sky-600 hover:bg-sky-700 transition duration-300 shadow-md h-10"
                                            >
                                                <Plus className="w-4 h-4 mr-1" /> {t('profile.add_farm')}
                                            </button>
                                        </div>

                                        {/* TAREA 1: Lista de fincas añadidas */}
                                        <div className="max-h-40 overflow-y-auto border border-sky-800/50 rounded-lg p-2 bg-black/30 space-y-1">
                                            {(formData.farms || []).length === 0 ? (
                                                <p className="text-center text-sm text-gray-500 p-2">{t('profile.no_farms')}</p>
                                            ) : (
                                                (formData.farms || []).map((farm) => (
                                                    <li key={farm.id} className="flex justify-between items-start bg-sky-950/50 p-2 rounded-md hover:bg-sky-900/60">
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-white">{farm.province} - {farm.city}</p>
                                                            <p className="text-xs text-gray-400">
                                                                {farm.hectares && `${farm.hectares} ha `}
                                                                {farm.workers && `| ${farm.workers} ${t('profile.farm_workers').toLowerCase()}`}
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFarm(farm.id)}
                                                            className="text-red-400 hover:text-red-300 p-1 ml-2"
                                                            title="Remove Farm"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </li>
                                                ))
                                            )}
                                        </div>

                                        {/* Certificaciones de Finca */}
                                        <CheckboxField label={t('profile.grows_certified')} name="grows_certified_bananas" checked={formData.grows_certified_bananas} onChange={handleChange} />
                                        {formData.grows_certified_bananas && (
                                            <div className="pt-2 space-y-2">
                                                <h4 className="font-medium text-sky-200">{t('profile.farm_certifications')}</h4>
                                                {CERTIFICATIONS_LIST.map(cert => (
                                                    <div key={cert} className="flex items-center space-x-4">
                                                        <CheckboxField 
                                                            label={cert} 
                                                            name={`farm_${cert}`}
                                                            checked={isCertChecked('farm_certifications', cert)} 
                                                            onChange={() => handleCertificationToggle('farm_certifications', cert)} 
                                                        />
                                                        {isCertChecked('farm_certifications', cert) && (
                                                            <InputField 
                                                                label=""
                                                                name={`farm_hectares_${cert}`}
                                                                type="number"
                                                                value={getCertHectares('farm_certifications', cert)}
                                                                onChange={(e) => handleCertHectaresChange('farm_certifications', cert, e.target.value)}
                                                                placeholder={t('profile.cert_hectares_placeholder')}
                                                                required={false}
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* TAREA 2: Sección 3: Contacto (Reconstruida) */}
                    <div className="p-4 rounded-lg border border-sky-800/50 bg-sky-950/30 space-y-4">
                        <h3 className="text-lg font-semibold text-white">{t('profile.contact_title')} ({(formData.contacts || []).length})</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end bg-sky-950/30 border border-sky-800/50 p-4 rounded-lg">
                            <InputField label={t('profile.contact_name')} name="contact_name" value={newContact.contact_name} onChange={handleContactChange} required={false} />
                            <InputField label={t('profile.contact_email')} name="contact_email" type="email" value={newContact.contact_email} onChange={handleContactChange} required={false} />
                            <InputField label={t('profile.contact_phone')} name="contact_phone" type="tel" value={newContact.contact_phone} onChange={handleContactChange} required={false} />
                            <SelectField label={t('profile.contact_area')} name="contact_area" options={COMPANY_AREAS} value={newContact.contact_area} onChange={handleContactChange} />
                            <div className="md:col-span-1"></div>
                            <button
                                type="button"
                                onClick={addContact}
                                className="w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-sky-600 hover:bg-sky-700 transition duration-300 shadow-md h-10"
                            >
                                <Plus className="w-4 h-4 mr-1" /> {t('profile.add_contact')}
                            </button>
                        </div>

                        <div className="max-h-40 overflow-y-auto border border-sky-800/50 rounded-lg p-2 bg-black/30 space-y-1">
                            {(formData.contacts || []).length === 0 ? (
                                <p className="text-center text-sm text-gray-500 p-2">{t('profile.no_contacts')}</p>
                            ) : (
                                (formData.contacts || []).map((contact) => (
                                    <li key={contact.id} className="flex justify-between items-start bg-sky-950/50 p-2 rounded-md hover:bg-sky-900/60">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-white">{contact.contact_name} <span className="text-xs text-sky-300">({contact.contact_area})</span></p>
                                            <p className="text-xs text-gray-400">{contact.contact_email} | {contact.contact_phone}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeContact(contact.id)}
                                            className="text-red-400 hover:text-red-300 p-1 ml-2"
                                            title="Remove Contact"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </li>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Botón de Guardar */}
                    <div className="flex items-center justify-end space-x-4 pt-4 border-t border-sky-800/50">
                        {message && (
                            <span className={`text-sm flex items-center ${messageType === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                {messageType === 'success' ? <CheckCircle className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />} 
                                {message}
                            </span>
                        )}
                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`flex justify-center items-center py-2 px-5 border border-transparent text-sm font-medium rounded-lg text-white transition duration-300 ease-in-out ${
                                isSaving ? 'bg-sky-400 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700'
                            }`}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            {isSaving ? t('profile.saving') : t('profile.update_button')}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default UserProfile;