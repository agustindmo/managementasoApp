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

export const INITIAL_ACTIVITY_STATE = {
    activityType: ACTIVITY_TYPE_OPTIONS[0], 
    meetingMode: MEETING_MODE_OPTIONS[0], 
    date: new Date().toISOString().slice(0, 10), 
    timeSpent: 0, 
    institution: '', 
    tema: '', 
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

// --- Constantes para Tabla de Perfiles de Admin ---
export const PROFILE_TABLE_COLUMNS = [
    { labelKey: "profile.col.email", key: "email", sortable: true, filterable: true, type: 'string' },
    { labelKey: "profile.col.user_id", key: "id", sortable: false, filterable: true, type: 'string' },
    { labelKey: "profile.col.company", key: "company", sortable: true, filterable: true, type: 'string' },
    { labelKey: "profile.col.company_ruc", key: "company_ruc", sortable: false, filterable: true, type: 'string' },
    { labelKey: "profile.col.representative", key: "representative", sortable: true, filterable: true, type: 'string' },
    { labelKey: "profile.col.representative_id", key: "representative_id", sortable: false, filterable: true, type: 'string' },
    { labelKey: "profile.col.activity", key: "activity", sortable: true, filterable: true, optionsKey: 'activity', type: 'string' },
    { labelKey: "profile.col.is_grower", key: "is_grower", sortable: true, filterable: true, optionsKey: 'boolean', type: 'boolean' },
    { labelKey: "profile.col.farms", key: "farms", sortable: false, filterable: true, type: 'farms_array' },
    { labelKey: "profile.col.export_certifications", key: "export_certifications", sortable: false, filterable: true, optionsKey: 'certifications', type: 'cert_array' },
    { labelKey: "profile.col.farm_certifications", key: "farm_certifications", sortable: false, filterable: true, optionsKey: 'certifications', type: 'cert_array' },
    { labelKey: "profile.col.contacts", key: "contacts", sortable: false, filterable: true, type: 'contacts_array' },
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
    "stakeholder.position.against": 1,
    "stakeholder.position.neutral": 2,
    "stakeholder.position.in_favor": 3,
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
export const INITIAL_PRESS_LOG_STATE = {
    date: new Date().toISOString().slice(0, 10),
    activity: PRESS_LOG_ACTIVITY_OPTIONS[0],
    format: [], 
    mediaName: '',
    reach: PRESS_LOG_REACH_OPTIONS[0],
    audience: '',
    freePress: '',
    link: '',
};
export const PRESS_LOG_TABLE_COLUMNS = [
    { labelKey: "press_log.col.date", key: "date", sortable: true, filterable: true, type: 'string' },
    { labelKey: "press_log.col.activity", key: "activity", sortable: true, filterable: true, optionsKey: 'activity', type: 'string' },
    { labelKey: "press_log.col.media", key: "mediaName", sortable: true, filterable: true, type: 'string' },
    { labelKey: "press_log.col.format", key: "format", sortable: false, filterable: true, optionsKey: 'format', type: 'array' },
    { labelKey: "press_log.col.reach", key: "reach", sortable: true, filterable: true, optionsKey: 'reach', type: 'string' },
    { labelKey: "press_log.col.audience", key: "audience", sortable: true, filterable: true, type: 'number' },
    { labelKey: "press_log.col.free_press", key: "freePress", sortable: true, filterable: true, type: 'number' },
    { labelKey: "press_log.col.link", key: "link", sortable: false, filterable: false, type: 'string' },
    { labelKey: "activity.col.actions", key: "actions", sortable: false, filterable: false, type: 'none' },
];
export const PRESS_LOG_COLUMN_OPTIONS_MAP = {
    activity: PRESS_LOG_ACTIVITY_OPTIONS,
    format: PRESS_LOG_FORMAT_OPTIONS,
    reach: PRESS_LOG_REACH_OPTIONS,
};

// TAREA 10: Constantes para Solicitud de Miembros
export const MEMBER_REQUEST_STATUS_OPTIONS = ["Low", "Medium", "High"];
export const INITIAL_MEMBER_REQUEST_STATE = {
    company_name: '',
    commercial_name: '',
    legal_rep: '',
    ceo: '',
    partners: '',
    activity: INDUSTRY_ACTIVITIES[0],
    province: ECUADOR_PROVINCES[0],
    city: ECUADOR_DATA[ECUADOR_PROVINCES[0]][0], // Ciudad por defecto
    commercial_refs: '',
    risk_status: MEMBER_REQUEST_STATUS_OPTIONS[0],
};