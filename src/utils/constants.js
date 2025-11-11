// src/utils/constants.js
import { ECUADOR_DATA } from './ecuador_data.js'; 

export const PILAR_OPTIONS = [
    "apertura comercial", "bioseguridad", "competitividad",
    "defense COMERCIAL", "formalidad", "operatividad",
    "seguridad", "sostenibilidad", "tecnificacion"
];
export const TIPO_DE_ACTO_OPTIONS = [
    "actos privados", "decretos y reglamentos", "estandares y certificaciones",
    "ley", "normas communitarians", "operativo-administrativo",
    "ordenanzas", "otros", "resoluciones y acuerdo", "tratados internationales"
];
export const SECTOR_OPTIONS = ["exportador", "productor", "productor-exportador", "cadena de valor"];
export const CONDICION_OPTIONS = ["en seguimiento", "finalizado"];
export const AGENDA_OPTIONS = ["Nacional", "internacional"];
export const AMBITO_OPTIONS = ["local", "internacional"];
export const TIPO_DE_ACTO_MILESTONES_OPTIONS = [
    "acuerdo y resoluciones", "proyecto", "ley", "Norma internacional",
    "Gestión", "comunicados", "conventions", "decretos",
    "acciones administrativas", "acuerdos internaconales", "estandares y certificaciones"
];
const currentYear = new Date().getFullYear();
export const ALL_YEAR_FILTER = 'All';
export const ALL_FILTER_OPTION = 'All'; 

export const ANO_OPTIONS = [ALL_YEAR_FILTER, ...Array.from({ length: 11 }, (_, i) => (currentYear - 5 + i).toString())];

export const INITIAL_AGENDA_STATE = {
    nombre: '', solicitud: '', pilar: PILAR_OPTIONS[0], tipoDeActo: TIPO_DE_ACTO_OPTIONS[0],
    impacto: '', sector: SECTOR_OPTIONS[0], institucion: '', 
    condicion: CONDICION_OPTIONS[0], agenda: AGENDA_OPTIONS[0], ayudaMemoria: '', 
    ano: currentYear.toString(), 
    stakeholders: [], 
    situacion: '', 
    commsMessages: [], 
};

export const INITIAL_MILESTONE_STATE = {
    nombre: '', OKRs: '', institucion: '', ambito: AMBITO_OPTIONS[0],
    tipoDeActo: TIPO_DE_ACTO_MILESTONES_OPTIONS[0], ano: currentYear.toString(),
    ahorro: 0, archivo: '', 
};

// Activity Log Constants
export const ACTIVITY_TYPE_OPTIONS = ["letter", "meeting"];
export const MEETING_MODE_OPTIONS = ["in person", "virtual", "hybrid"];

// --- MODIFICADO ---
export const INITIAL_ACTIVITY_STATE = {
    activityType: ACTIVITY_TYPE_OPTIONS[0], 
    meetingMode: MEETING_MODE_OPTIONS[0], 
    date: new Date().toISOString().slice(0, 10), 
    timeSpent: 0, 
    institution: [], // Actualizado a array
    tema: [],        // Actualizado a array
    participants: '', 
    documentLink: '', 
};

// Stakeholder Constants
export const STAKEHOLDER_TYPE_OPTIONS = {
    'Public': 'public',
    'Private Sector': 'private',
    'Civil Society/NGOs': 'civil society and ngos',
};
export const STAKEHOLDER_AMBITO_OPTIONS = {
    'National': 'national',
    'International': 'international',
};
export const STAKEHOLDER_CATEGORY_OPTIONS = ['public', 'private', 'civil society and ngos'];

export const STAKEHOLDER_ROLE_OPTIONS = [
    "stakeholder.role.changes_policy", 
    "stakeholder.role.influences_policy",
    "stakeholder.role.technical", 
    "stakeholder.role.other" 
];
export const STAKEHOLDER_POSITION_OPTIONS = [
    "stakeholder.position.in_favor", 
    "stakeholder.position.against", 
    "stakeholder.position.neutral" 
];


// --- Constantes de Perfil de Miembro ---
export { ECUADOR_DATA };
export const ECUADOR_PROVINCES = Object.keys(ECUADOR_DATA).sort();

