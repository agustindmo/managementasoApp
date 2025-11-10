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

// MODIFICACIÓN: Añadir 'mediaStakeholders' a INITIAL_PRESS_LOG_STATE
export const INITIAL_PRESS_LOG_STATE = {
    date: new Date().toISOString().slice(0, 10),
    activity: PRESS_LOG_ACTIVITY_OPTIONS[0],
    format: [], 
    mediaName: '',
    reach: PRESS_LOG_REACH_OPTIONS[0],
    audience: '',
    freePress: '',
    link: '',
    mediaStakeholders: [], // ¡NUEVO CAMPO AÑADIDO!
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

// TAREA 2: Constantes para la Tabla de Cuotas de Membresía
export const MEMBERSHIP_TYPE_OPTIONS = ["Exporter", "Adherent"];

export const MEMBERSHIP_FEE_TABLE_COLUMNS = [
    { labelKey: "profile.col.company", key: "company", sortable: true, filterable: true, type: 'string' },
    { labelKey: "profile.activity", key: "activity", sortable: true, filterable: true, optionsKey: 'activity', type: 'string' },
    { labelKey: "finance.fees.col.type", key: "membershipType", sortable: true, filterable: true, optionsKey: 'membershipType', type: 'string' },
    { labelKey: "finance.fees.amount", key: "feeAmount", sortable: true, filterable: true, type: 'number' },
    { labelKey: "admin.actions", key: "actions", sortable: false, filterable: false, type: 'none' },
];

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

// TAREA (Media Stakeholders): Constantes para Media Stakeholders
// Duplicadas de las constantes de stakeholders existentes
export const MEDIA_STAKEHOLDER_TYPE_OPTIONS = {
    'Public': 'public',
    'Private Sector': 'private',
    'Civil Society/NGOs': 'civil society and ngos',
    'Media': 'media', // Añadida una nueva categoría relevante
};
export const MEDIA_STAKEHOLDER_AMBITO_OPTIONS = {
    'National': 'national',
    'International': 'international',
};
export const MEDIA_STAKEHOLDER_CATEGORY_OPTIONS = ['public', 'private', 'civil society and ngos', 'media'];

export const MEDIA_STAKEHOLDER_ROLE_OPTIONS = [
    "stakeholder.role.changes_policy", // Reutilizamos claves de traducción
    "stakeholder.role.influences_policy",
    "stakeholder.role.technical", 
    "stakeholder.role.other" 
];
export const MEDIA_STAKEHOLDER_POSITION_OPTIONS = [
    "stakeholder.position.in_favor", 
    "stakeholder.position.against", 
    "stakeholder.position.neutral" 
];

export const INITIAL_MEDIA_STAKEHOLDER_STATE = {
    name: '',
    type: Object.values(MEDIA_STAKEHOLDER_TYPE_OPTIONS)[3], // Default a 'media'
    ambito: Object.values(MEDIA_STAKEHOLDER_AMBITO_OPTIONS)[0], 
    role: MEDIA_STAKEHOLDER_ROLE_OPTIONS[1], // Default a 'influencer'
    position: MEDIA_STAKEHOLDER_POSITION_OPTIONS[2], // Default a 'neutral'
};

// Columnas para la nueva tabla de Media Stakeholder Map
export const MEDIA_STAKEHOLDER_TABLE_COLUMNS = [
    { labelKey: "stakeholder.col.name", key: "name", sortable: true, filterable: true, type: 'string' }, // Reutiliza clave de traducción
    { labelKey: "stakeholder.col.scope", key: "ambito", sortable: true, filterable: true, options: Object.values(MEDIA_STAKEHOLDER_AMBITO_OPTIONS) }, 
    { labelKey: "press_log.col.media", key: "pressLogItems", sortable: false, filterable: true, type: 'string' }, // Cambiado de 'agendaItems'
    { labelKey: "press_log.col.reach", key: "reaches", sortable: false, filterable: true, optionsKey: 'reach', type: 'string' }, // Nuevo
    { labelKey: "policy.col.ano", key: "years", sortable: true, filterable: true, options: ANO_OPTIONS.filter(opt => opt !== ALL_YEAR_FILTER) }, 
    { labelKey: "stakeholder.col.total_engagements", key: "totalCount", sortable: true, filterable: false, type: 'number' },
];

export const MEDIA_STAKEHOLDER_COLUMN_OPTIONS_MAP = {
    ambito: Object.values(MEDIA_STAKEHOLDER_AMBITO_OPTIONS),
    reach: PRESS_LOG_REACH_OPTIONS, // Reutiliza las opciones de alcance
    type: MEDIA_STAKEHOLDER_CATEGORY_OPTIONS,
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