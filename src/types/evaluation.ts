export type Company = 'trebolife' | 'traduce' | null;

export interface EvaluationState {
  sessionId: string;
  name: string;
  phone: string;
  company: Company;
  currentStep: number;
  startTime: string;
  completedAt?: string;

  // Step data
  location: string;
  availability: string;
  experience: string;
  closingRole: string;
  closingVolume: string;
  dailyCalls: number;
  lastIncome: number;
  exitReason: string;
  reactivationMsg: string;
  objectionResponse: string;
  autonomyDesc: string;
  philosophy: string;
  philosophyExplanation: string;
  verificationAnswer: string;
  jobCount: string;
  financialSituation: string;
  // Trebolife-specific (also reused for future companies)
  rampUpExpectation: string;
  churnPrevention: string;
  // FASE 10 — apertura inbound (solo trebolife / traduce)
  inboundOpen: string;
  // FASE 10 — preferencia de idioma (solo trebolife / traduce)
  languagePref: 'es' | 'es_en' | '';
  // FASE 10 — URL Loom de presentación (opcional, candidato elige)
  loomUrl: string;
  email: string;
  age: number | null;
  maritalStatus: string;
  cvUrl: string;
  linkedinUrl: string;
  assignedTo: string;
  calendarUrl: string;

  // Scoring
  scores: ScoreBreakdown;
  totalScore: number;
  flags: EvaluationFlags;
  disqualifyReason: string | null;
  status: EvaluationStatus;
  highlight: string;
}

export interface ScoreBreakdown {
  E1_cierre: number;
  E1_volumen: number;
  E3_copywriting: number;
  E4_objeciones: number;
  E5_autonomia: number;
  E6_filosofia: number;
  C1_estabilidad: number;
  V1_penalty: number;
  E2_penalty: number;
  Ramp1_velocidad: number;  // velocidad de ramp-up para llegar a cuota (Trebolife)
}

export interface EvaluationFlags {
  consintio_proceso: boolean;
  narrativa_inconsistente: boolean;
  baja_ejecucion: boolean;
  riesgo_retencion: boolean;
  b_verif_aplicada: boolean;
}

export type EvaluationStatus = 'en_progreso' | 'elite' | 'calificado' | 'potencial' | 'descartado';

export const DISQUALIFY_REASONS: Record<string, string> = {
  'rechazo_inicial': 'disposición para iniciar el proceso',
  'sin_disponibilidad': 'disponibilidad de tiempo completo',
  'sin_ventas_telefonicas': 'experiencia en ventas remotas',
  'sin_cierre_directo': 'experiencia en cierre directo de ventas',
  'sin_copywriting': 'habilidades de seguimiento activo',
  'sin_objeciones': 'técnicas de manejo de objeciones',
  'sin_runway': 'estabilidad durante el período de arranque',
  'sin_ramp_up': 'velocidad de arranque para cumplir cuota desde el primer mes',
  'no_envio_cv': 'documentación completa del perfil',
};

// Pasos que se SALTAN para cada empresa (referenciados por índice en el flujo legacy).
// Trebolife / Traduce (FASE 10): skip Consent(0), Verification(9).
// Step 8 ahora se REUSA para InboundOpen (StepRenderer lo intercambia con
// PhilosophyStep según company). Step 12 NO se skipea — se reemplaza con
// ChurnResistance.
export const SKIPPED_STEPS_BY_COMPANY: Record<string, Set<number>> = {
  trebolife: new Set([0, 9]),
  traduce: new Set([0, 9]),
};

export function getSkippedSteps(company: Company): Set<number> {
  if (!company) return new Set();
  return SKIPPED_STEPS_BY_COMPANY[company] ?? new Set();
}

// Total de pasos visibles en el progress bar.
// Trebolife/Traduce (FASE 10): 12 visibles (incluye nuevo InboundOpen en step 8).
export function getTotalVisibleSteps(company: Company): number {
  if (company === 'trebolife') return 12;
  if (company === 'traduce') return 12;
  return 12; // legacy
}

export function createInitialState(name: string, phone: string, company: Company = null): EvaluationState {
  // Trebolife and Traduce flows skip Consent (step 0) — start directly in BasicInfo (step 1).
  const startStep = (company === 'trebolife' || company === 'traduce') ? 1 : 0;
  return {
    sessionId: crypto.randomUUID(),
    name,
    phone,
    company,
    currentStep: startStep,
    startTime: new Date().toISOString(),
    location: '',
    availability: '',
    experience: '',
    closingRole: '',
    closingVolume: '',
    dailyCalls: 0,
    lastIncome: 0,
    exitReason: '',
    reactivationMsg: '',
    objectionResponse: '',
    autonomyDesc: '',
    philosophy: '',
    philosophyExplanation: '',
    verificationAnswer: '',
    jobCount: '',
    financialSituation: '',
    rampUpExpectation: '',
    churnPrevention: '',
    inboundOpen: '',
    languagePref: '',
    loomUrl: '',
    email: '',
    age: null,
    maritalStatus: '',
    cvUrl: '',
    linkedinUrl: '',
    assignedTo: '',
    calendarUrl: '',
    scores: {
      E1_cierre: 0,
      E1_volumen: 0,
      E3_copywriting: 0,
      E4_objeciones: 0,
      E5_autonomia: 0,
      E6_filosofia: 0,
      C1_estabilidad: 0,
      V1_penalty: 0,
      E2_penalty: 0,
      Ramp1_velocidad: 0,
    },
    totalScore: 0,
    flags: {
      consintio_proceso: false,
      narrativa_inconsistente: false,
      baja_ejecucion: false,
      riesgo_retencion: false,
      b_verif_aplicada: false,
    },
    disqualifyReason: null,
    status: 'en_progreso',
    highlight: '',
  };
}