export const INDUSTRY_ACTIVITIES = [
    "Exportador", "Productor (Grower)", "Línea Naviera", "Puerto", 
    "Fabricante de Cajas de Cartón", "Fabricante de Plásticos (Fundas)", 
    "Insumos Agrícolas / Agroquímicos", "Fumigación Aérea", "Empacadora", 
    "Transporte Interno / Logística", "Servicios Legales / Asesoría", "Software / Tecnología", 
    "Investigación y Desarrollo", "Otro"
];

export const CERTIFICATIONS_LIST = [
    "Rainforest Alliance", "GlobalG.A.P.", "Fairtrade (Comercio Justo)", 
    "Orgánica (USDA, EU Organic)", "ISO 14001", "ISO 22000", "BASC", "Otro"
];

export const COMPANY_AREAS = [
    "Representante Legal", "Comercio Exterior / Exportaciones", "Producción / Fincas", 
    "Certificaciones / Sostenibilidad", "Finanzas / Contabilidad", "Legal", 
    "Recursos Humanos", "Logística / Transporte", "Tecnología (IT)", "Otro"
];

export const INITIAL_USER_PROFILE_STATE = {
    company: '',
    company_ruc: '',
    representative: '',
    representative_id: '',
    activity: INDUSTRY_ACTIVITIES[0],
    is_grower: false,
    exports_certified_products: false,
    export_certifications: [], 
    grows_certified_bananas: false,
    farm_certifications: [], 
    contacts: [], 
    farms: [], 
};

// --- Mapas para filtros de tablas ---
export const AGENDA_COLUMN_OPTIONS_MAP = {
    pilar: PILAR_OPTIONS,
    tipoDeActo: TIPO_DE_ACTO_OPTIONS,
    sector: SECTOR_OPTIONS,
    condicion: CONDICION_OPTIONS,
    agenda: AGENDA_OPTIONS,
    ano: ANO_OPTIONS.filter(opt => opt !== ALL_YEAR_FILTER), 
};

export const MILESTONE_COLUMN_OPTIONS_MAP = {
    ambito: AMBITO_OPTIONS,
    tipoDeActo: TIPO_DE_ACTO_MILESTONES_OPTIONS,
    ano: ANO_OPTIONS.filter(opt => opt !== ALL_YEAR_FILTER),
};

export const ACTIVITY_COLUMN_OPTIONS_MAP = {
    activityType: ACTIVITY_TYPE_OPTIONS,
    meetingMode: MEETING_MODE_OPTIONS,
};

// --- Constantes para Tablas de Perfil de Admin (ACTUALIZADO) ---

// 1. Columnas para la Pestaña de MIEMBROS
export const MEMBERS_PROFILE_TABLE_COLUMNS = [
    { labelKey: "profile.col.email", key: "email", sortable: true, filterable: true, type: 'string' },
    { labelKey: "profile.col.user_id", key: "id", sortable: false, filterable: true, type: 'string' },
    { labelKey: "profile.col.company", key: "company", sortable: true, filterable: true, type: 'string' },
    { labelKey: "profile.col.company_ruc", key: "company_ruc", sortable: false, filterable: true, type: 'string' },
    { labelKey: "profile.col.representative", key: "representative", sortable: true, filterable: true, type: 'string' },
    { labelKey: "profile.col.representative_id", key: "representative_id", sortable: false, filterable: true, type: 'string' },
    { labelKey: "profile.col.activity", key: "activity", sortable: true, filterable: true, optionsKey: 'activity', type: 'string' },
    { labelKey: "profile.col.is_grower", key: "is_grower", sortable: true, filterable: true, optionsKey: 'boolean', type: 'boolean' },
    { labelKey: "profile.col.export_certifications", key: "export_certifications", sortable: false, filterable: false, optionsKey: 'certifications', type: 'cert_array' },
    { labelKey: "profile.col.farm_certifications", key: "farm_certifications", sortable: false, filterable: false, optionsKey: 'certifications', type: 'cert_array' },
];

