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
// Trebolife: skip Consent(0), Philosophy(8), Verification(9).
// El step 12 NO se skipea — StepRenderer lo reemplaza con ChurnResistance
// para Trebolife (en lugar del PreReg legacy de edad/marital). Esto era
// un bug pre-existente: tenía 12 en el set, así que el step se saltaba
// sin renderear ChurnResistance, y churnPrevention quedaba vacío en DB.
export const SKIPPED_STEPS_BY_COMPANY: Record<string, Set<number>> = {
  trebolife: new Set([0, 8, 9]),
  traduce: new Set([]), // pendiente Fase 2.C-Traduce
};

export function getSkippedSteps(company: Company): Set<number> {
  if (!company) return new Set();
  return SKIPPED_STEPS_BY_COMPANY[company] ?? new Set();
}

// Total de pasos visibles en el progress bar (para Trebolife: 10 visibles + Churn = 11)
export function getTotalVisibleSteps(company: Company): number {
  if (company === 'trebolife') return 11;
  return 12; // legacy
}

export function createInitialState(name: string, phone: string, company: Company = null): EvaluationState {
  // Trebolife flow skips Consent (step 0) — arrancamos directo en BasicInfo (step 1).
  const startStep = company === 'trebolife' ? 1 : 0;
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