// 2. Columnas para la Pestaña de FINCAS
export const FARMS_PROFILE_TABLE_COLUMNS = [
    { labelKey: "profile.col.company", key: "company", sortable: true, filterable: true, type: 'string' },
    { labelKey: "profile.col.farm_province", key: "province", sortable: true, filterable: true, optionsKey: 'farm_province', type: 'string' },
    { labelKey: "profile.col.farm_city", key: "city", sortable: true, filterable: true, type: 'string' },
    { labelKey: "profile.col.farm_hectares", key: "hectares", sortable: true, filterable: true, type: 'number' },
    { labelKey: "profile.col.farm_workers", key: "workers", sortable: true, filterable: true, type: 'number' },
];

// 3. Columnas para la Pestaña de CONTACTOS
export const CONTACTS_PROFILE_TABLE_COLUMNS = [
    { labelKey: "profile.col.company", key: "company", sortable: true, filterable: true, type: 'string' },
    { labelKey: "profile.col.contact_name", key: "contact_name", sortable: true, filterable: true, type: 'string' },
    { labelKey: "profile.col.contact_email", key: "contact_email", sortable: true, filterable: true, type: 'string' },
    { labelKey: "profile.col.contact_phone", key: "contact_phone", sortable: false, filterable: true, type: 'string' },
    { labelKey: "profile.col.contact_area", key: "contact_area", sortable: true, filterable: true, optionsKey: 'contact_area', type: 'string' },
];

export const PROFILE_COLUMN_OPTIONS_MAP = {
    activity: INDUSTRY_ACTIVITIES,
    farm_province: ECUADOR_PROVINCES,
    certifications: CERTIFICATIONS_LIST,
    contact_area: COMPANY_AREAS, 
    boolean: ["Yes", "No"],
};

// Mapas de puntuación para el gráfico de stakeholders
export const ROLE_SCORE_MAP = {
    "stakeholder.role.other": 1,
    "stakeholder.role.technical": 2,
    "stakeholder.role.influences_policy": 3,
    "stakeholder.role.changes_policy": 4,
};

export const POSITION_SCORE_MAP = {
    "stakeholder.position.in_favor": 3,
    "stakeholder.position.neutral": 2,
    "stakeholder.position.against": 1,
};

// Constantes para Log de Prensa
export const PRESS_LOG_ACTIVITY_OPTIONS = [
    "Press Release", "Interview", "Social Media Post", "News Conference", "Other"
];
export const PRESS_LOG_FORMAT_OPTIONS = [
    "Online", "Newspaper", "Radio", "TV", "Other"
];
export const PRESS_LOG_REACH_OPTIONS = [
    "National", "International"
];
// --- NUEVAS CONSTANTES ---
export const IMPACT_OPTIONS = ["Positive", "Neutral", "Negative"];

// --- ESTADO INICIAL ACTUALIZADO ---
export const INITIAL_PRESS_LOG_STATE = {
    date: new Date().toISOString().slice(0, 10),
    agendaItems: [], // Nuevo
    otherAgendaItem: '', // Nuevo
    mediaEntries: [], // Nuevo (reemplaza mediaName y format)
    impact: IMPACT_OPTIONS[1], // Nuevo
    reach: PRESS_LOG_REACH_OPTIONS[0],
    audience: '',
    freePress: '',
    link: '',
    mediaStakeholderKeys: [], // Nuevo (reemplaza mediaStakeholders object)
};

// --- COLUMNAS DE TABLA ACTUALIZADAS ---
export const PRESS_LOG_TABLE_COLUMNS = [
    { labelKey: "press_log.col.date", key: "date", sortable: true, filterable: true, type: 'string' },
    { labelKey: "press_log.col.agenda_items", key: "agendaItems", sortable: false, filterable: true, type: 'array' },
    { labelKey: "press_log.col.media_entries", key: "mediaEntries", sortable: false, filterable: true, type: 'array' },
    { labelKey: "press_log.col.impact", key: "impact", sortable: true, filterable: true, optionsKey: 'impact', type: 'string' },
    { labelKey: "press_log.col.reach", key: "reach", sortable: true, filterable: true, optionsKey: 'reach', type: 'string' },
    { labelKey: "press_log.col.stakeholders", key: "mediaStakeholderKeys", sortable: false, filterable: true, type: 'array' },
    { labelKey: "press_log.col.link", key: "link", sortable: false, filterable: false, type: 'string' },
    { labelKey: "activity.col.actions", key: "actions", sortable: false, filterable: false, type: 'none' },
];

// --- MAPA DE FILTROS ACTUALIZADO ---
export const PRESS_LOG_COLUMN_OPTIONS_MAP = {
    impact: IMPACT_OPTIONS,
    reach: PRESS_LOG_REACH_OPTIONS,
    // format y activity ya no son columnas principales
};


// --- Constantes de Media Stakeholder (ACTUALIZADAS) ---
// Usar PRESS_LOG_FORMAT_OPTIONS para 'type'
export const MEDIA_STAKEHOLDER_CATEGORY_OPTIONS = PRESS_LOG_FORMAT_OPTIONS;

// --- NUEVO: Opciones de Alcance (Scope) ---
export const MEDIA_SCOPE_OPTIONS = ["National", "International", "Local", "Province"];
// Usar STAKEHOLDER_POSITION_OPTIONS (In Favor, Against, Neutral)

export const INITIAL_MEDIA_STAKEHOLDER_STATE = {
    name: '',
    type: MEDIA_STAKEHOLDER_CATEGORY_OPTIONS[0], // Default a 'Online'
    scope: MEDIA_SCOPE_OPTIONS[0], // Default a 'National'
    position: STAKEHOLDER_POSITION_OPTIONS[2], // Default a 'Neutral'
};

// Columnas para la tabla de Media Stakeholder (ACTUALIZADO)
export const MEDIA_STAKEHOLDER_TABLE_COLUMNS = [
    { labelKey: "stakeholder.col.name", key: "name", sortable: true, filterable: true, type: 'string' },
    { labelKey: "stakeholder.col.type", key: "type", sortable: true, filterable: true, optionsKey: 'type' }, 
    { labelKey: "stakeholder.col.position", key: "position", sortable: true, filterable: true, optionsKey: 'position' },
    { labelKey: "stakeholder.col.scope", key: "scope", sortable: true, filterable: true, optionsKey: 'scope' },
    { labelKey: "activity.col.actions", key: "actions", sortable: false, filterable: false, type: 'none' },
];

export const MEDIA_STAKEHOLDER_COLUMN_OPTIONS_MAP = {
    type: MEDIA_STAKEHOLDER_CATEGORY_OPTIONS,
    position: STAKEHOLDER_POSITION_OPTIONS.map(opt_key => ({ value: opt_key, label: opt_key })), // Se traducirá en el componente
    scope: MEDIA_SCOPE_OPTIONS,
};


// TAREA 2: Constantes para la Tabla de Cuotas de Membresía
export const MEMBERSHIP_TYPE_OPTIONS = ["Exporter", "Adherent"];

export const MEMBERSHIP_FEE_TABLE_COLUMNS = [
    { labelKey: "profile.col.company", key: "company", sortable: true, filterable: true, type: 'string' },
    { labelKey: "profile.activity", key: "activity", sortable: true, filterable: true, optionsKey: 'activity', type: 'string' },
    { labelKey: "finance.fees.col.type", key: "membershipType", sortable: true, filterable: true, optionsKey: 'membershipType', type: 'string' },
    { labelKey: "finance.fees.amount", key: "feeAmount", sortable: true, filterable: true, type: 'number' },
    { labelKey: "admin.actions", key: "actions", sortable: false, filterable: false, type: 'none' },
];

// --- ESTE ES EL EXPORT QUE FALTABA ---
export const MEMBERSHIP_FEE_COLUMN_OPTIONS_MAP = {
    activity: INDUSTRY_ACTIVITIES,
    membershipType: MEMBERSHIP_TYPE_OPTIONS,
};

// TAREA 3: Constantes para Donaciones
export const INITIAL_DONATION_STATE = {
    donor: '',
    purpose: '',
    relation: '',
    fundingSource: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    isContinued: false,
    link: '',
};

export const DONATION_TABLE_COLUMNS = [
    { labelKey: "finance.donations.col.donor", key: "donor", sortable: true, filterable: true, type: 'string' },
    { labelKey: "finance.donations.col.purpose", key: "purpose", sortable: false, filterable: true, type: 'string' },
    { labelKey: "finance.donations.col.relation", key: "relation", sortable: false, filterable: true, type: 'string' },
    { labelKey: "finance.donations.col.fundingSource", key: "fundingSource", sortable: false, filterable: true, type: 'string' },
    { labelKey: "finance.donations.col.amount", key: "amount", sortable: true, filterable: true, type: 'number' },
    { labelKey: "finance.donations.col.date", key: "date", sortable: true, filterable: true, type: 'string' },
    { labelKey: "finance.donations.col.isContinued", key: "isContinued", sortable: true, filterable: true, optionsKey: 'boolean', type: 'boolean' },
    { labelKey: "activity.col.link", key: "link", sortable: false, filterable: false, type: 'string' },
    { labelKey: "activity.col.actions", key: "actions", sortable: false, filterable: false, type: 'none' },
];

export const DONATION_COLUMN_OPTIONS_MAP = {
    boolean: ["Yes", "No"],
};

// TAREA 4: Constantes para Proyectos
export const FUNDING_SOURCE_OPTIONS = [
    "Donations", "Public Funds", "International Cooperation", "Self Financed", "Sales", "Other"
];

export const INITIAL_PROJECT_STATE = {
    name: '',
    amount: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    fundingSources: [],
    objectives: [],
    beneficiaries: [],
    locations: [],
    impactLink: '',
};

export const PROJECT_TABLE_COLUMNS = [
    { labelKey: "finance.projects.col.name", key: "name", sortable: true, filterable: true, type: 'string' },
    { labelKey: "finance.projects.col.amount", key: "amount", sortable: true, filterable: true, type: 'number' },
    { labelKey: "finance.projects.col.dates", key: "startDate", sortable: true, filterable: false, type: 'string' }, // Se usará para ordenar por fecha de inicio
    { labelKey: "finance.projects.col.fundingSources", key: "fundingSources", sortable: false, filterable: true, optionsKey: 'fundingSources', type: 'array' },
    { labelKey: "finance.projects.col.objectives", key: "objectives", sortable: false, filterable: true, type: 'array' },
    { labelKey: "finance.projects.col.beneficiaries", key: "beneficiaries", sortable: false, filterable: true, type: 'array' },
    { labelKey: "finance.projects.col.locations", key: "locations", sortable: false, filterable: true, type: 'array' },
    { labelKey: "finance.projects.col.impactLink", key: "impactLink", sortable: false, filterable: false, type: 'string' },
    { labelKey: "activity.col.actions", key: "actions", sortable: false, filterable: false, type: 'none' },
];

export const PROJECT_COLUMN_OPTIONS_MAP = {
    fundingSources: FUNDING_SOURCE_OPTIONS,
};

// TAREA 5: Constantes para Servicios
export const SERVICE_TYPE_OPTIONS = ["Workshop", "Certification", "Consulting", "Event", "Other"];
export const SERVICE_AREA_OPTIONS = ["Technical", "Legal", "Commercial", "Sustainability", "Other"];

export const INITIAL_SERVICE_STATE = {
    name: '',
    type: SERVICE_TYPE_OPTIONS[0],
    area: SERVICE_AREA_OPTIONS[0],
    amount: '',
    date: new Date().toISOString().slice(0, 10),
};

export const SERVICE_TABLE_COLUMNS = [
    { labelKey: "finance.services.col.name", key: "name", sortable: true, filterable: true, type: 'string' },
    { labelKey: "finance.services.col.type", key: "type", sortable: true, filterable: true, optionsKey: 'type', type: 'string' },
    { labelKey: "finance.services.col.area", key: "area", sortable: true, filterable: true, optionsKey: 'area', type: 'string' },
    { labelKey: "finance.services.col.amount", key: "amount", sortable: true, filterable: true, type: 'number' },
    { labelKey: "finance.col.date", key: "date", sortable: true, filterable: true, type: 'string' },
    { labelKey: "activity.col.actions", key: "actions", sortable: false, filterable: false, type: 'none' },
];

export const SERVICE_COLUMN_OPTIONS_MAP = {
    type: SERVICE_TYPE_OPTIONS,
    area: SERVICE_AREA_OPTIONS,
};

// TAREA 6: Constantes para Auditorías
export const INITIAL_AUDIT_STATE = {
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    auditor: '',
    goals: '',
    results: '',
    observations: '',
};

export const AUDIT_TABLE_COLUMNS = [
    { labelKey: "finance.audits.col.dates", key: "startDate", sortable: true, filterable: true, type: 'string' }, // Ordenar por fecha de inicio
    { labelKey: "finance.audits.col.auditor", key: "auditor", sortable: true, filterable: true, type: 'string' },
    { labelKey: "finance.audits.col.goals", key: "goals", sortable: false, filterable: true, type: 'string' },
    { labelKey: "finance.audits.col.results", key: "results", sortable: false, filterable: true, type: 'string' },
    { labelKey: "finance.audits.col.observations", key: "observations", sortable: false, filterable: true, type: 'string' },
    { labelKey: "activity.col.actions", key: "actions", sortable: false, filterable: false, type: 'none' },
];

export const AUDIT_COLUMN_OPTIONS_MAP = {
    // Todos los campos son de texto o fecha, no se necesitan opciones de select
};

// TAREA 7: Constantes para Proveedores y Relaciones
export const PROVIDER_TYPE_OPTIONS = ["Person", "Company"];
export const PROVIDER_PRODUCT_SERVICE_OPTIONS = ["Supplies", "Consulting", "Logistics", "Legal", "Technology", "Other"];
// Re-usaremos COMPANY_AREAS para 'area'

export const INITIAL_PROVIDER_STATE = {
    name: '',
    type: PROVIDER_TYPE_OPTIONS[0],
    productService: PROVIDER_PRODUCT_SERVICE_OPTIONS[0],
    serviceProvided: '',
    amount: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    isContinued: false,
    link: '',
    area: COMPANY_AREAS[0],
};

export const PROVIDER_TABLE_COLUMNS = [
    { labelKey: "finance.providers.col.name", key: "name", sortable: true, filterable: true, type: 'string' },
    { labelKey: "finance.providers.col.type", key: "type", sortable: true, filterable: true, optionsKey: 'type', type: 'string' },
    { labelKey: "finance.providers.col.productService", key: "productService", sortable: true, filterable: true, optionsKey: 'productService', type: 'string' },
    { labelKey: "finance.providers.col.serviceProvided", key: "serviceProvided", sortable: false, filterable: true, type: 'string' },
    { labelKey: "finance.providers.col.amount", key: "amount", sortable: true, filterable: true, type: 'number' },
    { labelKey: "finance.providers.col.dates", key: "startDate", sortable: true, filterable: true, type: 'string' },
    { labelKey: "finance.providers.col.isContinued", key: "isContinued", sortable: true, filterable: true, optionsKey: 'boolean', type: 'boolean' },
    { labelKey: "finance.providers.col.area", key: "area", sortable: true, filterable: true, optionsKey: 'area', type: 'string' },
    { labelKey: "activity.col.link", key: "link", sortable: false, filterable: false, type: 'string' },
    { labelKey: "activity.col.actions", key: "actions", sortable: false, filterable: false, type: 'none' },
];

export const PROVIDER_COLUMN_OPTIONS_MAP = {
    type: PROVIDER_TYPE_OPTIONS,
    productService: PROVIDER_PRODUCT_SERVICE_OPTIONS,
    area: COMPANY_AREAS,
    boolean: ["Yes", "No"],
};

// --- NUEVAS CONSTANTES PARA SOCIOS ---
export const PARTNER_AREA_OPTIONS = ["Sostenibilidad", "Comercio", "Legal", "Tecnología", "Otro"];

export const INITIAL_PARTNER_STATE = {
    name: '',
    area: PARTNER_AREA_OPTIONS[0],
    contact_person: '',
    contact_email: '',
    agreement_link: '',
};

export const PARTNER_TABLE_COLUMNS = [
    { labelKey: "finance.relations.partner.col.name", key: "name", sortable: true, filterable: true, type: 'string' },
    { labelKey: "finance.relations.partner.col.area", key: "area", sortable: true, filterable: true, optionsKey: 'area', type: 'string' },
    { labelKey: "finance.relations.partner.col.contact_person", key: "contact_person", sortable: true, filterable: true, type: 'string' },
    { labelKey: "finance.relations.partner.col.contact_email", key: "contact_email", sortable: true, filterable: true, type: 'string' },
    { labelKey: "finance.relations.partner.col.agreement_link", key: "agreement_link", sortable: false, filterable: false, type: 'string' },
    { labelKey: "activity.col.actions", key: "actions", sortable: false, filterable: false, type: 'none' },
];

export const PARTNER_COLUMN_OPTIONS_MAP = {
    area: PARTNER_AREA_OPTIONS,
};

// Columnas para la tabla de Donantes (solo lectura)
export const DONORS_READONLY_TABLE_COLUMNS = [
    { labelKey: "finance.donations.col.donor", key: "donor", sortable: true, filterable: true, type: 'string' },
    { labelKey: "finance.donations.col.purpose", key: "purpose", sortable: false, filterable: true, type: 'string' },
    { labelKey: "finance.donations.col.amount", key: "amount", sortable: true, filterable: true, type: 'number' },
    { labelKey: "finance.donations.col.date", key: "date", sortable: true, filterable: true, type: 'string' },
];

// Columnas para la tabla de Beneficiarios (solo lectura)
export const BENEFICIARIES_READONLY_TABLE_COLUMNS = [
    { labelKey: "profile.col.company", key: "company", sortable: true, filterable: true, type: 'string' },
    { labelKey: "profile.col.representative", key: "representative", sortable: true, filterable: true, type: 'string' },
    { labelKey: "profile.activity", key: "activity", sortable: true, filterable: true, optionsKey: 'activity', type: 'string' },
    { labelKey: "profile.col.farms", key: "farms", sortable: false, filterable: true, type: 'farms_array' },
];

// TAREA 10: Constantes para Solicitud de Miembros (ACTUALIZADO)
export const MEMBER_REQUEST_STATUS_OPTIONS = ["Low", "Medium", "High"];
export const INITIAL_MEMBER_REQUEST_STATE = {
    company_name: '',
    commercial_name: '',
    legal_rep: '',
    ceo: '',
    partners: [], // Actualizado a array
    activity: INDUSTRY_ACTIVITIES[0],
    country: 'Ecuador', // Nuevo campo
    province: ECUADOR_PROVINCES[0],
    city: ECUADOR_DATA[ECUADOR_PROVINCES[0]][0], 
    commercial_refs: [], // Actualizado a array
    risk_status: MEMBER_REQUEST_STATUS_OPTIONS[0],
    risk_link: '', // Nuevo campo
};

// TAREA 1: Constantes para Costos (Resumen Financiero)
export const COST_CATEGORIES_ADMIN = [
    "Salarios", "Arriendo", "Servicios Básicos", "Suministros Oficina", "Otro"
];
export const COST_CATEGORIES_NON_OP = [
    "Impuestos", "Intereses Bancarios", "Multas", "Otro"
];

export const INITIAL_COST_STATE_ADMIN = {
    date: new Date().toISOString().slice(0, 10),
    category: COST_CATEGORIES_ADMIN[0],
    description: '',
    amount: '',
};

export const INITIAL_COST_STATE_NON_OP = {
    date: new Date().toISOString().slice(0, 10),
    category: COST_CATEGORIES_NON_OP[0],
    description: '',
    amount: '',
};

// Columnas reutilizables para ambas tablas de costos
export const COST_TABLE_COLUMNS = [
    { labelKey: "finance.col.date", key: "date", sortable: true, filterable: true, type: 'string' },
    { labelKey: "finance.col.category", key: "category", sortable: true, filterable: true, optionsKey: 'category', type: 'string' },
    { labelKey: "finance.col.description", key: "description", sortable: true, filterable: true, type: 'string' },
    { labelKey: "finance.col.amount", key: "amount", sortable: true, filterable: true, type: 'number' },
    { labelKey: "activity.col.actions", key: "actions", sortable: false, filterable: false, type: 'none' },
];

// Mapas de opciones para los filtros de las tablas de costos
export const COST_COLUMN_OPTIONS_MAP_ADMIN = {
    category: COST_CATEGORIES_ADMIN,
};
export const COST_COLUMN_OPTIONS_MAP_NON_OP = {
    category: COST_CATEGORIES_NON_OP,
};